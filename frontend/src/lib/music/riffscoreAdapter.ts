/**
 * Bidirectional adapter between HarmonyForge's EditableScore model
 * and RiffScore's Score/Staff/Measure/ScoreEvent model.
 */

import type { EditableScore, DurationType, Note as HfNote, Part, Measure as HfMeasure } from "./scoreTypes";
import { getNoteById } from "./scoreUtils";
import type { ReactNode } from "react";
import type {
  Score as RsScore,
  Staff as RsStaff,
  Measure as RsMeasure,
  ScoreEvent,
  Note as RsNote,
  RiffScoreConfig,
} from "riffscore";

// ---------------------------------------------------------------------------
// Duration maps
// ---------------------------------------------------------------------------

const HF_TO_RS_DURATION: Record<DurationType, string> = {
  w: "whole",
  h: "half",
  q: "quarter",
  "8": "eighth",
  "16": "sixteenth",
  "32": "thirtysecond",
};

const RS_TO_HF_DURATION: Record<string, DurationType> = {
  whole: "w",
  half: "h",
  quarter: "q",
  eighth: "8",
  sixteenth: "16",
  thirtysecond: "32",
};

export function hfDurationToRs(d: DurationType): string {
  return HF_TO_RS_DURATION[d] ?? "quarter";
}

export function rsDurationToHf(d: string): DurationType {
  return RS_TO_HF_DURATION[d] ?? "q";
}

/**
 * Chord track / letter symbols are only meaningful when there are enough parts
 * (melody + two harmony) to justify harmonic annotation — matches RiffScore UX
 * (avoids a misleading default “Cm7” hover on 1–2 staves).
 */
export function shouldShowChordNotation(score: EditableScore): boolean {
  return score.parts.length >= 3;
}

// ---------------------------------------------------------------------------
// Clef maps
// ---------------------------------------------------------------------------

/**
 * Map HarmonyForge `part.clef` (staff clef type) → RiffScore staff clef.
 * Must not treat `"alto"` as SATB voice: viola uses alto **C-clef** (`part.clef === "alto"`).
 *
 * RiffScore only exposes four single-staff shapes. Rare C-clef lines (`mezzo`, `soprano_c`,
 * `baritone_c`) map to the closest supported clef so playback/layout still run; HarmonyForge
 * staff geometry uses `staffPreviewPitch` with the exact clef string.
 */
function hfClefToRs(clef: string): "treble" | "bass" | "alto" | "tenor" {
  const lower = clef.toLowerCase();
  if (lower === "treble" || lower === "bass" || lower === "alto" || lower === "tenor") {
    return lower;
  }
  if (lower === "mezzo" || lower === "soprano_c") return "alto";
  if (lower === "baritone_c") return "tenor";
  if (lower === "soprano") return "treble";
  return "treble";
}

// ---------------------------------------------------------------------------
// Pitch helpers
// ---------------------------------------------------------------------------

/** Parse accidental from HarmonyForge pitch string. "F#5" -> { letter: "F", acc: "sharp", octave: "5" } */
function parsePitch(pitch: string): { letter: string; accidental: "sharp" | "flat" | "natural" | null; octave: string } {
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return { letter: "C", accidental: null, octave: "4" };
  const acc = m[2] === "#" ? "sharp" as const : m[2] === "b" ? "flat" as const : null;
  return { letter: m[1], accidental: acc, octave: m[3] };
}

/** Convert RiffScore note to HarmonyForge pitch string. */
function rsPitchToHf(note: RsNote): string {
  if (!note.pitch) return "C4";
  // RiffScore pitch is already "C4", "F#5", etc.
  // But accidentals may be stored separately
  let pitch = note.pitch;
  if (note.accidental === "sharp" && !pitch.includes("#")) {
    const m = pitch.match(/^([A-G])(\d+)$/);
    if (m) pitch = `${m[1]}#${m[2]}`;
  } else if (note.accidental === "flat" && !pitch.includes("b")) {
    const m = pitch.match(/^([A-G])(\d+)$/);
    if (m) pitch = `${m[1]}b${m[2]}`;
  }
  return pitch;
}

// ---------------------------------------------------------------------------
// Key signature conversion
// ---------------------------------------------------------------------------

