/**
 * Format stored pitch strings (e.g. C4, F#5, Bb3) for learner overlays: letter + accidental only.
 */

const PITCH_RE = /^([A-G])(#{1,2}|bb|b)?(\d+)?$/;

function normalizeAccidental(raw: string): string {
  return raw.replace(/♯/g, "#").replace(/♭/g, "b");
}

export function formatLearnerLetterName(pitch: string): string {
  const trimmed = pitch.trim();
  if (!trimmed) return "";

  const m = trimmed.match(PITCH_RE);
  if (m) {
    const letter = m[1];
    const acc = normalizeAccidental(m[2] ?? "");
    return `${letter}${acc}`;
  }

  const letterAcc = trimmed.match(/^([A-Ga-g])(#{1,2}|bb|b|x|♯|♭)?/);
  if (letterAcc) {
    const letter = letterAcc[1].toUpperCase();
    let acc = normalizeAccidental(letterAcc[2] ?? "");
    if (acc === "x") acc = "##";
    return `${letter}${acc}`;
  }

  return "";
}
