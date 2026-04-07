/**
 * HarmonyForge Logic Core — REST API server
 * Port 8000
 */
import express from "express";
import multer from "multer";
import { generateSATB, SolverBudgetExceededError } from "./solver.js";
import { parseMusicXML } from "./parsers/musicxmlParser.js";
import { intakeFileToParsedScore } from "./parsers/fileIntake.js";
import { ensureChords } from "./chordInference.js";
import { satbToMusicXML, parsedScoreToPartwiseMelodyMusicXML } from "./satbToMusicXML.js";
import { validateSATBSequence, validateSATBSequenceWithTrace } from "./validateSATB.js";
const app = express();
const PORT = parseInt(process.env.PORT ?? "8000", 10);
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_BYTES },
});
const VALID_TONICS = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
const VALID_MODES = ["major", "minor"];
app.use(express.json({ limit: "1mb" }));
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
const SOLVER_BUDGET_ERROR = "Generation exceeded solver limits; try a shorter score or reduce harmonic density (HF_MAX_CHORD_SLOTS / HF_SOLVER_MAX_NODES).";
/**
 * Multipart file routes use a default wall-clock cap when HF_SOLVER_MAX_MS is unset so the engine
 * can return 422 before typical browser abort (~120–180s). Set HF_SOLVER_MAX_MS=0 for no limit.
 */
