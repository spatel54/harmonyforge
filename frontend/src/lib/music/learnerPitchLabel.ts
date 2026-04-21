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

  // Fallback: strip trailing digits (octave) if present
  const stripped = trimmed.replace(/\d+$/, "");
  if (/^[A-G][#b]?$/.test(stripped)) return stripped;

  return trimmed;
}
