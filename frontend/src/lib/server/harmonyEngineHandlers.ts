/**
 * In-process HarmonyForge engine handlers for Next.js (Vercel serverless).
 * Mirrors backend/engine/server.ts routes so we do not forward to localhost:8000.
 * Uses compiled engine: run `npm run build:engine` in backend/ when sources change.
 */

import { ensureChords } from "../../server/engine/chordInference.js";
import { intakeFileToParsedScore } from "../../server/engine/parsers/fileIntake.js";
import { generateSATB, SolverBudgetExceededError } from "../../server/engine/solver.js";
import { satbToMusicXML } from "../../server/engine/satbToMusicXML.js";
import type {
  GenerationConfig,
  Genre,
  LeadSheet,
  SATBVoices,
  Voice,
} from "../../server/engine/types.js";
import {
  validateSATBSequence,
  validateSATBSequenceWithTrace,
} from "../../server/engine/validateSATB.js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SOLVER_BUDGET_ERROR =
  "Generation exceeded solver limits; try a shorter score or reduce harmonic density (HF_MAX_CHORD_SLOTS / HF_SOLVER_MAX_NODES).";

const DEFAULT_FILE_GENERATION_SOLVER_MS = 108_000;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const VALID_TONICS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
const VALID_MODES = ["major", "minor"];

const VOICE_MAP: Record<string, Voice> = {
  soprano: "Soprano",
  alto: "Alto",
  tenor: "Tenor",
  bass: "Bass",
  Soprano: "Soprano",
  Alto: "Alto",
  Tenor: "Tenor",
  Bass: "Bass",
};

const VALID_GENRES: Genre[] = ["classical", "jazz", "pop"];

function effectiveSolverMaxMsForFileGeneration(): number {
  const raw = process.env.HF_SOLVER_MAX_MS;
  if (raw === undefined || raw === "" || raw.trim() === "") return DEFAULT_FILE_GENERATION_SOLVER_MS;
  const n = parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_FILE_GENERATION_SOLVER_MS;
  if (n === 0) return 0;
  return Math.min(n, 600_000);
}

function parseConfig(body: unknown): GenerationConfig | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const config: GenerationConfig = {};
  if (o.mood === "major" || o.mood === "minor") config.mood = o.mood;
  if (typeof o.genre === "string" && VALID_GENRES.includes(o.genre as Genre)) config.genre = o.genre as Genre;
  if (o.instruments && typeof o.instruments === "object") {
    const inst = o.instruments as Record<string, unknown>;
    const valid: Partial<Record<Voice, string[]>> = {};
    for (const [k, arr] of Object.entries(inst)) {
      const voice = VOICE_MAP[k];
      if (voice && Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
        valid[voice] = arr;
      }
    }
    if (Object.keys(valid).length > 0) config.instruments = valid as Record<Voice, string[]>;
  }
  return Object.keys(config).length > 0 ? config : null;
}

function validateLeadSheet(body: unknown): body is LeadSheet {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  if (!o.key || typeof o.key !== "object") return false;
  const key = o.key as Record<string, unknown>;
  if (typeof key.tonic !== "string" || !VALID_TONICS.includes(key.tonic)) return false;
  if (typeof key.mode !== "string" || !VALID_MODES.includes(key.mode)) return false;
  if (!Array.isArray(o.chords) || o.chords.length === 0) return false;
  for (const c of o.chords) {
    if (!c || typeof c !== "object") return false;
    const slot = c as Record<string, unknown>;
    if (typeof slot.roman !== "string") return false;
  }
  if (o.melody !== undefined) {
    if (!Array.isArray(o.melody)) return false;
    for (const m of o.melody) {
      if (!m || typeof m !== "object") return false;
      const note = m as Record<string, unknown>;
      if (typeof note.pitch !== "string" || typeof note.beat !== "number") return false;
    }
  }
  return true;
}

function tooLarge(buf: Buffer): boolean {
  return buf.length > MAX_UPLOAD_BYTES;
}

