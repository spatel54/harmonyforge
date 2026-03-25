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