/** HarmonyForge uses numeric key sig (positive = sharps, negative = flats).
 *  RiffScore uses string key names like "C", "G", "F", "Bb", etc. */
const FIFTHS_TO_KEY: Record<number, string> = {
  "-7": "Cb", "-6": "Gb", "-5": "Db", "-4": "Ab", "-3": "Eb", "-2": "Bb", "-1": "F",
  "0": "C", "1": "G", "2": "D", "3": "A", "4": "E", "5": "B", "6": "F#", "7": "C#",
};

const KEY_TO_FIFTHS: Record<string, number> = {};
for (const [k, v] of Object.entries(FIFTHS_TO_KEY)) {
  KEY_TO_FIFTHS[v] = parseInt(k, 10);
}

function hfKeySigToRs(keySig: number | undefined): string {
  if (keySig === undefined) return "C";
  return FIFTHS_TO_KEY[keySig] ?? "C";
}

function rsKeySigToHf(keySig: string): number {
  return KEY_TO_FIFTHS[keySig] ?? 0;
}

// ---------------------------------------------------------------------------
// ID mapping
// ---------------------------------------------------------------------------

export type IdMap = Map<string, string>;

/**
 * Read the current pitch for an HF note from a live RiffScore `getScore()` snapshot
 * (e.g. while dragging) without flushing to Zustand — avoids `loadScore` loops.
 */
export function hfNotePitchFromLiveRsScore(
  rsScore: RsScore,
  rsToHf: IdMap,
  hfNoteId: string,
): string | null {
  let rsNoteId: string | null = null;
  for (const [rsKey, hfId] of rsToHf) {
    if (hfId === hfNoteId && rsKey.startsWith("rs-")) {
      rsNoteId = rsKey;
      break;
    }
  }
  if (!rsNoteId) return null;
  for (const st of rsScore.staves) {
    for (const meas of st.measures) {
      for (const ev of meas.events) {
        for (const n of ev.notes) {
          if (n.id === rsNoteId) {
            if (n.isRest) return null;
            return rsPitchToHf(n);
          }
        }
      }
    }
  }
  return null;
}

/**
 * Build a bidirectional ID map correlating HarmonyForge note IDs
 * to RiffScore note IDs by position (staff/measure/event/note index).
 */
export function buildIdMap(hfScore: EditableScore, rsScore: RsScore): { hfToRs: IdMap; rsToHf: IdMap } {
  const hfToRs: IdMap = new Map();
  const rsToHf: IdMap = new Map();

  const staffCount = Math.min(hfScore.parts.length, rsScore.staves.length);
  for (let si = 0; si < staffCount; si++) {
    const part = hfScore.parts[si];
    const staff = rsScore.staves[si];
    const measCount = Math.min(part.measures.length, staff.measures.length);

    for (let mi = 0; mi < measCount; mi++) {
      const hfMeasure = part.measures[mi];
      const rsMeasure = staff.measures[mi];
      const eventCount = Math.min(hfMeasure.notes.length, rsMeasure.events.length);

      for (let ei = 0; ei < eventCount; ei++) {
        const hfNote = hfMeasure.notes[ei];
        const rsEvent = rsMeasure.events[ei];
        // RiffScore events can have multiple notes (chords); for SATB monophonic we use notes[0]
        const rsNote = rsEvent.notes[0];
        if (hfNote && rsNote) {
          hfToRs.set(hfNote.id, rsNote.id);
          rsToHf.set(rsNote.id, hfNote.id);
          // Rest hit targets use `data-testid="rest-{event.id}"` (e.g. rse-…) — not `rs-…` note ids.
          if (rsEvent.id) {
            rsToHf.set(rsEvent.id, hfNote.id);
          }
        }
      }
    }
  }

  return { hfToRs, rsToHf };
}

// ---------------------------------------------------------------------------
// EditableScore -> RiffScoreConfig
// ---------------------------------------------------------------------------