const DEFAULT_FILE_GENERATION_SOLVER_MS = 108_000;
function effectiveSolverMaxMsForFileGeneration() {
    const raw = process.env.HF_SOLVER_MAX_MS;
    if (raw === undefined || raw === "" || raw.trim() === "")
        return DEFAULT_FILE_GENERATION_SOLVER_MS;
    const n = parseInt(raw.trim(), 10);
    if (!Number.isFinite(n) || n < 0)
        return DEFAULT_FILE_GENERATION_SOLVER_MS;
    if (n === 0)
        return 0;
    return Math.min(n, 600_000);
}
app.post("/api/generate-satb", (req, res) => {
    if (!validateLeadSheet(req.body)) {
        res.status(400).json({ error: "Invalid lead sheet" });
        return;
    }
    let result;
    try {
        result = generateSATB(req.body);
    }
    catch (e) {
        if (e instanceof SolverBudgetExceededError) {
            res.status(422).json({ error: SOLVER_BUDGET_ERROR, code: e.code });
            return;
        }
        throw e;
    }
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
    const intake = intakeFileToParsedScore(file.buffer, file.originalname, {
        allowPdfOm: true,
    });
    if (!intake.ok) {
        res.status(intake.failure.status).json({ error: intake.failure.error });
        return;
    }
    const parsed = intake.parsed;
    const withChords = ensureChords(parsed, config?.mood, config?.genre);
    const leadSheet = {
        key: withChords.key,
        chords: withChords.chords,
        melody: withChords.melody,
    };
    let result;
    try {
        result = generateSATB(leadSheet, {
            genre: config?.genre,
            maxMs: effectiveSolverMaxMsForFileGeneration(),
        });
    }
    catch (e) {
        if (e instanceof SolverBudgetExceededError) {
            res.status(422).json({ error: SOLVER_BUDGET_ERROR, code: e.code });
            return;
        }
        throw e;
    }
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
/** Intake any supported format → single-part MusicXML for Document preview (same path as raw .xml upload). */
app.post("/api/to-preview-musicxml", upload.single("file"), (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    const intake = intakeFileToParsedScore(file.buffer, file.originalname, {
        allowPdfOm: true,
    });
    if (!intake.ok) {
        res.status(intake.failure.status).json({ error: intake.failure.error });
        return;
    }
    const xml = parsedScoreToPartwiseMelodyMusicXML(intake.parsed);
    res.type("application/xml").send(xml);
});
/** Validate from file (.xml, .musicxml, .mxl, .mid, .midi; not PDF): parse → infer chords → generate SATB → validate. */
app.post("/api/validate-from-file", upload.single("file"), (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    const intake = intakeFileToParsedScore(file.buffer, file.originalname, {
        allowPdfOm: false,
    });
    if (!intake.ok) {
        res.status(intake.failure.status).json({ error: intake.failure.error });
        return;
    }
    const parsed = intake.parsed;
    const withChords = ensureChords(parsed, "major", "classical");
    const leadSheet = {
        key: withChords.key,
        chords: withChords.chords,
        melody: withChords.melody,
    };
    let result;
    try {
        result = generateSATB(leadSheet, {
            maxMs: effectiveSolverMaxMsForFileGeneration(),
        });
    }
    catch (e) {
        if (e instanceof SolverBudgetExceededError) {
            res.status(422).json({ error: SOLVER_BUDGET_ERROR, code: e.code });
            return;
        }
        throw e;
    }
    if (!result) {
        res.status(422).json({ error: "Could not generate SATB from file" });
        return;
    }
    const validation = validateSATBSequence(result.slots.map((s) => s.voices));
    res.json(validation);
});
/** Export practical plain-text chord chart from MusicXML / MXL / MIDI (not PDF). */
app.post("/api/export-chord-chart", upload.single("file"), (req, res) => {
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
    }
    const intake = intakeFileToParsedScore(file.buffer, file.originalname, {
        allowPdfOm: false,
    });
    if (!intake.ok) {
        res.status(intake.failure.status).json({ error: intake.failure.error });
        return;
    }
    const parsed = intake.parsed;
    const withChords = ensureChords(parsed, "major", "classical");
    const title = parsed.melodyPartName ?? "Untitled";
    const keyLabel = `${withChords.key.tonic} ${withChords.key.mode}`;
    const timeLabel = withChords.timeSignature
        ? `${withChords.timeSignature.beats}/${withChords.timeSignature.beatType}`
        : "4/4";
    const lines = [];
    lines.push(`Title: ${title}`);
    lines.push(`Key: ${keyLabel}`);
    lines.push(`Time: ${timeLabel}`);
    lines.push("");
    lines.push("Chord Chart");
    lines.push("-----------");
    withChords.chords.forEach((chord, idx) => {
        lines.push(`M${idx + 1}: ${chord.roman}`);
    });
    if (withChords.chords.length === 0) {
        lines.push("No chord data available.");
    }
    res.type("text/plain; charset=utf-8").send(lines.join("\n"));
});
/** Validate SATB: accept LeadSheet (generate + validate) or raw slots. Returns HER-style metrics. */
app.post("/api/validate-satb", (req, res) => {
    const body = req.body;
    let slots;
    if (body.leadSheet && validateLeadSheet(body.leadSheet)) {
        let gen;
        try {
            gen = generateSATB(body.leadSheet);
        }
        catch (e) {
            if (e instanceof SolverBudgetExceededError) {
                res.status(422).json({ error: SOLVER_BUDGET_ERROR, code: e.code });
                return;
            }
            throw e;
        }
        if (!gen) {
            res.status(422).json({ error: "Could not generate SATB from lead sheet" });
            return;
        }
        slots = gen.slots.map((s) => s.voices);
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
/** Validate SATB with per-slot explainability trace for inspector UX. */
app.post("/api/validate-satb-trace", (req, res) => {
    const body = req.body;
    let slots;
    if (body.leadSheet && validateLeadSheet(body.leadSheet)) {
        let gen;
        try {
            gen = generateSATB(body.leadSheet);
        }
        catch (e) {
            if (e instanceof SolverBudgetExceededError) {
                res.status(422).json({ error: SOLVER_BUDGET_ERROR, code: e.code });
                return;
            }
            throw e;
        }
        if (!gen) {
            res.status(422).json({ error: "Could not generate SATB from lead sheet" });
            return;
        }
        slots = gen.slots.map((s) => s.voices);
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
    const result = validateSATBSequenceWithTrace(slots);
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
app.use((err, _req, res, next) => {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
            error: `File too large. Maximum upload size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
        });
        return;
    }
    next(err);
});
app.listen(PORT, () => {
    console.log(`HarmonyForge backend listening on http://localhost:${PORT}`);
});
