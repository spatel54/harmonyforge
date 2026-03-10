/**
 * noteFactory.ts
 * Symbolic note generation for HarmonyForge Tactile Sandbox.
 * Output: VexFlow-compatible StaveNote descriptors (no audio synthesis).
 */

export type Duration = "w" | "h" | "q" | "8" | "16";

export interface SymbolicNote {
  /** VexFlow key format, e.g. "c/4" */
  key: string;
  duration: Duration;
  /** Optional: MIDI pitch for Tone.js playback */
  midi: number;
}

export interface Measure {
  notes: SymbolicNote[];
  /** e.g. "4/4" */
  timeSignature: string;
}

// ─── C Major scale, octave 4 ──────────────────────────────────────────────────
const C_MAJOR_SCALE: Array<{ key: string; midi: number }> = [
  { key: "c/4", midi: 60 },
  { key: "d/4", midi: 62 },
  { key: "e/4", midi: 64 },
  { key: "f/4", midi: 65 },
  { key: "g/4", midi: 67 },
  { key: "a/4", midi: 69 },
  { key: "b/4", midi: 71 },
  { key: "c/5", midi: 72 },
];

/**
 * Generates `measureCount` measures of random quarter notes drawn from
 * the provided scale. Deterministic when `seed` is supplied (LCG RNG).
 */
export function generateMeasures(
  measureCount = 2,
  beatsPerMeasure = 4,
  scale = C_MAJOR_SCALE,
  seed?: number
): Measure[] {
  let state = seed ?? Date.now();
  const lcg = (): number => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };

  return Array.from({ length: measureCount }, () => ({
    timeSignature: `${beatsPerMeasure}/4`,
    notes: Array.from({ length: beatsPerMeasure }, () => {
      const entry = scale[Math.floor(lcg() * scale.length)];
      return { key: entry.key, duration: "q" as Duration, midi: entry.midi };
    }),
  }));
}

/**
 * Converts SymbolicNote[] → plain VexFlow StaveNote constructor args.
 * Import `StaveNote` from "vexflow" to hydrate these.
 */
export function toVexFlowArgs(
  note: SymbolicNote
): { keys: string[]; duration: string } {
  return { keys: [note.key], duration: note.duration };
}
