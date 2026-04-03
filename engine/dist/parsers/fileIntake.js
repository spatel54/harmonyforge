/**
 * Unified buffer + filename → ParsedScore for generate / validate / CLI.
 * ZIP sniff (MXL mislabeled as .xml), PDF via pdfalto (ALTO + embedded MusicXML) + poppler + oemer, then extension routing.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { parseMIDI } from "./midiParser.js";
import { parseMusicXML } from "./musicxmlParser.js";
import { parseMXL } from "./mxlParser.js";
export const ACCEPTED_EXTENSIONS_MESSAGE = ".xml, .musicxml, .mxl, .mid, .midi, or .pdf (PDF needs pdfalto, Poppler pdftoppm, and oemer on the server; see docs)";
const LOG_PREVIEW = 800;
/** Include this much of subprocess stderr/stdout in API error details (oemer failures). */
const DETAIL_OUTPUT_MAX = 1_800;
const DEFAULT_PDF_ALTO_MS = 60_000;
/** First oemer run downloads ONNX checkpoints over HTTPS; allow up to 15 minutes. */
const DEFAULT_OMR_MS = 900_000;
/** Local file header or empty/spanned ZIP signatures */
export function isProbablyZip(buffer) {
    if (buffer.length < 4)
        return false;
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b)
        return false;
    const sig = buffer.readUInt16LE(2);
    return sig === 0x0403 || sig === 0x0605 || sig === 0x0807;
}
export function isProbablyPdf(buffer) {
    if (buffer.length < 4)
        return false;
    return buffer.subarray(0, 4).toString("latin1") === "%PDF";
}
export function getExtension(originalname) {
    return (originalname.split(".").pop() ?? "").toLowerCase();
}
function firstExistingBin(candidates) {
    for (const p of candidates) {
        if (existsSync(p))
            return p;
    }
    return null;
}
/** Walk up from engine/parsers (or dist/parsers) until pdfalto/pdfalto exists — works when cwd ≠ repo root. */
function findPdfAltoByWalkingUp(fromDir) {
    let dir = fromDir;
    for (let i = 0; i < 10; i++) {
        const candidate = join(dir, "pdfalto", "pdfalto");
        if (existsSync(candidate))
            return candidate;
        if (process.platform === "win32") {
            const win = `${candidate}.exe`;
            if (existsSync(win))
                return win;
        }
        const parent = dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return null;
}
/** Entry script dir (tsx/server/jest) — often repo-linked even when cwd differs from repo root. */
function resolveScriptRootDir() {
    const main = process.argv[1];
    if (typeof main === "string" && main.length > 0) {
        return dirname(main);
    }
    return process.cwd();
}
function resolvePdfAltoBin() {
    const env = process.env.PDFALTO_BIN?.trim();
    if (env && existsSync(env))
        return env;
    for (const start of [resolveScriptRootDir(), process.cwd()]) {
        const found = findPdfAltoByWalkingUp(start);
        if (found)
            return found;
    }
    return null;
}
function resolvePdftoppm() {
    const env = process.env.POPPLER_PDFTOPPM?.trim();
    if (env && env.length > 0)
        return env;
    if (process.platform === "darwin") {
        const found = firstExistingBin([
            "/opt/homebrew/bin/pdftoppm",
            "/usr/local/bin/pdftoppm",
        ]);
        if (found)
            return found;
    }
    return "pdftoppm";
}
/** python.org macOS installs often land here; GUI-spawned Node may not have this on PATH. */
function resolveOemerDarwinFramework() {
    const base = "/Library/Frameworks/Python.framework/Versions";
    if (!existsSync(base))
        return null;
    try {
        const versions = readdirSync(base).filter((v) => v !== "Current");
        for (const v of [...versions].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))) {
            const p = join(base, v, "bin", "oemer");
            if (existsSync(p))
                return p;
        }
    }
    catch {
        return null;
    }
    return null;
}
function resolveOemer() {
    const env = process.env.OEMER_BIN?.trim();
    if (env && env.length > 0)
        return env;
    if (process.platform === "darwin") {
        const found = firstExistingBin([
            join(homedir(), ".local/bin/oemer"),
            "/opt/homebrew/bin/oemer",
            "/usr/local/bin/oemer",
        ]);
        if (found)
            return found;
        const fw = resolveOemerDarwinFramework();
        if (fw)
            return fw;
    }
    return "oemer";
}
/** Extract first score-partwise or score-timewise document from concatenated text (e.g. ALTO CONTENT). */
export function extractEmbeddedMusicXml(fullText) {
    const pwOpen = "<score-partwise";
    const pwClose = "</score-partwise>";
    const twOpen = "<score-timewise";
    const twClose = "</score-timewise>";
    let start = fullText.indexOf(pwOpen);
    let closeTag = pwClose;
    if (start < 0) {
        start = fullText.indexOf(twOpen);
        closeTag = twClose;
    }
    if (start < 0)
        return null;
    const end = fullText.indexOf(closeTag, start);
    if (end < 0)
        return null;
    return fullText.slice(start, end + closeTag.length);
}
/** Collect text from ALTO String @CONTENT (handles default namespace). */
export function collectAltoTextContent(altoXml) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        removeNSPrefix: true,
    });
    let doc;
    try {
        doc = parser.parse(altoXml);
    }
    catch {
        return "";
    }
    const chunks = [];
    const walk = (node) => {
        if (node == null)
            return;
        if (typeof node === "string") {
            chunks.push(node);
            return;
        }
        if (Array.isArray(node)) {
            node.forEach(walk);
            return;
        }
        if (typeof node !== "object")
            return;
        const o = node;
        for (const [k, v] of Object.entries(o)) {
            if (k === "String" || k.endsWith(":String")) {
                const arr = Array.isArray(v) ? v : [v];
                for (const s of arr) {
                    if (s && typeof s === "object") {
                        const r = s;
                        const c = r["@_CONTENT"] ?? r["@_content"];
                        if (typeof c === "string" && c.length)
                            chunks.push(c);
                    }
                }
            }
            walk(v);
        }
    };
    walk(doc);
    return chunks.join("\n");
}
function logSpawnFailure(label, result) {
    const errBits = [result.stderr, result.stdout]
        .filter(Boolean)
        .join("\n")
        .slice(0, LOG_PREVIEW);
    if (errBits)
        console.error(`[fileIntake] ${label} failed:`, errBits);
}
/** Surface subprocess output in the JSON/HTTP error so users do not need server logs. */
function appendSpawnOutputExcerpt(label, result, details) {
    const combined = [result.stderr, result.stdout]
        .filter(Boolean)
        .join("\n")
        .trim()
        .replace(/\r\n/g, "\n");
    if (!combined.length)
        return;
    const excerpt = combined.slice(0, DETAIL_OUTPUT_MAX);
    const suffix = combined.length > DETAIL_OUTPUT_MAX ? "\n… (truncated)" : "";
    details.push(`${label} output:\n${excerpt}${suffix}`);
}
function tryParseMusicXmlFiles(paths) {
    let best = null;
    let bestLen = 0;
    for (const p of paths) {
        if (!existsSync(p))
            continue;
        try {
            const xml = readFileSync(p, "utf-8");
            const parsed = parseMusicXML(xml);
            const n = parsed?.melody.length ?? 0;
            if (n > bestLen) {
                bestLen = n;
                best = parsed;
            }
        }
        catch {
            // skip
        }
    }
    return best && best.melody.length > 0 ? best : null;
}
function collectMusicXmlPaths(absDir) {
    const out = [];
    const walk = (d) => {
        let entries;
        try {
            entries = readdirSync(d, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const e of entries) {
            const full = join(d, e.name);
            if (e.isDirectory())
                walk(full);
            else if (e.isFile() && /\.(musicxml|xml)$/i.test(e.name))
                out.push(full);
        }
    };
    walk(absDir);
    return out;
}
function tryPdfAltoEmbeddedMusicXml(pdfPath, tmpDir, timeoutMs, details) {
    const bin = resolvePdfAltoBin();
    if (!bin) {
        details.push("pdfalto: binary not found (build with `make pdfalto` from repo root, or set PDFALTO_BIN to the executable)");
        return null;
    }
    const altoPath = join(tmpDir, "alto.xml");
    const result = spawnSync(bin, ["-readingOrder", "-onlyGraphsCoord", "-q", pdfPath, altoPath], { encoding: "utf-8", timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 });
    if (result.error) {
        details.push(`pdfalto: could not run (${result.error.message})`);
        return null;
    }
    if (result.status !== 0) {
        logSpawnFailure("pdfalto", result);
        details.push("pdfalto: exited with an error (check server stderr logs)");
        return null;
    }
    if (!existsSync(altoPath)) {
        details.push("pdfalto: expected output ALTO XML was missing");
        return null;
    }
    let altoXml;
    try {
        altoXml = readFileSync(altoPath, "utf-8");
    }
    catch {
        details.push("pdfalto: could not read ALTO output file");
        return null;
    }
    const blob = collectAltoTextContent(altoXml);
    const snippet = extractEmbeddedMusicXml(blob);
    if (!snippet) {
        details.push("pdfalto: no MusicXML embedded in ALTO text (usual for engraved/scanned scores — trying OMR next)");
        return null;
    }
    const parsed = parseMusicXML(snippet);
    if (!parsed || parsed.melody.length === 0) {
        details.push("pdfalto: embedded MusicXML fragment did not yield a melody");
        return null;
    }
    return parsed;
}
function tryOemerOnFirstPage(pdfPath, tmpDir, timeoutMs, details) {
    const pdftoppm = resolvePdftoppm();
    const prefix = join(tmpDir, "page");
    const ppm = spawnSync(pdftoppm, ["-png", "-r", "300", "-f", "1", "-l", "1", pdfPath, prefix], { encoding: "utf-8", timeout: 120_000, maxBuffer: 10 * 1024 * 1024 });
    if (ppm.error) {
        details.push(`pdftoppm: not runnable (${ppm.error.message}) — install Poppler and ensure it is on PATH (brew install poppler), or set POPPLER_PDFTOPPM`);
        return null;
    }
    if (ppm.status !== 0) {
        logSpawnFailure("pdftoppm", ppm);
        details.push("pdftoppm: failed to rasterize PDF page 1 (corrupt PDF or missing Poppler)");
        return null;
    }
    const pngPath = join(tmpDir, "page-1.png");
    if (!existsSync(pngPath)) {
        details.push("pdftoppm: expected page-1.png was not created");
        return null;
    }
    const omrOut = join(tmpDir, "omr");
    const oemer = resolveOemer();
    const omr = spawnSync(oemer, [pngPath, "-o", omrOut], {
        encoding: "utf-8",
        timeout: timeoutMs,
        maxBuffer: 50 * 1024 * 1024,
        cwd: tmpDir,
    });
    if (omr.error) {
        details.push(`oemer: not runnable (${omr.error.message}) — run \`make install\` (requirements.txt + oemer --no-deps) or set OEMER_BIN`);
        return null;
    }
    if (omr.status !== 0) {
        logSpawnFailure("oemer", omr);
        details.push("oemer: failed — first run must download ONNX checkpoints over HTTPS (can take several minutes). Prefer Python 3.10–3.12 + onnxruntime wheels; Python 3.14 often breaks downloads or onnx. Manual checkpoints: https://github.com/BreezeWhite/oemer/releases/tag/checkpoints");
        appendSpawnOutputExcerpt("oemer", omr, details);
        return null;
    }
    if (!existsSync(omrOut)) {
        details.push("oemer: output directory was not created");
        return null;
    }
    const paths = collectMusicXmlPaths(omrOut);
    if (paths.length === 0) {
        details.push("oemer: no .musicxml/.xml files in output (OMR may have failed silently or this page has no readable notation)");
        return null;
    }
    const parsed = tryParseMusicXmlFiles(paths);
    if (!parsed) {
        details.push("oemer: output files did not parse to a melody in HarmonyForge");
        return null;
    }
    return parsed;
}
function pdfPipelineFailureMessage(details) {
    const base = "PDF could not be converted to a melody. Setup: (1) pdfalto — `make pdfalto` from repo root or see pdfalto/Readme.md, or set PDFALTO_BIN; " +
        "(2) Poppler `pdftoppm` (e.g. brew install poppler / apt install poppler-utils), optional POPPLER_PDFTOPPM; " +
        "(3) Python OMR — `make install` installs requirements.txt then oemer (see repo requirements.txt), or set OEMER_BIN. " +
        "Only the first PDF page is used. On macOS, if tools work in Terminal but not here, launch the engine with PATH including /opt/homebrew/bin (see package.json dev:backend) or set PDFALTO_BIN / POPPLER_PDFTOPPM / OEMER_BIN.";
    if (details.length === 0)
        return base;
    return `${base}\n\nDetails:\n- ${details.join("\n- ")}`;
}
function tryPdfPipeline(buffer, pdfAltoTimeoutMs, omrTimeoutMs) {
    const details = [];
    const tmpDir = mkdtempSync(join(tmpdir(), "hf-pdf-"));
    const pdfPath = join(tmpDir, "input.pdf");
    try {
        writeFileSync(pdfPath, buffer);
        const fromAlto = tryPdfAltoEmbeddedMusicXml(pdfPath, tmpDir, pdfAltoTimeoutMs, details);
        if (fromAlto && fromAlto.melody.length > 0) {
            return { parsed: fromAlto, details: [] };
        }
        const fromOmr = tryOemerOnFirstPage(pdfPath, tmpDir, omrTimeoutMs, details);
        if (fromOmr && fromOmr.melody.length > 0) {
            return { parsed: fromOmr, details: [] };
        }
        return { parsed: null, details };
    }
    catch (e) {
        console.error("[fileIntake] pdf pipeline error:", e);
        details.push(`unexpected error: ${e instanceof Error ? e.message : String(e)}`);
        return { parsed: null, details };
    }
    finally {
        try {
            rmSync(tmpDir, { recursive: true, force: true });
        }
        catch {
            // ignore
        }
    }
}
export function intakeFileToParsedScore(buffer, originalname, options) {
    const ext = getExtension(originalname);
    const pdfAltoMs = options.pdfAltoTimeoutMs ?? DEFAULT_PDF_ALTO_MS;
    const omrMs = options.omrTimeoutMs ?? DEFAULT_OMR_MS;
    if (isProbablyZip(buffer)) {
        const parsed = parseMXL(buffer);
        if (parsed && parsed.melody.length > 0) {
            return { ok: true, parsed };
        }
        return {
            ok: false,
            failure: {
                status: 422,
                error: "Could not parse file or no melody found (if this is MXL, ensure it is valid compressed MusicXML)",
            },
        };
    }
    const treatAsPdf = isProbablyPdf(buffer) || ext === "pdf";
    if (treatAsPdf) {
        if (!options.allowPdfOm) {
            return {
                ok: false,
                failure: {
                    status: 501,
                    error: "PDF validation is not supported. Upload MusicXML, MXL, or MIDI for validation, or generate from PDF via /api/generate-from-file.",
                },
            };
        }
        const { parsed, details } = tryPdfPipeline(buffer, pdfAltoMs, omrMs);
        if (parsed && parsed.melody.length > 0) {
            return { ok: true, parsed };
        }
        return {
            ok: false,
            failure: {
                status: 501,
                error: pdfPipelineFailureMessage(details),
            },
        };
    }
    if (["xml", "musicxml"].includes(ext)) {
        const xml = buffer.toString("utf-8");
        const parsed = parseMusicXML(xml);
        if (parsed && parsed.melody.length > 0) {
            return { ok: true, parsed };
        }
        return {
            ok: false,
            failure: {
                status: 422,
                error: "Could not parse file or no melody found",
            },
        };
    }
    if (ext === "mxl") {
        const parsed = parseMXL(buffer);
        if (parsed && parsed.melody.length > 0) {
            return { ok: true, parsed };
        }
        return {
            ok: false,
            failure: {
                status: 422,
                error: "Could not parse file or no melody found",
            },
        };
    }
    if (["mid", "midi"].includes(ext)) {
        const parsed = parseMIDI(buffer);
        if (parsed && parsed.melody.length > 0) {
            return { ok: true, parsed };
        }
        return {
            ok: false,
            failure: {
                status: 422,
                error: "Could not parse file or no melody found",
            },
        };
    }
    return {
        ok: false,
        failure: {
            status: 400,
            error: `Unsupported format: .${ext}. Use ${ACCEPTED_EXTENSIONS_MESSAGE}.`,
        },
    };
}
