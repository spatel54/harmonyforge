/**
 * Format stored pitch strings (e.g. C4, F#5, Bb3) for learner overlays: letter + accidental only.
 */

const PITCH_RE = /^([A-G])(#|b)?(\d+)$/;

export function formatLearnerLetterName(pitch: string): string {
  const trimmed = pitch.trim();
  if (!trimmed) return "";

  const m = trimmed.match(PITCH_RE);
  if (m) {
    const letter = m[1];
    const acc = m[2] ?? "";
    return `${letter}${acc}`;
  }

  const letterAcc = trimmed.match(/^([A-Ga-g])([#b♯♭]?)/);
  if (letterAcc) {
    const letter = letterAcc[1].toUpperCase();
    const acc = (letterAcc[2] ?? "").replace(/♯/g, "#").replace(/♭/g, "b");
    return `${letter}${acc}`;
  }

  return "";
}
