import type { Measure, Note } from "./scoreTypes";

const ARTICULATION_BADGES: Record<string, string> = {
  "a.": "·",
  "a-": "−",
  "a>": ">",
  "a^": "^",
  staccatissimo: "▾",
  fermata: "𝄐",
  slur: "⌒",
  "breath-mark": "′",
  caesura: "∥",
};

const ORNAMENT_BADGES: Record<string, string> = {
  trill: "tr",
  mordent: "m",
  "inverted-mordent": "M",
  turn: "∾",
};

const LINE_BADGES: Record<string, string> = {
  slur: "⌒",
  "cresc-hairpin": "<",
  "decresc-hairpin": ">",
  "8va": "8va",
  "8vb": "8vb",
};

/** Compact badges rendered above/below noteheads in the sandbox overlay. */
export function noteNotationBadges(note: Note): { above: string[]; below: string[] } {
  if (note.isRest) return { above: [], below: [] };

  const above: string[] = [];
  const below: string[] = [];

  if (note.chordSymbol) above.push(note.chordSymbol);
  if (note.words) above.push(note.words);

  for (const artic of note.articulations ?? []) {
    const badge = ARTICULATION_BADGES[artic];
    if (badge) above.push(badge);
  }

  if (note.ornament) {
    const ob = ORNAMENT_BADGES[note.ornament] ?? note.ornament.slice(0, 3);
    above.push(ob);
  }

  if (note.dynamics) {
    below.push(note.dynamics);
  }

  if (note.tuplet && note.tuplet > 1) {
    above.push(String(note.tuplet));
  }

  if (note.lineStart) {
    const lb = LINE_BADGES[note.lineStart] ?? note.lineStart;
    above.push(lb);
  }

  if (note.lyric) {
    below.push(note.lyric);
  }

  return { above, below };
}

export function measureNotationBadges(measure: Measure): string[] {
  const badges: string[] = [];
  if (measure.tempoText) badges.push(measure.tempoText);
  if (measure.rehearsalMark) badges.push(`[${measure.rehearsalMark}]`);
  if (measure.repeatMark) badges.push(measure.repeatMark.toUpperCase());
  if (measure.barline && measure.barline !== "normal") {
    badges.push(measure.barline);
  }
  return badges;
}

export function formatBadgeRow(badges: string[]): string | null {
  const trimmed = badges.map((b) => b.trim()).filter(Boolean);
  if (trimmed.length === 0) return null;
  return trimmed.join(" ");
}
