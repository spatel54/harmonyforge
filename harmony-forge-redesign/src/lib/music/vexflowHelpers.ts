/**
 * Helpers for VexFlow rendering.
 * Converts our Note format to VexFlow format.
 */

import type { Note } from "./scoreTypes";

/** Duration type → beats (quarter = 1) */
const DURATION_BEATS: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  "8": 0.5,
  "16": 0.25,
  "32": 0.125,
};

/** Build rest notation for N beats: "B4/w/r" or "B4/h/r, B4/q/r" etc. */
export function beatsToRestNotation(beats: number): string {
  if (beats <= 0) return "";
  const parts: string[] = [];
  
  // Round initial beats to 3 decimal places to avoid float drift
  let remaining = Math.round(beats * 1000) / 1000;
  const durs: [number, string][] = [[4, "w"], [2, "h"], [1, "q"], [0.5, "8"], [0.25, "16"], [0.125, "32"]];
  
  for (const [b, sym] of durs) {
    while (remaining >= b - 0.001) {
      parts.push(`B4/${sym}/r`);
      // Re-round after subtraction to prevent float drift
      remaining = Math.round((remaining - b) * 1000) / 1000;
    }
  }
  return parts.join(", ");
}

/** Total beats for a list of notes (used to set Voice time signature) */
export function notesToBeats(notes: Note[]): number {
  let total = 0;
  for (const n of notes) {
    let beats = DURATION_BEATS[n.duration] ?? 1;
    if (n.dots) beats *= 1.5;
    total += beats;
  }
  return total;
}

/** "C4", "F#5" → "C4", "F#5" (VexFlow EasyScore format: pitch + / + duration) */
export function pitchToVexFlowKey(pitch: string): string {
  const match = pitch.match(/^([A-Ga-g])(#{0,2}|b{0,2})?(\d+)$/);
  if (!match) return "C4";
  const [, step, acc = "", octave] = match;
  const accMap: Record<string, string> = {
    "#": "#",
    "##": "##",
    b: "b",
    bb: "bb",
  };
  const accStr = accMap[acc] ?? "";
  return `${step.toUpperCase()}${accStr}${octave}`;
}

/** Build EasyScore notation string for a note: "C#5/q" or "C4/q." for dotted */
export function noteToEasyScoreNotation(note: Note): string {
  const key = pitchToVexFlowKey(note.pitch);
  const dots = note.dots ? ".".repeat(note.dots) : "";
  return `${key}/${note.duration}${dots}`;
}