function hfNoteToRsEvent(note: HfNote): ScoreEvent {
  const isRest = Boolean(note.isRest);
  const { letter, accidental, octave } = parsePitch(note.pitch);
  const rsNote: RsNote = {
    id: `rs-${note.id}`,
    // RiffScore expects letter+octave in `pitch` and `#`/`b` only in `accidental`
    // (HF stores combined strings like "C#4" in Zustand).
    pitch: isRest ? null : `${letter}${octave}`,
    accidental: isRest ? null : accidental,
    tied: !isRest && (note.tie === "start" || note.tie === "continue"),
    isRest,
  };

  return {
    id: `rse-${note.id}`,
    duration: hfDurationToRs(note.duration),
    dotted: (note.dots ?? 0) > 0,
    notes: [rsNote],
    isRest,
  };
}

function hfMeasureToRs(measure: HfMeasure): RsMeasure {
  return {
    id: `rsm-${measure.id}`,
    events: measure.notes.map(hfNoteToRsEvent),
  };
}

function hfPartToRsStaff(part: Part): RsStaff {
  const firstMeasure = part.measures[0];
  return {
    id: `rss-${part.id}`,
    clef: hfClefToRs(part.clef),
    keySignature: hfKeySigToRs(firstMeasure?.keySignature),
    measures: part.measures.map(hfMeasureToRs),
  };
}

/**
 * Convert an EditableScore into a RiffScoreConfig for loading into the RiffScore component.
 */
export function editableScoreToRiffConfig(
  score: EditableScore,
  options?: {
    theme?: "DARK" | "LIGHT";
    scale?: number;
    /** Defaults to `true`. When `false`, score is display/playback only (no note editing or typing on canvas). */
    enableScoreEditing?: boolean;
    /** Defaults to `true`. Set `false` to hide the RiffScore toolbar (export/print capture). */
    showToolbar?: boolean;
    toolbarPlugins?: Array<{
      id?: string;
      label: string;
      title?: string;
      icon?: ReactNode;
      onClick?: () => void;
      showLabel?: boolean;
      isActive?: boolean;
      disabled?: boolean;
      isEmphasized?: boolean;
      isDashed?: boolean;
      className?: string;
    }>;
  },
): Partial<RiffScoreConfig> {
  const firstMeasure = score.parts[0]?.measures[0];
  const timeSignature = firstMeasure?.timeSignature ?? "4/4";
  const keySignature = hfKeySigToRs(firstMeasure?.keySignature);
  const showToolbar = options?.showToolbar ?? true;
  const editing = options?.enableScoreEditing ?? true;

  // `toolbarPlugins` is injected into RiffScore's UI config by patch-package
  // (see frontend/patches/riffscore+*.patch). Upstream types do not yet declare
  // it, so we widen the literal via a narrow cast rather than any-ing the
  // whole config. This avoids dropping other ui fields from type coverage.
  const ui = {
    showToolbar,
    scale: options?.scale ?? 1,
    theme: options?.theme ?? "LIGHT",
    showBackground: false,
    showScoreTitle: false,
    toolbarPlugins: showToolbar ? options?.toolbarPlugins ?? [] : [],
  } as RiffScoreConfig["ui"];

  const base: Partial<RiffScoreConfig> = {
    ui,
    interaction: {
      isEnabled: editing,
      enableKeyboard: editing,
      enablePlayback: true,
    },
    score: {
      title: "",
      bpm: score.bpm ?? 120,
      timeSignature,
      keySignature,
      staves: score.parts.map(hfPartToRsStaff),
    },
  };

  if (shouldShowChordNotation(score)) {
    base.chord = {
      display: { notation: "letter", useSymbols: true },
      playback: { enabled: true, velocity: 52 },
    };
  }

  return base;
}

/**
 * Convert an EditableScore into a RiffScore Score object for loadScore() API.
 */
export function editableScoreToRsScore(score: EditableScore): RsScore {
  const firstMeasure = score.parts[0]?.measures[0];
  const rs: RsScore = {
    title: "",
    timeSignature: firstMeasure?.timeSignature ?? "4/4",
    keySignature: hfKeySigToRs(firstMeasure?.keySignature),
    bpm: score.bpm ?? 120,
    staves: score.parts.map(hfPartToRsStaff),
  };
  if (shouldShowChordNotation(score) && score.chords?.length) {
    rs.chordTrack = score.chords.map((c) => ({
      id: c.id,
      quant: c.quant,
      symbol: c.symbol,
    }));
  }
  return rs;
}

// ---------------------------------------------------------------------------
// RsScore -> EditableScore
// ---------------------------------------------------------------------------

