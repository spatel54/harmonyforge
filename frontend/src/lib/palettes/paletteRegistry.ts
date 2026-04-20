/**
 * Palette registry — MuseScore/Noteflight-style grouped symbol catalog.
 *
 * Each palette item maps to a `handleToolSelect` id in the sandbox page so
 * clicks/drags share the same code path as keyboard/toolbar actions.
 *
 * Source parity:
 *   - MuseScore handbook § "Palettes" (Advanced workspace).
 *   - Noteflight keyboard reference (articulations/dynamics/text).
 */

export interface PaletteItem {
  /** Stable id; used as React key + toolId mapping target. */
  id: string;
  /** Short label rendered on the button. */
  label: string;
  /** Longer title / tooltip (keyboard shortcut noted parenthetically). */
  title?: string;
  /** Glyph / unicode character to render when no icon is provided. */
  glyph?: string;
  /** Tool id forwarded to `handleToolSelect` on click. */
  toolId: string;
  /** True when the action only makes sense with a current selection. */
  requiresSelection?: boolean;
}

export interface PaletteSection {
  id: string;
  label: string;
  description: string;
  items: PaletteItem[];
}

export const PALETTE_SECTIONS: PaletteSection[] = [
  {
    id: "note-entry",
    label: "Note entry",
    description: "Same actions as the toolbar — pick a duration, then click the staff or type A–G",
    items: [
      { id: "dur-whole", label: "Whole", glyph: "𝅝", toolId: "duration-whole", title: "Whole note (6)" },
      { id: "dur-half", label: "Half", glyph: "𝅗𝅥", toolId: "duration-half", title: "Half note (5)" },
      { id: "dur-quarter", label: "Quarter", glyph: "♩", toolId: "duration-quarter", title: "Quarter note (4)" },
      { id: "dur-eighth", label: "Eighth", glyph: "♪", toolId: "duration-eighth", title: "Eighth note (3)" },
      { id: "dur-16th", label: "16th", glyph: "𝅘𝅥𝅮", toolId: "duration-16th", title: "16th note (2)" },
      { id: "dur-32nd", label: "32nd", glyph: "𝅘𝅥𝅯", toolId: "duration-32nd", title: "32nd note (1)" },
      { id: "dur-dot", label: "Dot", glyph: "‥", toolId: "duration-dotted", title: "Toggle dotted rhythm (selection)", requiresSelection: true },
      { id: "dur-tie", label: "Tie", glyph: "⌒", toolId: "duration-tie", title: "Tie (,) — needs selection", requiresSelection: true },
      { id: "dur-rest", label: "Rest", glyph: "𝄽", toolId: "insert-rest", title: "Insert rest (0) at cursor" },
    ],
  },
  {
    id: "clefs",
    label: "Clefs",
    description: "Change the clef of the selected part",
    items: [
      { id: "clef-treble", label: "Treble", glyph: "𝄞", toolId: "measure-clef-treble" },
      { id: "clef-bass", label: "Bass", glyph: "𝄢", toolId: "measure-clef-bass" },
      { id: "clef-alto", label: "Alto", glyph: "𝄡", toolId: "measure-clef-alto" },
      { id: "clef-tenor", label: "Tenor", glyph: "𝄡", toolId: "measure-clef-tenor" },
    ],
  },
  {
    id: "key-signatures",
    label: "Key Signatures",
    description: "Set the key signature of the focused measure",
    items: [
      { id: "key-0", label: "C / a", glyph: "♮", toolId: "measure-change-key-0" },
      { id: "key-1", label: "G / e", glyph: "♯", toolId: "measure-change-key-1" },
      { id: "key-2", label: "D / b", glyph: "♯♯", toolId: "measure-change-key-2" },
      { id: "key-3", label: "A / f♯", glyph: "♯×3", toolId: "measure-change-key-3" },
      { id: "key-4", label: "E / c♯", glyph: "♯×4", toolId: "measure-change-key-4" },
      { id: "key-5", label: "B / g♯", glyph: "♯×5", toolId: "measure-change-key-5" },
      { id: "key-m1", label: "F / d", glyph: "♭", toolId: "measure-change-key--1" },
      { id: "key-m2", label: "B♭ / g", glyph: "♭♭", toolId: "measure-change-key--2" },
      { id: "key-m3", label: "E♭ / c", glyph: "♭×3", toolId: "measure-change-key--3" },
      { id: "key-m4", label: "A♭ / f", glyph: "♭×4", toolId: "measure-change-key--4" },
      { id: "key-m5", label: "D♭ / b♭", glyph: "♭×5", toolId: "measure-change-key--5" },
      { id: "key-prompt", label: "Custom…", glyph: "?", toolId: "measure-change-key" },
    ],
  },
  {
    id: "time-signatures",
    label: "Time Signatures",
    description: "Set the time signature of the focused measure",
    items: [
      { id: "time-4-4", label: "4/4", toolId: "measure-change-time-4-4" },
      { id: "time-3-4", label: "3/4", toolId: "measure-change-time-3-4" },
      { id: "time-2-4", label: "2/4", toolId: "measure-change-time-2-4" },
      { id: "time-6-8", label: "6/8", toolId: "measure-change-time-6-8" },
      { id: "time-12-8", label: "12/8", toolId: "measure-change-time-12-8" },
      { id: "time-5-4", label: "5/4", toolId: "measure-change-time-5-4" },
      { id: "time-7-8", label: "7/8", toolId: "measure-change-time-7-8" },
      { id: "time-prompt", label: "Custom…", glyph: "?", toolId: "measure-change-time" },
    ],
  },
  {
    id: "barlines",
    label: "Barlines",
    description: "Change the barline at the focused measure",
    items: [
      { id: "barline-normal", label: "Normal", glyph: "|", toolId: "measure-barline-normal" },
      { id: "barline-double", label: "Double", glyph: "‖", toolId: "measure-barline-double" },
      { id: "barline-final", label: "Final", glyph: "𝄂", toolId: "measure-barline-final" },
      { id: "barline-start-repeat", label: "Start ⫶|", glyph: "𝄆", toolId: "measure-barline-start-repeat" },
      { id: "barline-end-repeat", label: "End |⫶", glyph: "𝄇", toolId: "measure-barline-end-repeat" },
      { id: "barline-dashed", label: "Dashed", glyph: "┆", toolId: "measure-barline-dashed" },
      { id: "barline-tick", label: "Tick", glyph: "╵", toolId: "measure-barline-tick" },
    ],
  },
  {
    id: "accidentals",
    label: "Accidentals",
    description: "Apply accidentals to the selection",
    items: [
      { id: "acc-sharp", label: "Sharp", glyph: "♯", toolId: "pitch-accidental-sharp", requiresSelection: true },
      { id: "acc-flat", label: "Flat", glyph: "♭", toolId: "pitch-accidental-flat", requiresSelection: true },
      { id: "acc-natural", label: "Natural", glyph: "♮", toolId: "pitch-accidental-natural", requiresSelection: true },
      { id: "acc-dsharp", label: "Double♯", glyph: "𝄪", toolId: "pitch-accidental-dsharp", requiresSelection: true },
      { id: "acc-dflat", label: "Double♭", glyph: "𝄫", toolId: "pitch-accidental-dflat", requiresSelection: true },
    ],
  },
  {
    id: "articulations",
    label: "Articulations & Ornaments",
    description: "Attach articulations or ornaments to the selected notes",
    items: [
      { id: "artic-staccato", label: "Staccato", glyph: ".", toolId: "artic-staccato", requiresSelection: true },
      { id: "artic-tenuto", label: "Tenuto", glyph: "-", toolId: "artic-tenuto", requiresSelection: true },
      { id: "artic-accent", label: "Accent", glyph: ">", toolId: "artic-accent", requiresSelection: true },
      { id: "artic-strong-accent", label: "Marcato", glyph: "^", toolId: "artic-strong-accent", requiresSelection: true },
      { id: "artic-staccatissimo", label: "Staccatiss.", glyph: "▴", toolId: "artic-staccatissimo", requiresSelection: true },
      { id: "artic-fermata", label: "Fermata", glyph: "𝄐", toolId: "artic-fermata", requiresSelection: true },
      { id: "orn-trill", label: "Trill", glyph: "𝆖", toolId: "ornament-trill", requiresSelection: true },
      { id: "orn-turn", label: "Turn", glyph: "𝆗", toolId: "ornament-turn", requiresSelection: true },
      { id: "orn-mordent", label: "Mordent", glyph: "𝆙", toolId: "ornament-mordent", requiresSelection: true },
      { id: "orn-mordent-upper", label: "Upper Mordent", glyph: "𝆙", toolId: "ornament-mordent-upper", requiresSelection: true },
    ],
  },
  {
    id: "dynamics",
    label: "Dynamics",
    description: "Attach a dynamic marking to the selection",
    items: [
      { id: "dyn-ppp", label: "ppp", toolId: "dynamics-ppp", requiresSelection: true },
      { id: "dyn-pp", label: "pp", toolId: "dynamics-pp", requiresSelection: true },
      { id: "dyn-p", label: "p", toolId: "dynamics-piano", requiresSelection: true },
      { id: "dyn-mp", label: "mp", toolId: "dynamics-mp", requiresSelection: true },
      { id: "dyn-mf", label: "mf", toolId: "dynamics-mf", requiresSelection: true },
      { id: "dyn-f", label: "f", toolId: "dynamics-f", requiresSelection: true },
      { id: "dyn-ff", label: "ff", toolId: "dynamics-ff", requiresSelection: true },
      { id: "dyn-fff", label: "fff", toolId: "dynamics-fff", requiresSelection: true },
      { id: "dyn-sfz", label: "sfz", toolId: "dynamics-sfz", requiresSelection: true },
      { id: "dyn-fp", label: "fp", toolId: "dynamics-fp", requiresSelection: true },
      { id: "dyn-cresc", label: "cresc.", toolId: "dynamics-cresc", requiresSelection: true },
      { id: "dyn-dim", label: "dim.", toolId: "dynamics-decresc", requiresSelection: true },
    ],
  },
  {
    id: "lines",
    label: "Lines",
    description: "Spanners anchored at the selection",
    items: [
      { id: "line-slur", label: "Slur", glyph: "⌒", toolId: "line-slur", requiresSelection: true },
      { id: "line-tie", label: "Tie", glyph: "⌢", toolId: "duration-tie", requiresSelection: true },
      { id: "line-cresc", label: "Cresc ＜", toolId: "line-cresc-hairpin", requiresSelection: true },
      { id: "line-decresc", label: "Dim ＞", toolId: "line-decresc-hairpin", requiresSelection: true },
      { id: "line-8va", label: "8va", toolId: "line-8va", requiresSelection: true },
      { id: "line-8vb", label: "8vb", toolId: "line-8vb", requiresSelection: true },
    ],
  },
  {
    id: "repeats",
    label: "Repeats & Jumps",
    description: "Navigation markers on the focused measure",
    items: [
      { id: "rep-segno", label: "Segno", glyph: "𝄋", toolId: "measure-repeat-segno" },
      { id: "rep-coda", label: "Coda", glyph: "𝄌", toolId: "measure-repeat-coda" },
      { id: "rep-dc", label: "D.C.", toolId: "measure-repeat-dc" },
      { id: "rep-ds", label: "D.S.", toolId: "measure-repeat-ds" },
      { id: "rep-fine", label: "Fine", toolId: "measure-repeat-fine" },
      { id: "rep-clear", label: "Clear", toolId: "measure-repeat-clear" },
    ],
  },
  {
    id: "tempo",
    label: "Tempo",
    description: "Tempo markings and BPM",
    items: [
      { id: "tempo-largo", label: "Largo ♩ = 40", toolId: "tempo-preset-largo" },
      { id: "tempo-adagio", label: "Adagio ♩ = 66", toolId: "tempo-preset-adagio" },
      { id: "tempo-andante", label: "Andante ♩ = 76", toolId: "tempo-preset-andante" },
      { id: "tempo-moderato", label: "Moderato ♩ = 108", toolId: "tempo-preset-moderato" },
      { id: "tempo-allegro", label: "Allegro ♩ = 132", toolId: "tempo-preset-allegro" },
      { id: "tempo-presto", label: "Presto ♩ = 168", toolId: "tempo-preset-presto" },
      { id: "tempo-prompt", label: "Custom…", glyph: "?", toolId: "tempo-preset-custom" },
    ],
  },
  {
    id: "text",
    label: "Text",
    description: "Lyrics, chord symbols, and annotation text",
    items: [
      { id: "text-lyrics", label: "Lyrics", toolId: "text-lyrics", requiresSelection: true },
      { id: "text-chord", label: "Chord symbol", toolId: "text-chord-symbol", requiresSelection: true },
      { id: "text-expression", label: "Expression", toolId: "text-expression", requiresSelection: true },
      { id: "text-performance", label: "Performance", toolId: "text-performance", requiresSelection: true },
      { id: "text-rehearsal", label: "Rehearsal mark", toolId: "measure-rehearsal-mark" },
    ],
  },
  {
    id: "tuplets",
    label: "Tuplets",
    description: "Group the selected notes as a tuplet",
    items: [
      { id: "tup-3", label: "Triplet", glyph: "³", toolId: "tuplet-3", requiresSelection: true },
      { id: "tup-5", label: "Quintuplet", glyph: "⁵", toolId: "tuplet-5", requiresSelection: true },
      { id: "tup-6", label: "Sextuplet", glyph: "⁶", toolId: "tuplet-6", requiresSelection: true },
      { id: "tup-7", label: "Septuplet", glyph: "⁷", toolId: "tuplet-7", requiresSelection: true },
      { id: "tup-clear", label: "Clear", toolId: "tuplet-clear", requiresSelection: true },
    ],
  },
  {
    id: "breaths",
    label: "Breaths & Pauses",
    description: "Phrasing marks attached to the selection",
    items: [
      { id: "breath-mark", label: "Breath", glyph: "𝄓", toolId: "breath-mark", requiresSelection: true },
      { id: "caesura", label: "Caesura", glyph: "‖", toolId: "breath-caesura", requiresSelection: true },
    ],
  },
];

export function findPaletteItem(toolId: string): PaletteItem | null {
  for (const section of PALETTE_SECTIONS) {
    const match = section.items.find((item) => item.toolId === toolId);
    if (match) return match;
  }
  return null;
}
