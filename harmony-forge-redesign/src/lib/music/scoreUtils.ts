/**
 * Utilities for EditableScore manipulation.
 */

import type { EditableScore, Note, Part, Measure, DurationType } from "./scoreTypes";
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
      const fillRests = makeRestNotes(measureUnits - usedUnits);
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

/** Set pitch to a specific letter (A–G) in the same octave as current note. For MuseScore-style A–G shortcut. */
export function setPitchByLetter(score: EditableScore, noteIds: Set<string>, letter: string): EditableScore {
  const LETTER_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const targetPc = LETTER_SEMITONES[letter.toUpperCase()] ?? 0;
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (noteIds.has(note.id)) {
          if (note.isRest) continue;
          const midi = pitchToMidi(note.pitch);
          const oct = Math.floor(midi / 12) - 1;
          const newMidi = (oct + 1) * 12 + targetPc;
          note.pitch = midiToPitch(newMidi);
        }
      }
    }
  }
  return next;
}

/** Transpose notes by ID by semitones */
export function transposeNotes(score: EditableScore, noteIds: Set<string>, semitones: number): EditableScore {
  const next = cloneScore(score);
  for (const part of next.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (noteIds.has(note.id)) {
          if (note.isRest) continue;
          const midi = pitchToMidi(note.pitch);
          note.pitch = midiToPitch(midi + semitones);
        }
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
