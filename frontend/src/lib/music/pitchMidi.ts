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

const MIDI_STEPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

/** MIDI 0–127 → scientific pitch (`60` → `C4`). Accidentals spell as sharps. */
export function midiToPitchString(midi: number): string {
  const clamped = Math.max(0, Math.min(127, Math.round(midi)));
  const octave = Math.floor(clamped / 12) - 1;
  const pc = ((clamped % 12) + 12) % 12;
  return `${MIDI_STEPS[pc]}${octave}`;
}

export function transposePitchString(pitch: string, semitones: number): string {
  const midi = pitchStringToMidi(pitch);
  if (midi === null) return pitch;
  return midiToPitchString(midi + semitones);
}

/** `C#4` / `Bb3` → `C4` / `B3` — RiffScore stores accidentals off the pitch string. */
export function pitchLetterOctave(pitch: string): string {
  const m = pitch.match(/^([A-G])(?:#{1,2}|b{1,2})?(\d+)$/);
  if (!m) return pitch;
  return `${m[1]}${m[2]}`;
}
