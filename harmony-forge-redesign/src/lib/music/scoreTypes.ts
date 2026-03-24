/**
 * Editable score model for Tactile Sandbox.
 * Used by MusicXML parser and VexFlow renderer.
 */

export type DurationType = "w" | "h" | "q" | "8" | "16" | "32";

export interface Note {
  id: string;
  pitch: string; // "C4", "F#5"
  duration: DurationType;
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

export interface EditableScore {
  parts: Part[];
  divisions: number;
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
