/**
 * Utilities for EditableScore manipulation.
 */

import type {
  BarlineStyle,
  EditableScore,
  Note,
  Part,
  Measure,
  DurationType,
} from "./scoreTypes";
import { generateId } from "./scoreTypes";
import type { ScoreCorrection } from "./suggestionTypes";

function midiToPitch(midi: number): string {
  const oct = Math.floor(midi / 12);
  const pc = ((midi % 12) + 12) % 12;
  const steps = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${steps[pc]}${oct}`;
}

const STEP_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const DURATION_BEATS: Record<DurationType, number> = {
  w: 4,
  h: 2,
  q: 1,
  "8": 0.5,
  "16": 0.25,
  "32": 0.125,
};

function pitchToMidi(pitch: string): number {
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return 60;
  const step = m[1] ?? "C";
  const octNum = parseInt(m[3] ?? "4", 10);
  let semitones = (STEP_SEMITONES[step] ?? 0) + (octNum - 4) * 12;
  if (m[2] === "#") semitones += 1;
  if (m[2] === "b") semitones -= 1;
  return 60 + semitones;
}

/** Deep clone EditableScore */
export function cloneScore(score: EditableScore): EditableScore {
  return JSON.parse(JSON.stringify(score));
}

/** Pitches in a measure across all parts (non-rest), deduped — for localized regenerate context. */
export function collectNonRestPitchesInMeasure(
  score: EditableScore,
  measureIndex: number,
): string[] {
  const out: string[] = [];
  for (const part of score.parts) {
    const measure = part.measures[measureIndex];
    if (!measure) continue;
    for (const note of measure.notes) {
      if (!note.isRest && note.pitch) out.push(note.pitch);
    }
  }
  return [...new Set(out)];
}

export function noteBeats(note: Note): number {
  const base = DURATION_BEATS[note.duration] ?? 1;
  if (!note.dots) return base;
  let factor = 1;
  let add = 0.5;
  for (let i = 0; i < note.dots; i++) {
    factor += add;
    add /= 2;
  }
  return base * factor;
}

export function parseMeasureBeats(timeSignature?: string): number {
  if (!timeSignature) return 4;
  const m = timeSignature.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return 4;
  const num = Number.parseInt(m[1] ?? "4", 10);
  const den = Number.parseInt(m[2] ?? "4", 10);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 4;
  return (num * 4) / den;
}

/** Time signature string for column `measureIndex` (cascades to previous measures, then 4/4). */
export function effectiveMeasureTimeSignature(score: EditableScore, measureIndex: number): string {
  const ref = score.parts[0];
  if (!ref) return "4/4";
  for (let i = measureIndex; i >= 0; i--) {
    const ts = ref.measures[i]?.timeSignature;
    if (ts) return ts;
  }
  return "4/4";
}

function maxMeasureCount(score: EditableScore): number {
  if (score.parts.length === 0) return 0;
  return Math.max(0, ...score.parts.map((p) => p.measures.length));
}

function measureTotalBeats(notes: Note[]): number {
  return notes.reduce((s, n) => s + noteBeats(n), 0);
}

const METER_EPS = 1e-4;

/** True if any measure column exceeds its effective time signature capacity. */
export function scoreHasMeasureOverflow(score: EditableScore): boolean {
  const n = maxMeasureCount(score);
  for (let mi = 0; mi < n; mi++) {
    const cap = parseMeasureBeats(effectiveMeasureTimeSignature(score, mi));
    for (const p of score.parts) {
      const m = p.measures[mi];
      if (!m) continue;
      if (measureTotalBeats(m.notes) > cap + METER_EPS) return true;
    }
  }
  return false;
}

const BEAT_UNITS = 8; // 1 quarter note = 8 units (smallest supported duration: 1/32 = 1 unit)

/** Greedy exact decomposition in eighth-of-a-quarter units (supports dotted values). */
const DUR_UNIT_BREAKDOWN: Array<{ duration: DurationType; units: number; dots: 0 | 1 }> = [
  { duration: "w", units: 32, dots: 0 },
  { duration: "h", units: 24, dots: 1 },
  { duration: "h", units: 16, dots: 0 },
  { duration: "q", units: 12, dots: 1 },
  { duration: "q", units: 8, dots: 0 },
  { duration: "8", units: 6, dots: 1 },
  { duration: "8", units: 4, dots: 0 },
  { duration: "16", units: 3, dots: 1 },
  { duration: "16", units: 2, dots: 0 },
  { duration: "32", units: 1, dots: 0 },
];

function decomposeBeatUnitsExact(totalUnits: number): Array<{ duration: DurationType; dots: 0 | 1 }> {
  const out: Array<{ duration: DurationType; dots: 0 | 1 }> = [];
  let u = Math.max(0, Math.round(totalUnits));
  for (const row of DUR_UNIT_BREAKDOWN) {
    while (u >= row.units) {
      out.push({ duration: row.duration, dots: row.dots });
      u -= row.units;
    }
  }
  while (u > 0) {
    out.push({ duration: "32", dots: 0 });
    u -= 1;
  }
  return out;
}

function tieFirstSegmentBeforeBarline(seg: Note[]): void {
  if (seg.length === 0) return;
  if (seg.length === 1) {
    seg[0].tie = "start";
    return;
  }
  seg[0].tie = "start";
  for (let i = 1; i < seg.length - 1; i++) {
    seg[i].tie = "continue";
  }
  seg[seg.length - 1]!.tie = "start";
}

function tieSecondSegmentAfterBarline(seg: Note[]): void {
  if (seg.length === 0) return;
  seg[0].tie = "stop";
  for (let i = 1; i < seg.length; i++) {
    delete seg[i].tie;
  }
}

function splitNoteForBarline(note: Note, firstSegmentUnits: number): { first: Note[]; second: Note[] } {
  const totalUnits = beatsToUnits(noteBeats(note));
  const fsu = Math.round(firstSegmentUnits);
  if (note.tuplet) {
    return { first: [], second: [note] };
  }
  if (fsu <= 0 || fsu >= totalUnits) {
    return { first: [note], second: [] };
  }
  const specs1 = decomposeBeatUnitsExact(fsu);
  const specs2 = decomposeBeatUnitsExact(totalUnits - fsu);
  const strip: Note = { ...note };
  delete strip.tie;
  const first: Note[] = specs1.map((s) => ({
    ...strip,
    id: generateId("n"),
    duration: s.duration,
    dots: s.dots ? 1 : undefined,
  }));
  const second: Note[] = specs2.map((s) => ({
    ...strip,
    id: generateId("n"),
    duration: s.duration,
    dots: s.dots ? 1 : undefined,
  }));
  tieFirstSegmentBeforeBarline(first);
  tieSecondSegmentAfterBarline(second);
  return { first, second };
}

function partitionNotesAtCap(notes: Note[], capBeats: number): { head: Note[]; tail: Note[] } {
  const capUnits = beatsToUnits(capBeats);
  let accUnits = 0;
  let i = 0;
  const head: Note[] = [];
  while (i < notes.length) {
    const n = notes[i]!;
    const nUnits = beatsToUnits(noteBeats(n));
    if (accUnits + nUnits <= capUnits + 1e-6) {
      head.push(n);
      accUnits += nUnits;
      i++;
      continue;
    }
    if (accUnits >= capUnits - 1e-6) {
      return { head, tail: notes.slice(i) };
    }
    const remUnits = capUnits - accUnits;
    const { first, second } = splitNoteForBarline(n, remUnits);
    head.push(...first);
    return { head, tail: [...second, ...notes.slice(i + 1)] };
  }
  return { head, tail: [] };
}

function insertSplitAtMeasure(next: EditableScore, mi: number, cap: number): void {
  const tails: Note[][] = next.parts.map((p) => {
    const m = p.measures[mi];
    if (!m) return [];
    const { head, tail } = partitionNotesAtCap(m.notes, cap);
    m.notes = head;
    return tail;
  });

  const refMeasure = next.parts[0]?.measures[mi];
  const ts = refMeasure?.timeSignature;
  const keySig = refMeasure?.keySignature;

  for (let pi = 0; pi < next.parts.length; pi++) {
    const p = next.parts[pi];
    const tail = tails[pi] ?? [];
    if (mi + 1 < p.measures.length) {
      const nextM = p.measures[mi + 1]!;
      nextM.notes = [...tail, ...nextM.notes];
    } else {
      p.measures.push({
        id: generateId("m"),
        notes: tail,
        ...(ts ? { timeSignature: ts } : {}),
        ...(keySig !== undefined ? { keySignature: keySig } : {}),
      });
    }
  }
}

/**
 * Split any measure columns that exceed the effective time signature so each bar’s
 * written durations fit the meter. Inserts or extends the next measure(s) across **all**
 * parts so barlines stay aligned (sparse parts get overflow prepended only when they had overflow).
 * Run **before** {@link normalizeScoreRests} so under-filled bars pick up rests.
 */
export function enforceMeasureBeatCaps(score: EditableScore): EditableScore {
  if (!score.parts.length) return cloneScore(score);
  const next = cloneScore(score);
  let mi = 0;
  let guard = 0;
  while (mi < maxMeasureCount(next) && guard < 10_000) {
    guard++;
    const cap = parseMeasureBeats(effectiveMeasureTimeSignature(next, mi));
    let overflow = false;
    for (const p of next.parts) {
      const m = p.measures[mi];
      if (!m) continue;
      if (measureTotalBeats(m.notes) > cap + METER_EPS) {
        overflow = true;
        break;
      }
    }
    if (!overflow) {
      mi++;
      continue;
    }
    insertSplitAtMeasure(next, mi, cap);
  }
  return next;
}

const REST_BREAKDOWN: Array<{ duration: DurationType; units: number }> = [
  { duration: "w", units: 32 },
  { duration: "h", units: 16 },
  { duration: "q", units: 8 },
  { duration: "8", units: 4 },
  { duration: "16", units: 2 },
  { duration: "32", units: 1 },
];

function beatsToUnits(beats: number): number {
  return Math.max(0, Math.round(beats * BEAT_UNITS));
}

function makeRestNotes(units: number): Note[] {
  const rests: Note[] = [];
  let remaining = Math.max(0, units);
  for (const option of REST_BREAKDOWN) {
    while (remaining >= option.units) {
      rests.push({
        id: generateId("n"),
        pitch: "B4",
        duration: option.duration,
        isRest: true,
      });
      remaining -= option.units;
    }
  }
  return rests;
}

/**
 * Beat-aware rest filler (Iter1 §1 — fixes 8th+16th misalignment):
 * break the gap into sub-gaps that each fit inside one quarter-note beat
 * starting at `startUnits`. Without this, a 0.25-beat remainder after
 * an 8th+16th inside beat 3 can get grouped as a quarter rest that spans
 * into beat 4, pushing downstream notes onto the wrong beat.
 */
function makeBeatAwareRestNotes(startUnits: number, totalUnits: number): Note[] {
  const QUARTER_UNITS = BEAT_UNITS; // 8 units = 1 quarter
  const rests: Note[] = [];
  let cursor = startUnits;
  let remaining = Math.max(0, totalUnits);
  while (remaining > 0) {
    const beatStart = Math.floor(cursor / QUARTER_UNITS) * QUARTER_UNITS;
    const nextBeat = beatStart + QUARTER_UNITS;
    const gapInBeat = Math.min(nextBeat - cursor, remaining);
    const gapUnits = gapInBeat > 0 ? gapInBeat : remaining;
    rests.push(...makeRestNotes(gapUnits));
    cursor += gapUnits;
    remaining -= gapUnits;
  }
  return rests;
}

/**
 * Ensure every measure is rhythmically complete by appending rests when underfilled.
 * Mirrors notation-editor behavior (e.g. MuseScore/Noteflight) where empty remaining
 * duration in a measure is represented as rests.
 */
export function normalizeScoreRests(score: EditableScore): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      const measureBeats = parseMeasureBeats(measure.timeSignature);
      const measureUnits = beatsToUnits(measureBeats);
      let usedUnits = beatsToUnits(
        measure.notes.reduce((sum, note) => sum + noteBeats(note), 0),
      );

      // If overfilled, preferentially remove trailing rests first.
      while (
        usedUnits > measureUnits &&
        measure.notes.length > 0 &&
        measure.notes[measure.notes.length - 1]?.isRest
      ) {
        const removed = measure.notes.pop();
        if (!removed) break;
        usedUnits -= beatsToUnits(noteBeats(removed));
      }

      if (usedUnits >= measureUnits) continue;
      const fillRests = makeBeatAwareRestNotes(usedUnits, measureUnits - usedUnits);
      if (fillRests.length > 0) measure.notes.push(...fillRests);
    }
  }
  return next;
}

export function getInsertIndexAtBeat(measure: Measure, beat: number): number {
  if (!measure.notes.length) return 0;
  let cursor = 0;
  for (let i = 0; i < measure.notes.length; i++) {
    const start = cursor;
    cursor += noteBeats(measure.notes[i]);
    if (beat <= start + 0.001) return i;
    if (beat > start && beat < cursor) return i + 1;
  }
  return measure.notes.length;
}

/** Get note by ID from score */
export function getNoteById(score: EditableScore, noteId: string): { part: Part; measure: Measure; note: Note; partIdx: number; measureIdx: number; noteIdx: number } | null {
  for (let pIdx = 0; pIdx < score.parts.length; pIdx++) {
    const part = score.parts[pIdx];
    for (let mIdx = 0; mIdx < part.measures.length; mIdx++) {
      const measure = part.measures[mIdx];
      const noteIdx = measure.notes.findIndex((n) => n.id === noteId);
      if (noteIdx >= 0) {
        return { part, measure, note: measure.notes[noteIdx], partIdx: pIdx, measureIdx: mIdx, noteIdx };
      }
    }
  }
  return null;
}

/** Delete notes by ID, return new score */
export function deleteNotes(score: EditableScore, noteIds: Set<string>): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      measure.notes = measure.notes.filter((n) => !noteIds.has(n.id));
    }
  }
  return next;
}

/**
 * Replace selected notes with rests of the *same* duration + dots (Iter2 §2):
 * "deleting a note left the measure visually incomplete or unexpectedly
 *  altered the duration of surrounding notes." MuseScore/Noteflight behavior
 * is to swap the event for a rest placeholder, never shortening neighbors.
 * Returned score keeps every note-id (easier for undo/suggestion rollback);
 * pitch is overwritten to "B4" (middle rest position) and `isRest` set.
 */
export function deleteNotesAsRests(
  score: EditableScore,
  noteIds: Set<string>,
): EditableScore {
  if (noteIds.size === 0) return score;
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (!noteIds.has(note.id)) continue;
        note.isRest = true;
        note.pitch = "B4";
        delete note.articulations;
        delete note.dynamics;
        delete note.tie;
        delete note.originalGeneratedPitch;
      }
    }
  }
  return next;
}

/** Extract notes by ID for clipboard */
export function extractNotes(score: EditableScore, noteIds: Set<string>): Note[] {
  const notes: Note[] = [];
  for (const part of score.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (noteIds.has(note.id)) {
          const copy: Note = { ...note, id: generateId("n") };
          delete copy.originalGeneratedPitch;
          notes.push(copy);
        }
      }
    }
  }
  return notes;
}

/** Set duration on notes by ID */
export function setNoteDurations(score: EditableScore, noteIds: Set<string>, duration: DurationType): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (noteIds.has(note.id)) {
          note.duration = duration;
        }
      }
    }
  }
  return next;
}

/** Toggle dotted on notes by ID */
export function toggleNoteDots(score: EditableScore, noteIds: Set<string>): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (noteIds.has(note.id)) {
          note.dots = (note.dots ?? 0) === 1 ? 0 : 1;
        }
      }
    }
  }
  return next;
}

const LETTER_TO_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const CLEF_REPITCH_DEFAULT: Record<string, string> = {
  treble: "B4",
  alto: "C4",
  tenor: "A3",
  bass: "D3",
};

/**
 * Pick a sensible starting octave for restoring a rest back to a pitched note.
 * Priority:
 *   1. The nearest pitched neighbor in the same measure.
 *   2. Any pitched note elsewhere in the part (in measure distance order).
 *   3. The part's clef default (treble → B4, bass → D3, etc.).
 *   4. Middle-C octave (4).
 */
function neighborOctaveForRepitch(
  part: Part,
  measureIdx: number,
  noteIdx: number,
): number {
  const measure = part.measures[measureIdx];
  if (measure) {
    for (let i = noteIdx - 1; i >= 0; i--) {
      const prev = measure.notes[i];
      if (prev && !prev.isRest) {
        const m = prev.pitch.match(/^[A-G](#|b)?(\d+)$/);
        if (m?.[2]) return Number.parseInt(m[2], 10);
      }
    }
    for (let i = noteIdx + 1; i < measure.notes.length; i++) {
      const next = measure.notes[i];
      if (next && !next.isRest) {
        const m = next.pitch.match(/^[A-G](#|b)?(\d+)$/);
        if (m?.[2]) return Number.parseInt(m[2], 10);
      }
    }
  }
  const offsets = [];
  for (let d = 1; d <= part.measures.length; d++) {
    offsets.push(-d, d);
  }
  for (const delta of offsets) {
    const other = part.measures[measureIdx + delta];
    if (!other) continue;
    for (const n of other.notes) {
      if (n.isRest) continue;
      const m = n.pitch.match(/^[A-G](#|b)?(\d+)$/);
      if (m?.[2]) return Number.parseInt(m[2], 10);
    }
  }
  const defaultPitch = CLEF_REPITCH_DEFAULT[part.clef.toLowerCase()] ?? "B4";
  const m = defaultPitch.match(/^[A-G](#|b)?(\d+)$/);
  return m?.[2] ? Number.parseInt(m[2], 10) : 4;
}

/**
 * Pick the octave whose semitone distance is closest to the neighbor pitch.
 * Prevents "A" defaulting to A4 when the surrounding melody lives in octave 5.
 */
function nearestOctaveForLetter(
  part: Part,
  measureIdx: number,
  noteIdx: number,
  letter: string,
): number {
  const measure = part.measures[measureIdx];
  const pickNeighbor = (m?: Measure): string | null => {
    if (!m) return null;
    for (const n of m.notes) {
      if (!n.isRest) return n.pitch;
    }
    return null;
  };
  const neighborPitch = (() => {
    if (!measure) return null;
    for (let i = noteIdx - 1; i >= 0; i--) {
      const n = measure.notes[i];
      if (n && !n.isRest) return n.pitch;
    }
    for (let i = noteIdx + 1; i < measure.notes.length; i++) {
      const n = measure.notes[i];
      if (n && !n.isRest) return n.pitch;
    }
    return (
      pickNeighbor(part.measures[measureIdx - 1]) ??
      pickNeighbor(part.measures[measureIdx + 1])
    );
  })();
  if (!neighborPitch) {
    return neighborOctaveForRepitch(part, measureIdx, noteIdx);
  }
  const neighborMidi = pitchToMidi(neighborPitch);
  const neighborOct = (() => {
    const m = neighborPitch.match(/^[A-G](#|b)?(\d+)$/);
    return m?.[2] ? Number.parseInt(m[2], 10) : 4;
  })();
  let bestOct = neighborOct;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const oct of [neighborOct - 1, neighborOct, neighborOct + 1]) {
    const candidateMidi = pitchToMidi(`${letter}${oct}`);
    const dist = Math.abs(candidateMidi - neighborMidi);
    if (dist < bestDist) {
      bestDist = dist;
      bestOct = oct;
    }
  }
  return bestOct;
}

/**
 * Re-pitch: convert the matching rests into pitched notes at the given letter,
 * preserving each rest's duration/dots (MuseScore "type over rest" behavior).
 * Non-rest notes in `noteIds` get their letter rewritten at the nearest octave.
 */
export function restsToNotes(
  score: EditableScore,
  noteIds: Set<string>,
  letter: string,
): EditableScore {
  if (noteIds.size === 0) return score;
  const letterKey = letter.toUpperCase();
  if (!(letterKey in LETTER_TO_PC)) return score;
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (let mi = 0; mi < part.measures.length; mi++) {
      const measure = part.measures[mi];
      for (let ni = 0; ni < measure.notes.length; ni++) {
        const note = measure.notes[ni];
        if (!noteIds.has(note.id)) continue;
        const octave = nearestOctaveForLetter(part, mi, ni, letterKey);
        note.pitch = `${letterKey}${octave}`;
        if (note.isRest) {
          note.isRest = false;
          delete note.articulations;
          delete note.dynamics;
          delete note.tie;
          delete note.originalGeneratedPitch;
        }
      }
    }
  }
  return next;
}

/**
 * Convert a single rest into a pitched note at an explicit pitch; duration is
 * preserved. Used by drag-from-palette and keyboard-with-cursor affordances.
 */
export function convertRestToPitch(
  score: EditableScore,
  noteId: string,
  pitch: string,
): EditableScore {
  const next = cloneScore(score);
  const found = getNoteById(next, noteId);
  if (!found) return score;
  found.note.pitch = pitch;
  if (found.note.isRest) {
    found.note.isRest = false;
    delete found.note.articulations;
    delete found.note.dynamics;
    delete found.note.tie;
    delete found.note.originalGeneratedPitch;
  }
  return next;
}

/**
 * Set pitch to a specific letter (A–G) keeping the octave close to current.
 *
 * When the target note is a rest we delegate to `restsToNotes`, matching
 * MuseScore / Noteflight where typing A–G on a selected rest turns the rest
 * into a note of the same duration at that pitch.
 */
export function setPitchByLetter(score: EditableScore, noteIds: Set<string>, letter: string): EditableScore {
  const letterKey = letter.toUpperCase();
  if (!(letterKey in LETTER_TO_PC)) return score;
  const targetPc = LETTER_TO_PC[letterKey];
  let needsRepitchPass = false;
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (!noteIds.has(note.id)) continue;
        if (note.isRest) {
          needsRepitchPass = true;
          continue;
        }
        const midi = pitchToMidi(note.pitch);
        const oct = Math.floor(midi / 12) - 1;
        const newMidi = (oct + 1) * 12 + targetPc;
        note.pitch = midiToPitch(newMidi);
      }
    }
  }
  return needsRepitchPass ? restsToNotes(next, noteIds, letterKey) : next;
}

/** Compact fingerprint of pitch/rest state for a set of note ids (live multi-pitch sync dedupe). */
export function noteSetPitchFingerprint(score: EditableScore, noteIds: Iterable<string>): string {
  const parts: string[] = [];
  for (const id of noteIds) {
    const hit = getNoteById(score, id);
    if (!hit) {
      parts.push(`${id}:`);
      continue;
    }
    const { note } = hit;
    parts.push(`${id}:${note.isRest ? "rest" : (note.pitch ?? "").trim()}`);
  }
  parts.sort();
  return parts.join("|");
}

/**
 * After a RiffScore pull, if several notes were selected and the editor applied the same
 * chromatic delta to one (or more) of them, apply that delta to every other selected note
 * that did not change — so dragging or repitching one note in a bar selection updates the group.
 */
export function propagateMultiSelectPitchDelta(
  prev: EditableScore | null,
  next: EditableScore,
  selectedNoteIds: ReadonlySet<string>,
): EditableScore {
  if (!prev || selectedNoteIds.size < 2) return next;

  let delta: number | null = null;
  const changedIds = new Set<string>();

  for (const id of selectedNoteIds) {
    const a = getNoteById(prev, id);
    const b = getNoteById(next, id);
    if (!a || !b) continue;
    if (a.note.isRest !== b.note.isRest) return next;
    if (a.note.isRest && b.note.isRest) continue;
    const pa = a.note.pitch?.trim();
    const pb = b.note.pitch?.trim();
    if (!pa || !pb) continue;
    if (a.note.pitch !== b.note.pitch) {
      const d = pitchToMidi(b.note.pitch) - pitchToMidi(a.note.pitch);
      if (delta === null) delta = d;
      else if (Math.abs(d - delta) > 0.001) return next;
      changedIds.add(id);
    }
  }

  if (delta == null || Math.abs(delta) < 0.001 || changedIds.size === 0) return next;

  const out = cloneScore(next);
  for (const id of selectedNoteIds) {
    if (changedIds.has(id)) continue;
    const a = getNoteById(prev, id);
    const b = getNoteById(out, id);
    if (!a || !b) continue;
    if (a.note.isRest || b.note.isRest) continue;
    if (a.note.pitch !== b.note.pitch) continue;
    b.note.pitch = midiToPitch(pitchToMidi(b.note.pitch) + delta);
  }
  return out;
}

/**
 * Transpose notes by ID by semitones. Rests are converted to a pitched note at
 * their neighbor-derived default pitch first (so arrow-up on a selected rest
 * restores a usable note, matching MuseScore repitch), then transposed.
 */
export function transposeNotes(score: EditableScore, noteIds: Set<string>, semitones: number): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (let mi = 0; mi < part.measures.length; mi++) {
      const measure = part.measures[mi];
      for (let ni = 0; ni < measure.notes.length; ni++) {
        const note = measure.notes[ni];
        if (!noteIds.has(note.id)) continue;
        if (note.isRest) {
          const octave = neighborOctaveForRepitch(part, mi, ni);
          const defaultPitch = `B${octave}`;
          note.isRest = false;
          note.pitch = midiToPitch(pitchToMidi(defaultPitch) + semitones);
          delete note.articulations;
          delete note.dynamics;
          delete note.tie;
          delete note.originalGeneratedPitch;
          continue;
        }
        const midi = pitchToMidi(note.pitch);
        note.pitch = midiToPitch(midi + semitones);
      }
    }
  }
  return next;
}

/** Add articulation to notes by ID */
export function addArticulation(score: EditableScore, noteIds: Set<string>, articulation: string): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (noteIds.has(note.id)) {
          const arts = note.articulations ?? [];
          if (!arts.includes(articulation)) arts.push(articulation);
          note.articulations = arts;
        }
      }
    }
  }
  return next;
}

/** Set dynamics on notes by ID */
export function setNoteDynamics(score: EditableScore, noteIds: Set<string>, dynamics: string): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (noteIds.has(note.id)) {
          note.dynamics = dynamics;
        }
      }
    }
  }
  return next;
}

/** Insert empty measure before index */
export function insertMeasureBefore(score: EditableScore, measureIndex: number): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    part.measures.splice(measureIndex, 0, { id: generateId("m"), notes: [] });
  }
  return next;
}

/** Insert empty measure after index */
export function insertMeasureAfter(score: EditableScore, measureIndex: number): EditableScore {
  return insertMeasureBefore(score, measureIndex + 1);
}

/** Delete measure at index */
export function deleteMeasure(score: EditableScore, measureIndex: number): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    if (measureIndex >= 0 && measureIndex < part.measures.length) {
      part.measures.splice(measureIndex, 1);
    }
  }
  return next;
}

/** Insert a note at the given position. Default pitch C4, quarter duration. */
export function insertNote(
  score: EditableScore,
  partId: string,
  measureIndex: number,
  noteIndex: number,
  note: Partial<Note> = {}
): EditableScore {
  const next = cloneScore(score);
  const part = next.parts.find((p) => p.id === partId);
  if (!part || measureIndex < 0 || measureIndex >= part.measures.length) return score;
  const measure = part.measures[measureIndex];
  const newNote: Note = {
    id: generateId("n"),
    pitch: note.pitch ?? "C4",
    duration: (note.duration ?? "q") as DurationType,
    isRest: note.isRest ?? false,
    dots: note.dots,
    tie: note.tie,
    articulations: note.articulations,
    dynamics: note.dynamics,
  };
  const clampedIndex = Math.min(noteIndex, measure.notes.length);
  if (measure.notes[clampedIndex]?.isRest) {
    // Modern notation UX: typing into a rest slot replaces it, then normalization
    // restores trailing rests as needed.
    measure.notes.splice(clampedIndex, 1, newNote);
  } else {
    measure.notes.splice(clampedIndex, 0, newNote);
  }
  return next;
}

/** Apply a single correction: replace a note's pitch (and optionally duration). */
export function applySuggestion(
  score: EditableScore,
  correction: ScoreCorrection,
  opts?: { allowRhythm?: boolean },
): EditableScore {
  const allowRhythm = opts?.allowRhythm ?? false;
  const next = cloneScore(score);
  const found = getNoteById(next, correction.noteId);
  if (!found) return score;
  found.note.pitch = correction.suggestedPitch;
  if (allowRhythm && correction.suggestedDuration) {
    found.note.duration = correction.suggestedDuration;
  }
  return next;
}

/** Apply multiple corrections in a single clone (one undo step). */
export function applySuggestions(
  score: EditableScore,
  corrections: ScoreCorrection[],
  opts?: { allowRhythm?: boolean },
): EditableScore {
  const allowRhythm = opts?.allowRhythm ?? false;
  const next = cloneScore(score);
  for (const correction of corrections) {
    const found = getNoteById(next, correction.noteId);
    if (!found) continue;
    found.note.pitch = correction.suggestedPitch;
    if (allowRhythm && correction.suggestedDuration) {
      found.note.duration = correction.suggestedDuration;
    }
  }
  return next;
}

// ---------------------------------------------------------------------------
// Palette-driven reducers (MuseScore/Noteflight parity)
// ---------------------------------------------------------------------------

/** Apply a barline style to the given measure for every part. */
export function setMeasureBarline(
  score: EditableScore,
  measureIndex: number,
  style: BarlineStyle,
): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    const measure = part.measures[measureIndex];
    if (measure) measure.barline = style;
  }
  return next;
}

/** Attach a repeat / jump marker (segno, coda, D.C., D.S., fine) to a measure. */
export function setMeasureRepeatMark(
  score: EditableScore,
  measureIndex: number,
  mark: "segno" | "coda" | "dc" | "ds" | "fine" | null,
): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    const measure = part.measures[measureIndex];
    if (measure) {
      if (mark === null) delete measure.repeatMark;
      else measure.repeatMark = mark;
    }
  }
  return next;
}

/** Set a tempo text annotation (e.g. "Andante", "q = 120") on a measure. */
export function setMeasureTempoText(
  score: EditableScore,
  measureIndex: number,
  text: string | null,
  bpm?: number,
): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    const measure = part.measures[measureIndex];
    if (measure) {
      if (text === null) delete measure.tempoText;
      else measure.tempoText = text;
    }
  }
  if (bpm && bpm > 0) next.bpm = bpm;
  return next;
}

/** Add an ornament (trill, mordent, turn, etc.) to selected notes. */
export function setOrnament(
  score: EditableScore,
  noteIds: Set<string>,
  ornament: string | null,
): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (!noteIds.has(note.id)) continue;
        if (note.isRest) continue;
        if (ornament === null) delete note.ornament;
        else note.ornament = ornament;
      }
    }
  }
  return next;
}

/** Tag a group of selected notes with a tuplet number (3 = triplet, 5 = quintuplet…). */
export function setTuplet(
  score: EditableScore,
  noteIds: Set<string>,
  tuplet: number | null,
): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (!noteIds.has(note.id)) continue;
        if (tuplet === null) delete note.tuplet;
        else note.tuplet = tuplet;
      }
    }
  }
  return next;
}

/** Mark a slur / hairpin / 8va line start + end on the first/last selected note. */
export function setLineOnSelection(
  score: EditableScore,
  noteIds: Set<string>,
  kind: string,
): EditableScore {
  if (noteIds.size === 0) return score;
  const next = cloneScore(score);
  let first: Note | null = null;
  let last: Note | null = null;
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (!noteIds.has(note.id)) continue;
        if (!first) first = note;
        last = note;
      }
    }
  }
  if (first) first.lineStart = kind;
  if (last && last !== first) last.lineEnd = kind;
  else if (last && last === first) last.lineEnd = kind;
  return next;
}

/** Attach lyric text to each selected note (syllable-per-note). */
export function setNoteLyric(
  score: EditableScore,
  noteIds: Set<string>,
  lyric: string | null,
): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (!noteIds.has(note.id)) continue;
        if (lyric === null) delete note.lyric;
        else note.lyric = lyric;
      }
    }
  }
  return next;
}

/** Attach a chord symbol / performance / expression text to the first selected note. */
export function setNoteChordSymbol(
  score: EditableScore,
  noteIds: Set<string>,
  symbol: string | null,
): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (!noteIds.has(note.id)) continue;
        if (symbol === null) delete note.chordSymbol;
        else note.chordSymbol = symbol;
      }
    }
  }
  return next;
}

/** Update the score's BPM (playback tempo). */
export function setScoreBpm(score: EditableScore, bpm: number): EditableScore {
  if (!Number.isFinite(bpm) || bpm <= 0) return score;
  const next = cloneScore(score);
  next.bpm = bpm;
  return next;
}

function cloneMeasureWithNewNoteIds(measure: Measure): Measure {
  return {
    ...measure,
    id: generateId("m"),
    notes: measure.notes.map((n) => ({
      ...n,
      id: generateId("n"),
    })),
  };
}

/** Every note in one measure on a single part (Theory Inspector Alt+click on bar numbers). */
export function noteSelectionsForMeasurePart(
  score: EditableScore,
  measureIndex: number,
  partId: string,
): Array<{ partId: string; measureIndex: number; noteIndex: number; noteId: string }> {
  const part = score.parts.find((p) => p.id === partId);
  if (!part || measureIndex < 0 || measureIndex >= part.measures.length) return [];
  const measure = part.measures[measureIndex];
  if (!measure) return [];
  return measure.notes.map((note, noteIndex) => ({
    partId,
    measureIndex,
    noteIndex,
    noteId: note.id,
  }));
}

/** Melody line only (part 0) for full-score regeneration intake. */
export function extractMelodyOnlyScore(score: EditableScore): EditableScore {
  if (score.parts.length === 0) return score;
  return {
    divisions: score.divisions,
    bpm: score.bpm,
    chords: score.chords,
    parts: [score.parts[0]!],
  };
}

/**
 * Replace harmony staves’ measures in [startIdx, endIdx] with measures from a
 * freshly generated full score (same part ordering: melody + harmonies).
 */
function normalizePartNameKey(name: string | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

/** Result of merging a short generated score into the live arrangement (localized harmony). */
export type SpliceHarmonyMeasuresResult =
  | {
      ok: true;
      score: EditableScore;
      /** True when some target harmony staves had no matching generated part (measures left unchanged). */
      partialMerge?: boolean;
      skippedHarmonyPartNames?: string[];
    }
  | { ok: false; score: EditableScore; reason: string };

/**
 * Map each target harmony part index → addon part index (melody excluded). Returns `null` if the
 * addon declares more harmony parts than the live score (unsafe to merge).
 */
export function resolveHarmonyPartMapping(
  target: EditableScore,
  generatedAddon: EditableScore,
): { map: number[]; partialMerge: boolean; skippedHarmonyPartNames: string[] } | null {
  if (target.parts.length <= 1 || generatedAddon.parts.length <= 1) {
    return { map: [], partialMerge: false, skippedHarmonyPartNames: [] };
  }
  if (generatedAddon.parts.length > target.parts.length) {
    return null;
  }

  const nT = target.parts.length;
  const nA = generatedAddon.parts.length;
  /** targetPi → addonPi; index 0 unused (melody). */
  const map: number[] = new Array(nT).fill(-1);
  const usedAddon = new Set<number>();

  for (let pi = 1; pi < nT; pi++) {
    const tPart = target.parts[pi];
    if (!tPart) continue;
    const tKey = normalizePartNameKey(tPart.name);
    let chosen = -1;

    if (pi < nA && !usedAddon.has(pi)) {
      const aPart = generatedAddon.parts[pi];
      if (aPart && (tKey === "" || normalizePartNameKey(aPart.name) === tKey)) {
        chosen = pi;
      }
    }
    if (chosen < 0 && tKey !== "") {
      for (let j = 1; j < nA; j++) {
        if (usedAddon.has(j)) continue;
        const aPart = generatedAddon.parts[j];
        if (aPart && normalizePartNameKey(aPart.name) === tKey) {
          chosen = j;
          break;
        }
      }
    }
    if (chosen < 0 && pi < nA && !usedAddon.has(pi)) {
      chosen = pi;
    }

    if (chosen >= 0) {
      map[pi] = chosen;
      usedAddon.add(chosen);
    }
  }

  const skippedHarmonyPartNames: string[] = [];
  for (let pi = 1; pi < nT; pi++) {
    if (map[pi]! < 0) skippedHarmonyPartNames.push(target.parts[pi]?.name ?? `part ${pi}`);
  }
  const partialMerge = skippedHarmonyPartNames.length > 0;
  return { map, partialMerge, skippedHarmonyPartNames };
}

const EXTRA_HARMONY_REASON =
  "Generated score has more parts than the current arrangement. Regenerate the full score from Document to change the ensemble size.";

/** Inclusive measure range for localized harmony regenerate: multi-bar when selection spans measures. */
export function measureRangeForLocalizedHarmonyRegenerate(
  selection: Array<{ measureIndex: number }>,
  fallbackMeasureIndex: number,
): { startMeasure: number; endMeasure: number } {
  if (selection.length === 0) {
    return { startMeasure: fallbackMeasureIndex, endMeasure: fallbackMeasureIndex };
  }
  const measures = selection
    .map((s) => s.measureIndex)
    .filter((m) => Number.isFinite(m) && m >= 0);
  if (measures.length === 0) {
    return { startMeasure: fallbackMeasureIndex, endMeasure: fallbackMeasureIndex };
  }
  const uniq = new Set(measures);
  if (uniq.size <= 1) {
    const m = measures[0]!;
    return { startMeasure: m, endMeasure: m };
  }
  return {
    startMeasure: Math.min(...measures),
    endMeasure: Math.max(...measures),
  };
}

/**
 * Merge harmony-only measures from a **short** additive-generated score (one bar or more)
 * into the live arrangement. Aligns harmony staves by **part name** when counts differ; rejects
 * when the addon has **extra** harmony parts vs the live score.
 */
export function spliceHarmonyMeasuresFromAddonScore(
  target: EditableScore,
  generatedAddon: EditableScore,
  startMeasure: number,
): SpliceHarmonyMeasuresResult {
  if (target.parts.length <= 1 || generatedAddon.parts.length <= 1) {
    return { ok: true, score: target };
  }
  const sliceLen = generatedAddon.parts[0]?.measures.length ?? 0;
  if (sliceLen === 0) {
    return { ok: true, score: target };
  }

  const resolved = resolveHarmonyPartMapping(target, generatedAddon);
  if (resolved === null) {
    return { ok: false, score: target, reason: EXTRA_HARMONY_REASON };
  }
  const { map, partialMerge, skippedHarmonyPartNames } = resolved;

  const next = cloneScore(target);
  for (let i = 0; i < sliceLen; i++) {
    const targetMi = startMeasure + i;
    if (targetMi >= next.parts[0]!.measures.length) break;
    for (let pi = 1; pi < next.parts.length; pi++) {
      const addonPi = map[pi];
      if (addonPi == null || addonPi < 0) continue;
      const srcPart = generatedAddon.parts[addonPi];
      if (!srcPart || i >= srcPart.measures.length) continue;
      const dest = next.parts[pi];
      if (!dest || targetMi >= dest.measures.length) continue;
      dest.measures[targetMi] = cloneMeasureWithNewNoteIds(srcPart.measures[i]!);
    }
  }

  if (partialMerge && skippedHarmonyPartNames.length > 0) {
    return {
      ok: true,
      score: next,
      partialMerge: true,
      skippedHarmonyPartNames,
    };
  }
  return { ok: true, score: next };
}

export function replaceHarmonyMeasuresRange(
  score: EditableScore,
  generated: EditableScore,
  startIdx: number,
  endIdx: number,
): EditableScore {
  if (score.parts.length <= 1) return score;
  const maxIndex = Math.min(
    ...score.parts.map((p) => Math.max(0, p.measures.length - 1)),
  );
  const start = Math.max(0, Math.min(Math.min(startIdx, endIdx), maxIndex));
  const end = Math.max(start, Math.min(Math.max(startIdx, endIdx), maxIndex));

  const next = cloneScore(score);
  for (let pi = 1; pi < next.parts.length; pi++) {
    const genPart = generated.parts[pi];
    if (!genPart) continue;
    const part = next.parts[pi]!;
    for (let m = start; m <= end; m++) {
      if (m >= part.measures.length || m >= genPart.measures.length) continue;
      part.measures[m] = cloneMeasureWithNewNoteIds(genPart.measures[m]!);
    }
  }
  return next;
}
