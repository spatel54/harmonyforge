import type { Measure, Note } from "./scoreTypes";

export const ARTICULATION_GLYPHS: Record<string, string> = {
  "a.": "\u00B7",
  "a-": "\u2212",
  "a>": ">",
  "a^": "^",
  staccatissimo: "\u25BE",
  fermata: "\u{1D110}",
  slur: "\u2312",
  "breath-mark": "\u{1D112}",
  caesura: "\u2016",
};

/** Noto Music / Unicode Musical Symbols — not SMuFL PUA (that font is not bundled). */
export const ORNAMENT_GLYPHS: Record<string, string> = {
  trill: "\u{1D196}", // MUSICAL SYMBOL TR
  turn: "\u{1D197}", // MUSICAL SYMBOL TURN
  mordent: "\u{1D19D}", // short zigzag (closest bundled mordent)
  "inverted-mordent": "\u{1D19D}",
  "mordent-upper": "\u{1D19D}",
};

const DYNAMIC_LETTER: Record<string, string> = {
  p: "\u{1D18F}",
  m: "\u{1D190}",
  f: "\u{1D191}",
};

/** Engraved dynamic letters when the mark is p/m/f runs; otherwise keep the words. */
export function formatDynamicMark(dyn: string): string {
  const trimmed = dyn.trim();
  if (!trimmed) return trimmed;
  if (/^[pmf]+$/i.test(trimmed)) {
    return [...trimmed.toLowerCase()].map((ch) => DYNAMIC_LETTER[ch] ?? ch).join("");
  }
  return trimmed;
}

const ENGRAVED_LINE_KINDS = new Set(["slur", "cresc-hairpin", "decresc-hairpin", "8va", "8vb"]);

export const REPEAT_MARK_GLYPH: Record<string, string> = {
  segno: "\u{1D10B}",
  coda: "\u{1D10C}",
};

export type MeasureOverlayMark = {
  text: string;
  role: "glyph" | "words" | "rehearsal";
};

const REPEAT_MARK_DISPLAY: Record<string, MeasureOverlayMark> = {
  segno: { text: "\u{1D10B}", role: "glyph" },
  coda: { text: "\u{1D10C}", role: "glyph" },
  dc: { text: "D.C.", role: "words" },
  ds: { text: "D.S.", role: "words" },
  fine: { text: "Fine", role: "words" },
};

export function noteNotationBadges(note: Note): { above: string[]; below: string[] } {
  const above: string[] = [];
  const below: string[] = [];

  if (note.chordSymbol) above.push(note.chordSymbol);
  if (note.words) above.push(note.words);

  if (note.ornament) {
    const ob = ORNAMENT_GLYPHS[note.ornament] ?? note.ornament.slice(0, 3);
    above.push(ob);
  }

  if (note.dynamics) above.push(formatDynamicMark(note.dynamics));

  if (note.tuplet && note.tuplet > 1) above.push(String(note.tuplet));

  if (note.lineStart && !ENGRAVED_LINE_KINDS.has(note.lineStart)) {
    above.push(note.lineStart);
  }

  if (note.lyric) below.push(note.lyric);

  return { above, below };
}

export function measureOverlayMarks(measure: Measure): MeasureOverlayMark[] {
  const marks: MeasureOverlayMark[] = [];
  if (measure.tempoText) marks.push({ text: measure.tempoText, role: "words" });
  if (measure.rehearsalMark) marks.push({ text: measure.rehearsalMark, role: "rehearsal" });
  if (measure.repeatMark) {
    const mapped = REPEAT_MARK_DISPLAY[measure.repeatMark];
    if (mapped) marks.push(mapped);
  }
  return marks;
}

export function measureNotationBadges(measure: Measure): string[] {
  return measureOverlayMarks(measure).map((m) =>
    m.role === "rehearsal" ? `[${m.text}]` : m.text,
  );
}

export function formatBadgeRow(badges: string[]): string | null {
  const trimmed = badges.map((b) => b.trim()).filter(Boolean);
  if (trimmed.length === 0) return null;
  return trimmed.join(" ");
}