function rsEventToHfNote(
  event: ScoreEvent,
  idMap: IdMap,
  previousScore?: EditableScore | null,
): HfNote | null {
  if (event.isRest) {
    const restSourceId = event.notes[0]?.id ?? event.id;
    const hfId = idMap.get(restSourceId) ?? `n-${restSourceId}`;
    return {
      id: hfId,
      pitch: "B4",
      duration: rsDurationToHf(event.duration),
      dots: event.dotted ? 1 : 0,
      isRest: true,
    };
  }
  if (event.notes.length === 0) return null;
  const rsNote = event.notes[0];
  if (!rsNote.pitch) return null;

  // Try to recover original HF note ID from the map
  const hfId = idMap.get(rsNote.id) ?? `n-${rsNote.id}`;

  const pitch = rsPitchToHf(rsNote);
  const duration = rsDurationToHf(event.duration);
  const dots = event.dotted ? 1 : 0;
  const tie = rsNote.tied ? "start" as const : undefined;

  const base: HfNote = { id: hfId, pitch, duration, dots, tie };
  if (previousScore) {
    const prevHit = getNoteById(previousScore, hfId);
    const og = prevHit?.note.originalGeneratedPitch;
    if (typeof og === "string" && og.length > 0) {
      return { ...base, originalGeneratedPitch: og };
    }
  }
  return base;
}

function rsMeasureToHf(
  measure: RsMeasure,
  idMap: IdMap,
  index: number,
  previousScore?: EditableScore | null,
): HfMeasure {
  const notes: HfNote[] = [];
  for (const event of measure.events) {
    const note = rsEventToHfNote(event, idMap, previousScore);
    if (note) notes.push(note);
  }
  return {
    id: `m-${measure.id ?? index}`,
    notes,
  };
}

function rsStaffToHfPart(
  staff: RsStaff,
  partName: string,
  partId: string,
  idMap: IdMap,
  previousScore?: EditableScore | null,
): Part {
  return {
    id: partId,
    name: partName,
    clef: staff.clef === "grand" ? "treble" : staff.clef,
    measures: staff.measures.map((m, i) => rsMeasureToHf(m, idMap, i, previousScore)),
  };
}

const DEFAULT_PART_NAMES = ["Soprano", "Alto", "Tenor", "Bass"];
const DEFAULT_PART_IDS = ["soprano", "alto", "tenor", "bass"];

/**
 * Convert a RiffScore Score object back into an EditableScore.
 * Uses the rsToHf ID map to preserve original note IDs where possible.
 * When `previousScore` is set, copies `originalGeneratedPitch` onto notes whose ids survived the round-trip.
 */
export function riffScoreToEditableScore(
  rsScore: RsScore,
  rsToHf: IdMap,
  originalParts?: Part[],
  previousScore?: EditableScore | null,
): EditableScore {
  const parts = rsScore.staves.map((staff, i) => {
    const name = originalParts?.[i]?.name ?? DEFAULT_PART_NAMES[i] ?? `Part ${i + 1}`;
    const id = originalParts?.[i]?.id ?? DEFAULT_PART_IDS[i] ?? `part-${i}`;
    return rsStaffToHfPart(staff, name, id, rsToHf, previousScore);
  });

  // Propagate key/time signature from the RiffScore score level
  const keySig = rsKeySigToHf(rsScore.keySignature);
  for (const part of parts) {
    if (part.measures.length > 0) {
      part.measures[0].keySignature = keySig;
      part.measures[0].timeSignature = rsScore.timeSignature;
    }
  }

  const next: EditableScore = { parts, divisions: 1 };
  if (shouldShowChordNotation(next) && rsScore.chordTrack?.length) {
    next.chords = rsScore.chordTrack.map((c) => ({
      id: c.id,
      quant: c.quant,
      symbol: c.symbol,
    }));
  } else if (shouldShowChordNotation(next) && previousScore?.chords?.length) {
    next.chords = previousScore.chords.map((c) => ({ ...c }));
  }
  if (typeof rsScore.bpm === "number" && Number.isFinite(rsScore.bpm) && rsScore.bpm > 0) {
    next.bpm = rsScore.bpm;
  } else if (previousScore?.bpm !== undefined) {
    next.bpm = previousScore.bpm;
  }
  return next;
}
