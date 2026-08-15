/**
 * MuseScore-style tuplet ratios: actual notes in the time of normal.
 */
import type { DurationType, Note } from "./scoreTypes";

export type TupletRatio = { actual: number; normal: number };

export const TUPLET_RATIOS: Record<number, TupletRatio> = {
  3: { actual: 3, normal: 2 },
  5: { actual: 5, normal: 4 },
  6: { actual: 6, normal: 4 },
  7: { actual: 7, normal: 4 },
};

const DURATION_BEATS: Record<DurationType, number> = {
  w: 4,
  h: 2,
  q: 1,
  "8": 0.5,
  "16": 0.25,
  "32": 0.125,
};

function writtenBeats(note: Pick<Note, "duration" | "dots">): number {
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

export function getTupletRatio(tuplet: number | undefined): TupletRatio | null {
  if (!tuplet || tuplet <= 1) return null;
  return TUPLET_RATIOS[tuplet] ?? null;
}

/** Sounding beat length (what fills the measure / plays back). */
export function noteSoundingBeats(note: Note): number {
  const written = writtenBeats(note);
  const ratio = getTupletRatio(note.tuplet);
  if (!ratio) return written;
  return written * (ratio.normal / ratio.actual);
}

const DURATION_CHAIN: DurationType[] = ["w", "h", "q", "8", "16", "32"];

/** Written duration for inner notes of a tuplet group filling `slotBeats`. */
export function innerDurationForTupletSlot(
  slotBeats: number,
  actual: number,
): DurationType | null {
  const ratio = getTupletRatio(actual);
  if (!ratio) return null;
  const perNoteSounding = slotBeats / actual;
  for (const d of DURATION_CHAIN) {
    const written = writtenBeats({ id: "x", pitch: "C4", duration: d });
    const sounding = written * (ratio.normal / ratio.actual);
    if (Math.abs(sounding - perNoteSounding) < 1e-6) return d;
  }
  for (const d of DURATION_CHAIN) {
    const written = writtenBeats({ id: "x", pitch: "C4", duration: d });
    const sounding = written * (ratio.normal / ratio.actual);
    if (sounding <= perNoteSounding + 1e-6) return d;
  }
  return "32";
}
