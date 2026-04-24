/**
 * Shared helpers that the Next.js `/api/*` route handlers use to invoke the engine.
 *
 * Keeps validation, solver budget defaults, and error mapping out of each route file.
 * Every helper is environment-safe: no Express, no global state.
 */

import { generateSATB, SolverBudgetExceededError } from "./solver";
import { ensureChords } from "./chordInference";
import { satbToMusicXML, parsedScoreToPartwiseMelodyMusicXML } from "./satbToMusicXML";
import { parseMusicXML } from "./parsers/musicxmlParser";
import { sliceParsedScoreToMeasureRange } from "./measureRangeSlice";
import { validateSATBSequence, validateSATBSequenceWithTrace } from "./validateSATB";
import {
  intakeFileToParsedScore,
  intakeImagePagesToParsedScore,
  type IntakeResult,
} from "./parsers/fileIntake";
import type {
  LeadSheet,
  GenerationConfig,
  Voice,
  SATBVoices,
  Genre,
  ParsedScore,
  RhythmDensity,
  BassRhythmMode,
} from "./types";

export const SOLVER_BUDGET_ERROR =
  "Generation exceeded solver limits; try a shorter score or reduce harmonic density (HF_MAX_CHORD_SLOTS / HF_SOLVER_MAX_NODES).";

const DEFAULT_FILE_GENERATION_SOLVER_MS = 108_000;

/**
 * File routes get a default wall-clock solver cap when HF_SOLVER_MAX_MS is unset.
 * This ensures the engine surfaces a clear 422 before typical browser aborts.
 * HF_SOLVER_MAX_MS=0 disables (unbounded). Bounded to 10 minutes upper limit.
 */
export function effectiveSolverMaxMsForFileGeneration(): number {
  const raw = process.env.HF_SOLVER_MAX_MS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_FILE_GENERATION_SOLVER_MS;
  const n = parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_FILE_GENERATION_SOLVER_MS;
  if (n === 0) return 0;
  return Math.min(n, 600_000);
}

const VALID_TONICS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
const VALID_MODES = ["major", "minor"];
const VALID_GENRES: Genre[] = ["classical", "jazz", "pop"];
const VALID_RHYTHM_DENSITIES: RhythmDensity[] = ["chordal", "mixed", "flowing"];
const VALID_BASS_RHYTHM_MODES: BassRhythmMode[] = ["follow", "pedal"];

const VOICE_MAP: Record<string, Voice> = {
  soprano: "Soprano", alto: "Alto", tenor: "Tenor", bass: "Bass",
  Soprano: "Soprano", Alto: "Alto", Tenor: "Tenor", Bass: "Bass",
};

export function validateLeadSheet(body: unknown): body is LeadSheet {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  if (!o.key || typeof o.key !== "object") return false;
  const key = o.key as Record<string, unknown>;
  if (typeof key.tonic !== "string" || !VALID_TONICS.includes(key.tonic))
    return false;
  if (typeof key.mode !== "string" || !VALID_MODES.includes(key.mode))
    return false;
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
      if (typeof note.pitch !== "string" || typeof note.beat !== "number")
        return false;
    }
  }
  return true;
}

export function parseConfig(body: unknown): GenerationConfig | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const config: GenerationConfig = {};
  if (o.mood === "major" || o.mood === "minor") config.mood = o.mood;
  if (typeof o.genre === "string" && VALID_GENRES.includes(o.genre as Genre)) {
    config.genre = o.genre as Genre;
  }
  if (typeof o.rhythmDensity === "string" && VALID_RHYTHM_DENSITIES.includes(o.rhythmDensity as RhythmDensity)) {
    config.rhythmDensity = o.rhythmDensity as RhythmDensity;
  }
  if (
    typeof o.bassRhythmMode === "string" &&
    VALID_BASS_RHYTHM_MODES.includes(o.bassRhythmMode as BassRhythmMode)
  ) {
    config.bassRhythmMode = o.bassRhythmMode as BassRhythmMode;
  }
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
  if (o.preferInferredChords === true) config.preferInferredChords = true;
  if (typeof o.pickupBeats === "number" && Number.isFinite(o.pickupBeats)) {
    const pb = Math.round(o.pickupBeats);
    if (pb >= 0 && pb <= 3) config.pickupBeats = pb;
  }
  return Object.keys(config).length > 0 ? config : null;
}

