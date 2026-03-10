/**
 * HarmonyForge Logic Core — REST API server
 * Port 8000
 */
import express from "express";
import multer from "multer";
import { generateSATB } from "./solver.js";
import { spawnSync } from "child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { parseMusicXML } from "./parsers/musicxmlParser.js";
import { parseMIDI } from "./parsers/midiParser.js";
import { parseMXL } from "./parsers/mxlParser.js";
import { ensureChords } from "./chordInference.js";
import { satbToMusicXML } from "./satbToMusicXML.js";
import { validateSATBSequence } from "./validateSATB.js";
const app = express();
const PORT = 8000;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
const VALID_TONICS = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
const VALID_MODES = ["major", "minor"];
app.use(express.json());
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});
app.options("*", (_req, res) => res.sendStatus(204));
function validateLeadSheet(body) {
    if (!body || typeof body !== "object")
        return false;
    const o = body;
    if (!o.key || typeof o.key !== "object")
        return false;
    const key = o.key;
    if (typeof key.tonic !== "string" || !VALID_TONICS.includes(key.tonic))
        return false;
    if (typeof key.mode !== "string" || !VALID_MODES.includes(key.mode))
        return false;
    if (!Array.isArray(o.chords) || o.chords.length === 0)
        return false;
    for (const c of o.chords) {
        if (!c || typeof c !== "object")
            return false;
        const slot = c;
        if (typeof slot.roman !== "string")
            return false;
    }
    if (o.melody !== undefined) {
        if (!Array.isArray(o.melody))
            return false;
        for (const m of o.melody) {
            if (!m || typeof m !== "object")
                return false;
            const note = m;
            if (typeof note.pitch !== "string" || typeof note.beat !== "number")
                return false;
        }
    }
    return true;
}
const VOICE_MAP = {
    soprano: "Soprano", alto: "Alto", tenor: "Tenor", bass: "Bass",
    Soprano: "Soprano", Alto: "Alto", Tenor: "Tenor", Bass: "Bass",
};
const VALID_GENRES = ["classical", "jazz", "pop"];
function parseConfig(body) {
    if (!body || typeof body !== "object")
        return null;
    const o = body;
    const config = {};
    if (o.mood === "major" || o.mood === "minor")
        config.mood = o.mood;
    if (typeof o.genre === "string" && VALID_GENRES.includes(o.genre))
        config.genre = o.genre;
    if (o.instruments && typeof o.instruments === "object") {
        const inst = o.instruments;
        const valid = {};
        for (const [k, arr] of Object.entries(inst)) {
            const voice = VOICE_MAP[k];
            if (voice && Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
                valid[voice] = arr;
            }
        }
        if (Object.keys(valid).length > 0)
            config.instruments = valid;
    }
    return Object.keys(config).length > 0 ? config : null;
}
app.post("/api/generate-satb", (req, res) => {
    if (!validateLeadSheet(req.body)) {
        res.status(400).json({ error: "Invalid lead sheet" });
        return;
    }
    const result = generateSATB(req.body);
    if (!result) {
        res.status(422).json({ error: "Could not find valid SATB arrangement" });
        return;
    }
    res.json(result);
});
app.post("/api/generate-from-file", upload.fields([
    { name: "file", maxCount: 1 },
    { name: "config", maxCount: 1 },
]), (req, res) => {
    const files = req.files;
    const file = files?.file?.[0];
    if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    let config = null;
    const configRaw = req.body?.config;
    if (typeof configRaw === "string") {
        try {
            config = parseConfig(JSON.parse(configRaw));
        }
        catch {
            // ignore invalid JSON
        }
    }
    const ext = (file.originalname.split(".").pop() ?? "").toLowerCase();
    let parsed;
    if (ext === "pdf") {
        const tmpDir = mkdtempSync(join(tmpdir(), "hf-pdf-"));
        const pdfPath = join(tmpDir, "input.pdf");
        const outDir = join(tmpDir, "out");
        try {
            writeFileSync(pdfPath, file.buffer);
            const result = spawnSync("audiveris", [
                "-batch",
                "-transcribe",
                "-export",
                "-output",
                outDir,
                "-option",
                "org.audiveris.omr.sheet.BookManager.useSeparateBookFolders=false",
                pdfPath,
            ], { encoding: "utf-8", timeout: 60000 });
            if (result.status === 0) {
                const candidates = ["input.mxl", "input.mvt1.mxl"];
                for (const name of candidates) {
                    const mxlPath = join(outDir, name);
                    if (existsSync(mxlPath)) {
                        parsed = parseMXL(readFileSync(mxlPath));
                        if (parsed?.melody.length)
                            break;
                    }
                }
            }
        }
        catch {
            // fall through to 501
        }
        if (!parsed || !parsed.melody.length) {
            res.status(501).json({
                error: "PDF conversion requires Audiveris OMR. Install from https://audiveris.github.io then run: audiveris -batch -transcribe -export -output ./out file.pdf. Upload the generated .mxl or .xml file.",
            });
            return;
        }
    }
    else if (["xml", "musicxml"].includes(ext)) {
        const xml = file.buffer.toString("utf-8");
        parsed = parseMusicXML(xml);
    }
    else if (ext === "mxl") {
        parsed = parseMXL(file.buffer);
    }
    else if (["mid", "midi"].includes(ext)) {
        parsed = parseMIDI(file.buffer);
    }
    else {
        res.status(400).json({
            error: `Unsupported format: .${ext}. Use .xml, .mxl, .mid, or .midi.`,
        });
        return;
    }
    if (!parsed || parsed.melody.length === 0) {
        res.status(422).json({ error: "Could not parse file or no melody found" });
        return;
    }
    const withChords = ensureChords(parsed, config?.mood, config?.genre);
    const leadSheet = {
        key: withChords.key,
        chords: withChords.chords,
        melody: withChords.melody,
    };
    const result = generateSATB(leadSheet, { genre: config?.genre });
    if (!result) {
        res.status(422).json({ error: "Could not find valid SATB arrangement" });
        return;
    }
    const musicXML = satbToMusicXML(result, config?.instruments, withChords, {
        additiveHarmonies: true,
        format: "partwise",
        version: "2.0",
    });
    res.type("application/xml").send(musicXML);
});
/** Validate from MusicXML file: parse → infer chords → generate SATB → validate. Returns HER-style metrics. */
app.post("/api/validate-from-file", upload.single("file"), (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    const ext = (file.originalname.split(".").pop() ?? "").toLowerCase();
    if (!["xml", "musicxml"].includes(ext)) {
        res.status(400).json({ error: "Use MusicXML .xml file for validation" });
        return;
    }
    const xml = file.buffer.toString("utf-8");
    const parsed = parseMusicXML(xml);
    if (!parsed || parsed.melody.length === 0) {
        res.status(422).json({ error: "Could not parse file or no melody found" });
        return;
    }
    const withChords = ensureChords(parsed, "major", "classical");
    const leadSheet = {
        key: withChords.key,
        chords: withChords.chords,
        melody: withChords.melody,
    };
    const result = generateSATB(leadSheet);
    if (!result) {
        res.status(422).json({ error: "Could not generate SATB from file" });
        return;
    }
    const validation = validateSATBSequence(result.slots.map((s) => s.voices));
    res.json(validation);
});
/** Validate SATB: accept LeadSheet (generate + validate) or raw slots. Returns HER-style metrics. */
app.post("/api/validate-satb", (req, res) => {
    const body = req.body;
    let slots;
    if (body.leadSheet && validateLeadSheet(body.leadSheet)) {
        const result = generateSATB(body.leadSheet);
        if (!result) {
            res.status(422).json({ error: "Could not generate SATB from lead sheet" });
            return;
        }
        slots = result.slots.map((s) => s.voices);
    }
    else if (body.slots && Array.isArray(body.slots)) {
        const valid = body.slots.every((s) => s &&
            typeof s === "object" &&
            typeof s.voices === "object" &&
            typeof s.voices.soprano === "string" &&
            typeof s.voices.alto === "string" &&
            typeof s.voices.tenor === "string" &&
            typeof s.voices.bass === "string");
        if (!valid) {
            res.status(400).json({ error: "Invalid slots format; each slot needs voices { soprano, alto, tenor, bass }" });
            return;
        }
        slots = body.slots.map((s) => s.voices);
    }
    else {
        res.status(400).json({
            error: "Provide leadSheet (key, chords, melody?) or slots (array of { voices })",
        });
        return;
    }
    const result = validateSATBSequence(slots);
    res.json(result);
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// Debug: test parse with raw XML body (POST body as text)
app.post("/api/debug-parse", express.raw({ type: "*/*", limit: "5mb" }), (req, res) => {
    const xml = Buffer.isBuffer(req.body) ? req.body.toString("utf-8") : "";
    const parsed = parseMusicXML(xml);
    res.json({
        bodyLength: xml.length,
        hasPartwise: xml.includes("score-partwise"),
        parsed: parsed ? { melodyCount: parsed.melody.length, key: parsed.key } : null,
    });
});
app.listen(PORT, () => {
    console.log(`HarmonyForge backend listening on http://localhost:${PORT}`);
});
