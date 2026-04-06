/**
 * Editable score model for Tactile Sandbox.
 */

export type DurationType = "w" | "h" | "q" | "8" | "16" | "32";

/** Bounding box of a rendered note element, used by overlay positioning. */
export interface NotePosition {
  x: number;
  y: number;
  w: number;
  h: number;
  selection: {
    partId: string;
    measureIndex: number;
    noteIndex: number;
    noteId: string;
  };
}

export interface Note {
  id: string;
  pitch: string; // "C4", "F#5"
  duration: DurationType;
  /** Pitch emitted when generated MusicXML was first loaded (harmony parts); not written to MusicXML. */
  originalGeneratedPitch?: string;
  /** True when this is a notated rest. */
  isRest?: boolean;
  dots?: number;
  tie?: "start" | "stop" | "continue";
  articulations?: string[];
  dynamics?: string;
}

export interface Measure {
  id: string;
  notes: Note[];
  timeSignature?: string;
  keySignature?: number;
}

export interface Part {
  id: string;
  name: string;
  clef: string;
  /** Instrument transposition in semitones to concert pitch (e.g. Bb clarinet = -2). */
  transposeSemitones?: number;
  measures: Measure[];
}

/** Chord symbol on RiffScore’s global quant timeline (16 quants per quarter). */
export interface ChordSymbolEntry {
  id: string;
  quant: number;
  symbol: string;
}

export interface EditableScore {
  parts: Part[];
  divisions: number;
  /** Playback tempo; defaults to 120 in RiffScore adapter when omitted. */
  bpm?: number;
  /** Harmony track (RiffScore chord track round-trip). */
  chords?: ChordSymbolEntry[];
}

/** Generate unique IDs for notes and measures */
let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}