export interface EngineReadFile {
  buffer: Buffer;
  originalname: string;
}

/** Extract a File from a multipart formData body into the shape the engine expects. */
export async function readFormFile(form: FormData, field = "file"): Promise<EngineReadFile | null> {
  const val = form.get(field);
  if (!val || typeof val === "string") return null;
  const file = val as File;
  const buf = Buffer.from(await file.arrayBuffer());
  return { buffer: buf, originalname: file.name || "upload" };
}

/** Read every File attached under `field` (browser-rasterized PDF pages). */
export async function readFormFiles(form: FormData, field = "pages"): Promise<Buffer[]> {
  const out: Buffer[] = [];
  for (const val of form.getAll(field)) {
    if (!val || typeof val === "string") continue;
    const buf = Buffer.from(await (val as File).arrayBuffer());
    if (buf.length > 0) out.push(buf);
  }
  return out;
}

export interface GenerateFromFileResult {
  ok: true;
  xml: string;
}

export interface EngineError {
  ok: false;
  status: number;
  error: string;
}

export function mapIntakeFailure(result: Extract<IntakeResult, { ok: false }>): EngineError {
  return { ok: false, status: result.failure.status, error: result.failure.error };
}

/**
 * Resolve a ParsedScore from either:
 *  - A single uploaded file (MusicXML / MXL / MIDI / PDF → OMR)
 *  - Pre-rasterized PDF page images (`pages`) which skip pdftoppm and feed oemer directly.
 *
 * When both are present, pre-rasterized pages take priority (they're already page-accurate).
 */
export function resolveParsedScore(
  file: EngineReadFile,
  pageImages: Buffer[],
  allowPdfOm: boolean,
): { ok: true; parsed: ParsedScore } | EngineError {
  if (pageImages.length > 0) {
    if (!allowPdfOm) {
      return {
        ok: false,
        status: 501,
        error: "Image OMR is not supported on this route.",
      };
    }
    const intake = intakeImagePagesToParsedScore(pageImages);
    if (!intake.ok) return mapIntakeFailure(intake);
    return { ok: true, parsed: intake.parsed };
  }
  const intake = intakeFileToParsedScore(file.buffer, file.originalname, { allowPdfOm });
  if (!intake.ok) return mapIntakeFailure(intake);
  return { ok: true, parsed: intake.parsed };
}

export function runGenerateFromFile(
  file: EngineReadFile,
  config: GenerationConfig | null,
  pageImages: Buffer[] = [],
): GenerateFromFileResult | EngineError {
  const resolved = resolveParsedScore(file, pageImages, true);
  if (!resolved.ok) return resolved;
  const parsed = resolved.parsed;
  const parsedForGen =
    config?.pickupBeats !== undefined
      ? {
          ...parsed,
          pickupBeats: config.pickupBeats === 0 ? undefined : config.pickupBeats,
        }
      : parsed;
  const withChords = ensureChords(parsedForGen, config?.mood, config?.genre, {
    preferInferredChords: config?.preferInferredChords === true,
  });
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
      return { ok: false, status: 422, error: SOLVER_BUDGET_ERROR };
    }
    throw e;
  }
  if (!result) {
    return { ok: false, status: 422, error: "Could not find valid SATB arrangement" };
  }
  const xml = satbToMusicXML(result, config?.instruments, withChords, {
    additiveHarmonies: true,
    format: "partwise",
    version: "2.0",
    rhythmDensity: config?.rhythmDensity ?? "mixed",
    bassRhythmMode: config?.bassRhythmMode ?? "follow",
  });
  return { ok: true, xml };
}

/**
 * Regenerate additive harmonies for an inclusive measure range from in-memory MusicXML.
 * Returns a **short** partwise score (melody + harmony parts for the slice only); the client splices
 * harmony staves back into the full layout via `spliceHarmonyMeasuresFromAddonScore`.
 */