export async function handleGenerateFromFile(req: NextRequest): Promise<NextResponse> {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("multipart/")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }
    const form = await req.formData();
    const fileEntry = form.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const file = fileEntry as File;
    const buf = Buffer.from(await file.arrayBuffer());
    if (tooLarge(buf)) {
      return NextResponse.json(
        { error: `File too large. Maximum upload size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.` },
        { status: 413 },
      );
    }
    let config: GenerationConfig | null = null;
    const configRaw = form.get("config");
    if (typeof configRaw === "string") {
      try {
        config = parseConfig(JSON.parse(configRaw));
      } catch {
        /* ignore invalid JSON */
      }
    }
    const intake = intakeFileToParsedScore(buf, file.name, { allowPdfOm: true });
    if (!intake.ok) {
      return NextResponse.json({ error: intake.failure.error }, { status: intake.failure.status });
    }
    const parsed = intake.parsed;
    const withChords = ensureChords(parsed, config?.mood, config?.genre);
    const leadSheet: LeadSheet = {
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
    } catch (e) {
      if (e instanceof SolverBudgetExceededError) {
        return NextResponse.json({ error: SOLVER_BUDGET_ERROR, code: e.code }, { status: 422 });
      }
      throw e;
    }
    if (!result) {
      return NextResponse.json({ error: "Could not find valid SATB arrangement" }, { status: 422 });
    }
    const musicXML = satbToMusicXML(result, config?.instruments, withChords, {
      additiveHarmonies: true,
      format: "partwise",
      version: "2.0",
    });
    return new NextResponse(musicXML, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate-from-file failed";
    console.error("[generate-from-file]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function handleValidateFromFile(req: NextRequest): Promise<NextResponse> {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("multipart/")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }
    const form = await req.formData();
    const fileEntry = form.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const file = fileEntry as File;
    const buf = Buffer.from(await file.arrayBuffer());
    if (tooLarge(buf)) {
      return NextResponse.json(
        { error: `File too large. Maximum upload size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.` },
        { status: 413 },
      );
    }
    const intake = intakeFileToParsedScore(buf, file.name, { allowPdfOm: false });
    if (!intake.ok) {
      return NextResponse.json({ error: intake.failure.error }, { status: intake.failure.status });
    }
    const parsed = intake.parsed;
    const withChords = ensureChords(parsed, "major", "classical");
    const leadSheet: LeadSheet = {
      key: withChords.key,
      chords: withChords.chords,
      melody: withChords.melody,
    };
    let result;
    try {
      result = generateSATB(leadSheet, {
        maxMs: effectiveSolverMaxMsForFileGeneration(),
      });
    } catch (e) {
      if (e instanceof SolverBudgetExceededError) {
        return NextResponse.json({ error: SOLVER_BUDGET_ERROR, code: e.code }, { status: 422 });
      }
      throw e;
    }
    if (!result) {
      return NextResponse.json({ error: "Could not generate SATB from file" }, { status: 422 });
    }
    const validation = validateSATBSequence(result.slots.map((s) => s.voices));
    return NextResponse.json(validation);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "validate-from-file failed";
    console.error("[validate-from-file]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function handleExportChordChart(req: NextRequest): Promise<NextResponse> {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType?.toLowerCase().includes("multipart/")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }
    const form = await req.formData();
    const fileEntry = form.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const file = fileEntry as File;
    const buf = Buffer.from(await file.arrayBuffer());
    if (tooLarge(buf)) {
      return NextResponse.json(
        { error: `File too large. Maximum upload size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.` },
        { status: 413 },
      );
    }
    const intake = intakeFileToParsedScore(buf, file.name, { allowPdfOm: false });
    if (!intake.ok) {
      return NextResponse.json({ error: intake.failure.error }, { status: intake.failure.status });
    }
    const parsed = intake.parsed;
    const withChords = ensureChords(parsed, "major", "classical");
    const title = parsed.melodyPartName ?? "Untitled";
    const keyLabel = `${withChords.key.tonic} ${withChords.key.mode}`;
    const timeLabel = withChords.timeSignature
      ? `${withChords.timeSignature.beats}/${withChords.timeSignature.beatType}`
      : "4/4";
    const lines: string[] = [];
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
    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "export-chord-chart failed";
    console.error("[export-chord-chart]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function handleValidateSatbTrace(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      leadSheet?: LeadSheet;
      slots?: Array<{ voices: SATBVoices }>;
    };
    let slots: SATBVoices[];

    if (body.leadSheet && validateLeadSheet(body.leadSheet)) {
      let gen;
      try {
        gen = generateSATB(body.leadSheet);
      } catch (e) {
        if (e instanceof SolverBudgetExceededError) {
          return NextResponse.json({ error: SOLVER_BUDGET_ERROR, code: e.code }, { status: 422 });
        }
        throw e;
      }
      if (!gen) {
        return NextResponse.json({ error: "Could not generate SATB from lead sheet" }, { status: 422 });
      }
      slots = gen.slots.map((s) => s.voices);
    } else if (body.slots && Array.isArray(body.slots)) {
      const valid = body.slots.every(
        (s) =>
          s &&
          typeof s === "object" &&
          typeof s.voices === "object" &&
          typeof s.voices.soprano === "string" &&
          typeof s.voices.alto === "string" &&
          typeof s.voices.tenor === "string" &&
          typeof s.voices.bass === "string",
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid slots format; each slot needs voices { soprano, alto, tenor, bass }" },
          { status: 400 },
        );
      }
      slots = body.slots.map((s) => s.voices);
    } else {
      return NextResponse.json(
        {
          error: "Provide leadSheet (key, chords, melody?) or slots (array of { voices })",
        },
        { status: 400 },
      );
    }

    const result = validateSATBSequenceWithTrace(slots);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "validate-satb-trace failed";
    console.error("[validate-satb-trace]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
