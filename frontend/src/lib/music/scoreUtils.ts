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

const BEAT_UNITS = 8; // 1 quarter note = 8 units (smallest supported duration: 1/32 = 1 unit)
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
): EditableScore {
  const next = cloneScore(score);
  const found = getNoteById(next, correction.noteId);
  if (!found) return score;
  found.note.pitch = correction.suggestedPitch;
  if (correction.suggestedDuration) {
    found.note.duration = correction.suggestedDuration;
  }
  return next;
}

/** Apply multiple corrections in a single clone (one undo step). */
export function applySuggestions(
  score: EditableScore,
  corrections: ScoreCorrection[],
): EditableScore {
  const next = cloneScore(score);
  for (const correction of corrections) {
    const found = getNoteById(next, correction.noteId);
    if (!found) continue;
    found.note.pitch = correction.suggestedPitch;
    if (correction.suggestedDuration) {
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