export function runGenerateHarmonyRangeFromMusicXml(
  xml: string,
  config: GenerationConfig | null,
  startMeasure: number,
  endMeasure: number,
): GenerateFromFileResult | EngineError {
  const parsed = parseMusicXML(xml);
  if (!parsed || parsed.melody.length === 0) {
    return {
      ok: false,
      status: 422,
      error: "Could not parse MusicXML or no melody in score",
    };
  }
  const sliced = sliceParsedScoreToMeasureRange(parsed, startMeasure, endMeasure);
  if (!sliced) {
    return {
      ok: false,
      status: 422,
      error: "Selected measures contain no melody notes",
    };
  }
  const parsedForGen =
    config?.pickupBeats !== undefined && startMeasure === 0
      ? {
          ...sliced,
          pickupBeats: config.pickupBeats === 0 ? undefined : config.pickupBeats,
        }
      : sliced;
  const withChords = ensureChords(parsedForGen, config?.mood, config?.genre, {
    preferInferredChords: config?.preferInferredChords === true,
  });
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
      return { ok: false, status: 422, error: SOLVER_BUDGET_ERROR };
    }
    throw e;
  }
  if (!result) {
    return { ok: false, status: 422, error: "Could not find valid SATB arrangement for range" };
  }
  const outXml = satbToMusicXML(result, config?.instruments, withChords, {
    additiveHarmonies: true,
    format: "partwise",
    version: "2.0",
    rhythmDensity: config?.rhythmDensity ?? "mixed",
    bassRhythmMode: config?.bassRhythmMode ?? "follow",
  });
  return { ok: true, xml: outXml };
}

export interface PreviewResult {
  ok: true;
  xml: string;
}

export function runToPreviewMusicXML(
  file: EngineReadFile,
  pageImages: Buffer[] = [],
): PreviewResult | EngineError {
  const resolved = resolveParsedScore(file, pageImages, true);
  if (!resolved.ok) return resolved;
  return { ok: true, xml: parsedScoreToPartwiseMelodyMusicXML(resolved.parsed) };
}

export interface ValidateFromFileResult {
  ok: true;
  data: ReturnType<typeof validateSATBSequence>;
}

export function runValidateFromFile(file: EngineReadFile): ValidateFromFileResult | EngineError {
  const intake = intakeFileToParsedScore(file.buffer, file.originalname, { allowPdfOm: false });
  if (!intake.ok) return mapIntakeFailure(intake);
  const parsed = intake.parsed;
  const withChords = ensureChords(parsed, "major", "classical");
  const leadSheet: LeadSheet = {
    key: withChords.key,
    chords: withChords.chords,
    melody: withChords.melody,
  };
  let result;
  try {
    result = generateSATB(leadSheet, { maxMs: effectiveSolverMaxMsForFileGeneration() });
  } catch (e) {
    if (e instanceof SolverBudgetExceededError) {
      return { ok: false, status: 422, error: SOLVER_BUDGET_ERROR };
    }
    throw e;
  }
  if (!result) {
    return { ok: false, status: 422, error: "Could not generate SATB from file" };
  }
  const data = validateSATBSequence(result.slots.map((s) => s.voices));
  return { ok: true, data };
}

export interface ChordChartResult {
  ok: true;
  text: string;
}

export function runExportChordChart(file: EngineReadFile): ChordChartResult | EngineError {
  const intake = intakeFileToParsedScore(file.buffer, file.originalname, { allowPdfOm: false });
  if (!intake.ok) return mapIntakeFailure(intake);
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
  return { ok: true, text: lines.join("\n") };
}

export interface ValidateSatbTraceBody {
  leadSheet?: LeadSheet;
  slots?: Array<{ voices: SATBVoices }>;
}

export function runValidateSATBTrace(body: ValidateSatbTraceBody):
  | { ok: true; data: ReturnType<typeof validateSATBSequenceWithTrace> }
  | EngineError {
  let slots: SATBVoices[];

  if (body.leadSheet && validateLeadSheet(body.leadSheet)) {
    let gen;
    try {
      gen = generateSATB(body.leadSheet);
    } catch (e) {
      if (e instanceof SolverBudgetExceededError) {
        return { ok: false, status: 422, error: SOLVER_BUDGET_ERROR };
      }
      throw e;
    }
    if (!gen) {
      return { ok: false, status: 422, error: "Could not generate SATB from lead sheet" };
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
      return {
        ok: false,
        status: 400,
        error: "Invalid slots format; each slot needs voices { soprano, alto, tenor, bass }",
      };
    }
    slots = body.slots.map((s) => s.voices);
  } else {
    return {
      ok: false,
      status: 400,
      error: "Provide leadSheet (key, chords, melody?) or slots (array of { voices })",
    };
  }

  return { ok: true, data: validateSATBSequenceWithTrace(slots) };
}
