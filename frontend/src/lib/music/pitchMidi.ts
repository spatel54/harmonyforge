const STEP_MAP: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Scientific pitch like C4, F#5, Bb3 → MIDI note 0–127, or null if invalid. */
export function pitchStringToMidi(pitch: string): number | null {
  const m = pitch.match(/^([A-G])(#{1,2}|b{1,2})?(\d+)$/);
  if (!m) return null;
  const step = m[1] ?? "C";
  const acc = m[2] ?? "";
  const octave = Number.parseInt(m[3] ?? "4", 10);
  if (!Number.isFinite(octave)) return null;
  let pc = STEP_MAP[step];
  if (pc === undefined) return null;
  if (acc === "#") pc += 1;
  else if (acc === "##") pc += 2;
  else if (acc === "b") pc -= 1;
  else if (acc === "bb") pc -= 2;
  const midi = 12 * (octave + 1) + ((pc % 12) + 12) % 12;
  if (midi < 0 || midi > 127) return null;
  return midi;
}
