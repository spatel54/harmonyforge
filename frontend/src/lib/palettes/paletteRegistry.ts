/**
 * Palette registry — MuseScore/Noteflight-style grouped symbol catalog.
 *
 * Each palette item maps to a `handleToolSelect` id in the sandbox page so
 * clicks/drags share the same code path as keyboard/toolbar actions.
 */

export interface PaletteItem {
  /** Stable id; used as React key + toolId mapping target. */
  id: string;
  /** Short label rendered on the button. */
  label: string;
  /** Descriptive tooltip shown on hover. */
  title: string;
  /** Optional keyboard shortcut shown in the tooltip. */
  shortcut?: string;
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
      { id: "dur-whole", label: "Whole", glyph: "𝅝", toolId: "duration-whole", title: "Set note entry to whole note duration", shortcut: "6" },
      { id: "dur-half", label: "Half", glyph: "𝅗𝅥", toolId: "duration-half", title: "Set note entry to half note duration", shortcut: "5" },
      { id: "dur-quarter", label: "Quarter", glyph: "♩", toolId: "duration-quarter", title: "Set note entry to quarter note duration", shortcut: "4" },
      { id: "dur-eighth", label: "Eighth", glyph: "♪", toolId: "duration-eighth", title: "Set note entry to eighth note duration", shortcut: "3" },
      { id: "dur-16th", label: "16th", glyph: "𝅘𝅥𝅮", toolId: "duration-16th", title: "Set note entry to sixteenth note duration", shortcut: "2" },
      { id: "dur-32nd", label: "32nd", glyph: "𝅘𝅥𝅯", toolId: "duration-32nd", title: "Set note entry to thirty-second note duration", shortcut: "1" },
      { id: "dur-dot", label: "Dot", glyph: "‥", toolId: "duration-dotted", title: "Toggle dotted rhythm on selected notes, or arm dotted note entry", shortcut: "." },
      { id: "dur-tie", label: "Tie", glyph: "⌒", toolId: "duration-tie", title: "Tie selected note to the next same-pitch note", shortcut: ",", requiresSelection: true },
      { id: "dur-rest", label: "Rest", glyph: "𝄽", toolId: "insert-rest", title: "Insert a rest at the cursor using the active duration", shortcut: "0" },
      { id: "mode-repitch", label: "Repitch", glyph: "↺", toolId: "mode-repitch", title: "Repitch mode — type A–G to change pitch without changing duration; hover rests to preview", shortcut: "R" },
    ],
  },
  {
    id: "clefs",
    label: "Clefs",
    description: "Change the clef of the selected part",
    items: [
      { id: "clef-treble", label: "Treble", glyph: "𝄞", toolId: "measure-clef-treble", title: "Set the selected part to treble (G) clef" },
      { id: "clef-bass", label: "Bass", glyph: "𝄢", toolId: "measure-clef-bass", title: "Set the selected part to bass (F) clef" },
      { id: "clef-alto", label: "Alto", glyph: "𝄡", toolId: "measure-clef-alto", title: "Set the selected part to alto (C) clef on the middle line" },
      { id: "clef-tenor", label: "Tenor", glyph: "𝄡₄", toolId: "measure-clef-tenor", title: "Set the selected part to tenor (C) clef on the fourth line" },
    ],
  },
  {
    id: "key-signatures",
    label: "Key Signatures",
    description: "Set the key signature from the focused measure onward",
    items: [
      { id: "key-0", label: "C / a", glyph: "♮", toolId: "measure-change-key-0", title: "Key signature: C major / A minor (no sharps or flats)" },
      { id: "key-1", label: "G / e", glyph: "♯", toolId: "measure-change-key-1", title: "Key signature: G major / E minor (1 sharp)" },
      { id: "key-2", label: "D / b", glyph: "♯♯", toolId: "measure-change-key-2", title: "Key signature: D major / B minor (2 sharps)" },
      { id: "key-3", label: "A / f♯", glyph: "♯×3", toolId: "measure-change-key-3", title: "Key signature: A major / F♯ minor (3 sharps)" },
      { id: "key-4", label: "E / c♯", glyph: "♯×4", toolId: "measure-change-key-4", title: "Key signature: E major / C♯ minor (4 sharps)" },
      { id: "key-5", label: "B / g♯", glyph: "♯×5", toolId: "measure-change-key-5", title: "Key signature: B major / G♯ minor (5 sharps)" },
      { id: "key-m1", label: "F / d", glyph: "♭", toolId: "measure-change-key--1", title: "Key signature: F major / D minor (1 flat)" },
      { id: "key-m2", label: "B♭ / g", glyph: "♭♭", toolId: "measure-change-key--2", title: "Key signature: B♭ major / G minor (2 flats)" },
      { id: "key-m3", label: "E♭ / c", glyph: "♭×3", toolId: "measure-change-key--3", title: "Key signature: E♭ major / C minor (3 flats)" },
      { id: "key-m4", label: "A♭ / f", glyph: "♭×4", toolId: "measure-change-key--4", title: "Key signature: A♭ major / F minor (4 flats)" },
      { id: "key-m5", label: "D♭ / b♭", glyph: "♭×5", toolId: "measure-change-key--5", title: "Key signature: D♭ major / B♭ minor (5 flats)" },
      { id: "key-prompt", label: "Custom…", glyph: "?", toolId: "measure-change-key", title: "Enter a custom key signature (fifths from −7 to +7)" },
    ],
  },
  {
    id: "time-signatures",
    label: "Time Signatures",
    description: "Set the time signature from the focused measure onward",
    items: [
      { id: "time-4-4", label: "4/4", toolId: "measure-change-time-4-4", title: "Set time signature to 4/4 (common time)" },
      { id: "time-3-4", label: "3/4", toolId: "measure-change-time-3-4", title: "Set time signature to 3/4 (waltz)" },
      { id: "time-2-4", label: "2/4", toolId: "measure-change-time-2-4", title: "Set time signature to 2/4" },
      { id: "time-6-8", label: "6/8", toolId: "measure-change-time-6-8", title: "Set time signature to 6/8 (compound duple)" },
      { id: "time-12-8", label: "12/8", toolId: "measure-change-time-12-8", title: "Set time signature to 12/8 (compound quadruple)" },
      { id: "time-5-4", label: "5/4", toolId: "measure-change-time-5-4", title: "Set time signature to 5/4" },
      { id: "time-7-8", label: "7/8", toolId: "measure-change-time-7-8", title: "Set time signature to 7/8" },
      { id: "time-prompt", label: "Custom…", glyph: "?", toolId: "measure-change-time", title: "Enter a custom time signature (e.g. 5/8)" },
    ],
  },
  {
    id: "barlines",
    label: "Barlines",
    description: "Change the barline at the focused measure",
    items: [
      { id: "barline-normal", label: "Normal", glyph: "|", toolId: "measure-barline-normal", title: "Single barline at end of measure" },
      { id: "barline-double", label: "Double", glyph: "‖", toolId: "measure-barline-double", title: "Double thin barline" },
      { id: "barline-final", label: "Final", glyph: "𝄂", toolId: "measure-barline-final", title: "Final barline (thin + heavy)" },
      { id: "barline-start-repeat", label: "Start ⫶|", glyph: "𝄆", toolId: "measure-barline-start-repeat", title: "Start repeat barline" },
      { id: "barline-end-repeat", label: "End |⫶", glyph: "𝄇", toolId: "measure-barline-end-repeat", title: "End repeat barline" },
      { id: "barline-dashed", label: "Dashed", glyph: "┆", toolId: "measure-barline-dashed", title: "Dashed barline (section break)" },
      { id: "barline-tick", label: "Tick", glyph: "╵", toolId: "measure-barline-tick", title: "Tick barline (short)" },
      { id: "meas-add-after", label: "Add bar", glyph: "+", toolId: "measure-insert-after", title: "Insert an empty measure after the focused bar" },
      { id: "meas-add-before", label: "Bar before", glyph: "↥", toolId: "measure-insert-before", title: "Insert an empty measure before the focused bar" },
      { id: "meas-delete", label: "Delete bar", glyph: "✕", toolId: "measure-delete", title: "Delete the focused measure" },
    ],
  },
  {
    id: "accidentals",
    label: "Accidentals",
    description: "Apply accidentals to the selection",
    items: [
      { id: "acc-sharp", label: "Sharp", glyph: "♯", toolId: "pitch-accidental-sharp", title: "Raise selected notes by a semitone (sharp)", requiresSelection: true },
      { id: "acc-flat", label: "Flat", glyph: "♭", toolId: "pitch-accidental-flat", title: "Lower selected notes by a semitone (flat)", requiresSelection: true },
      { id: "acc-natural", label: "Natural", glyph: "♮", toolId: "pitch-accidental-natural", title: "Cancel accidentals — natural pitch spelling", requiresSelection: true },
      { id: "acc-dsharp", label: "Double♯", glyph: "𝄪", toolId: "pitch-accidental-dsharp", title: "Raise selected notes by two semitones (double sharp)", requiresSelection: true },
      { id: "acc-dflat", label: "Double♭", glyph: "𝄫", toolId: "pitch-accidental-dflat", title: "Lower selected notes by two semitones (double flat)", requiresSelection: true },
    ],
  },
  {
    id: "articulations",
    label: "Articulations & Ornaments",
    description: "Attach articulations or ornaments to the selected notes",
    items: [
      { id: "artic-staccato", label: "Staccato", glyph: ".", toolId: "artic-staccato", title: "Short, detached articulation (staccato dot)", requiresSelection: true },
      { id: "artic-tenuto", label: "Tenuto", glyph: "-", toolId: "artic-tenuto", title: "Held full value articulation (tenuto line)", requiresSelection: true },
      { id: "artic-accent", label: "Accent", glyph: ">", toolId: "artic-accent", title: "Emphasized attack (accent)", requiresSelection: true },
      { id: "artic-strong-accent", label: "Marcato", glyph: "^", toolId: "artic-strong-accent", title: "Strong accent / marcato wedge", requiresSelection: true },
      { id: "artic-staccatissimo", label: "Staccatiss.", glyph: "▴", toolId: "artic-staccatissimo", title: "Very short, detached (staccatissimo)", requiresSelection: true },
      { id: "artic-fermata", label: "Fermata", glyph: "𝄐", toolId: "artic-fermata", title: "Hold the note longer than written (fermata)", requiresSelection: true },
      { id: "orn-trill", label: "Trill", glyph: "\u{1D196}", toolId: "ornament-trill", title: "Rapid alternation ornament (trill)", requiresSelection: true },
      { id: "orn-turn", label: "Turn", glyph: "\u{1D197}", toolId: "ornament-turn", title: "Ornamental turn figure", requiresSelection: true },
      { id: "orn-mordent", label: "Mordent", glyph: "\u{1D19D}", toolId: "ornament-mordent", title: "Lower mordent (main note → lower neighbor → main)", requiresSelection: true },
      { id: "orn-mordent-upper", label: "Upper Mordent", glyph: "\u{1D19D}", toolId: "ornament-mordent-upper", title: "Upper / inverted mordent (main \u2192 upper neighbor \u2192 main)", requiresSelection: true },
    ],
  },
  {
    id: "dynamics",
    label: "Dynamics",
    description: "Attach a dynamic marking to the selection",
    items: [
      { id: "dyn-ppp", label: "ppp", toolId: "dynamics-ppp", title: "Pianississimo — extremely soft", requiresSelection: true },
      { id: "dyn-pp", label: "pp", toolId: "dynamics-pp", title: "Pianissimo — very soft", requiresSelection: true },
      { id: "dyn-p", label: "p", toolId: "dynamics-piano", title: "Piano — soft", requiresSelection: true },
      { id: "dyn-mp", label: "mp", toolId: "dynamics-mp", title: "Mezzo-piano — moderately soft", requiresSelection: true },
      { id: "dyn-mf", label: "mf", toolId: "dynamics-mf", title: "Mezzo-forte — moderately loud", requiresSelection: true },
      { id: "dyn-f", label: "f", toolId: "dynamics-f", title: "Forte — loud", requiresSelection: true },
      { id: "dyn-ff", label: "ff", toolId: "dynamics-ff", title: "Fortissimo — very loud", requiresSelection: true },
      { id: "dyn-fff", label: "fff", toolId: "dynamics-fff", title: "Fortississimo — extremely loud", requiresSelection: true },
      { id: "dyn-sfz", label: "sfz", toolId: "dynamics-sfz", title: "Sforzando — sudden strong accent", requiresSelection: true },
      { id: "dyn-fp", label: "fp", toolId: "dynamics-fp", title: "Forte-piano — loud then immediately soft", requiresSelection: true },
      { id: "dyn-cresc", label: "cresc.", toolId: "dynamics-cresc", title: "Add crescendo text (gradually louder)", requiresSelection: true },
      { id: "dyn-dim", label: "dim.", toolId: "dynamics-decresc", title: "Add diminuendo text (gradually softer)", requiresSelection: true },
    ],
  },
  {
    id: "lines",
    label: "Lines",
    description: "Spanners anchored at the selection",
    items: [
      { id: "line-slur", label: "Slur", glyph: "⌒", toolId: "line-slur", title: "Slur over selected notes (legato phrasing)", requiresSelection: true },
      { id: "line-tie", label: "Tie", glyph: "⌢", toolId: "duration-tie", title: "Tie selected note to the next same-pitch note", shortcut: ",", requiresSelection: true },
      { id: "line-cresc", label: "Cresc ＜", toolId: "line-cresc-hairpin", title: "Crescendo hairpin starting at selection", requiresSelection: true },
      { id: "line-decresc", label: "Dim ＞", toolId: "line-decresc-hairpin", title: "Diminuendo hairpin starting at selection", requiresSelection: true },
      { id: "line-8va", label: "8va", toolId: "line-8va", title: "Play an octave higher (8va)", requiresSelection: true },
      { id: "line-8vb", label: "8vb", toolId: "line-8vb", title: "Play an octave lower (8vb / 8va bassa)", requiresSelection: true },
    ],
  },
  {
    id: "repeats",
    label: "Repeats & Jumps",
    description: "Navigation markers on the focused measure",
    items: [
      { id: "rep-segno", label: "Segno", glyph: "𝄋", toolId: "measure-repeat-segno", title: "Segno sign — jump marker for D.S." },
      { id: "rep-coda", label: "Coda", glyph: "𝄌", toolId: "measure-repeat-coda", title: "Coda sign — jump to coda section" },
      { id: "rep-dc", label: "D.C.", toolId: "measure-repeat-dc", title: "Da Capo — return to the beginning" },
      { id: "rep-ds", label: "D.S.", toolId: "measure-repeat-ds", title: "Dal Segno — return to the segno sign" },
      { id: "rep-fine", label: "Fine", toolId: "measure-repeat-fine", title: "Fine — end of the piece or section" },
      { id: "rep-clear", label: "Clear", toolId: "measure-repeat-clear", title: "Remove repeat / jump markings from this measure" },
    ],
  },
  {
    id: "tempo",
    label: "Tempo",
    description: "Tempo markings and BPM",
    items: [
      { id: "tempo-largo", label: "Largo ♩ = 40", toolId: "tempo-preset-largo", title: "Largo tempo marking at ♩ = 40 BPM" },
      { id: "tempo-adagio", label: "Adagio ♩ = 66", toolId: "tempo-preset-adagio", title: "Adagio tempo marking at ♩ = 66 BPM" },
      { id: "tempo-andante", label: "Andante ♩ = 76", toolId: "tempo-preset-andante", title: "Andante tempo marking at ♩ = 76 BPM" },
      { id: "tempo-moderato", label: "Moderato ♩ = 108", toolId: "tempo-preset-moderato", title: "Moderato tempo marking at ♩ = 108 BPM" },
      { id: "tempo-allegro", label: "Allegro ♩ = 132", toolId: "tempo-preset-allegro", title: "Allegro tempo marking at ♩ = 132 BPM" },
      { id: "tempo-presto", label: "Presto ♩ = 168", toolId: "tempo-preset-presto", title: "Presto tempo marking at ♩ = 168 BPM" },
      { id: "tempo-prompt", label: "Custom…", glyph: "?", toolId: "tempo-preset-custom", title: "Enter a custom tempo in BPM (quarter note)" },
    ],
  },
  {
    id: "text",
    label: "Text",
    description: "Lyrics, chord symbols, and annotation text",
    items: [
      { id: "text-lyrics", label: "Lyrics", toolId: "text-lyrics", title: "Attach a lyric syllable to each selected note", requiresSelection: true },
      { id: "text-chord", label: "Chord symbol", toolId: "text-chord-symbol", title: "Attach a chord symbol above the selected note", requiresSelection: true },
      { id: "text-expression", label: "Expression", toolId: "text-expression", title: "Add expression text (e.g. dolce, espressivo)", requiresSelection: true },
      { id: "text-performance", label: "Performance", toolId: "text-performance", title: "Add performance instruction text", requiresSelection: true },
      { id: "text-rehearsal", label: "Rehearsal mark", toolId: "measure-rehearsal-mark", title: "Add a rehearsal letter or number above the focused measure" },
    ],
  },
  {
    id: "tuplets",
    label: "Tuplets",
    description: "Group the selected notes as a tuplet",
    items: [
      { id: "tup-3", label: "Triplet", glyph: "³", toolId: "tuplet-3", title: "Mark selection as a triplet (3 notes in the time of 2)", requiresSelection: true },
      { id: "tup-5", label: "Quintuplet", glyph: "⁵", toolId: "tuplet-5", title: "Mark selection as a quintuplet", requiresSelection: true },
      { id: "tup-6", label: "Sextuplet", glyph: "⁶", toolId: "tuplet-6", title: "Mark selection as a sextuplet", requiresSelection: true },
      { id: "tup-7", label: "Septuplet", glyph: "⁷", toolId: "tuplet-7", title: "Mark selection as a septuplet", requiresSelection: true },
      { id: "tup-clear", label: "Clear", toolId: "tuplet-clear", title: "Remove tuplet grouping from selected notes", requiresSelection: true },
    ],
  },
  {
    id: "breaths",
    label: "Breaths & Pauses",
    description: "Phrasing marks attached to the selection",
    items: [
      { id: "breath-mark", label: "Breath", glyph: "𝄓", toolId: "breath-mark", title: "Breath mark — slight pause for phrasing", requiresSelection: true },
      { id: "caesura", label: "Caesura", glyph: "‖", toolId: "breath-caesura", title: "Caesura — dramatic pause or break", requiresSelection: true },
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

/** Stable ordered ids for every palette section (popover clamp + picker). */
export const PALETTE_SECTION_IDS: readonly string[] = PALETTE_SECTIONS.map((s) => s.id);

/** Default note-selection popover sections — persisted until the user changes them. */
export const DEFAULT_POPOVER_SECTION_IDS: readonly string[] = [
  "accidentals",
  "articulations",
  "dynamics",
];

export const MAX_POPOVER_SECTIONS = 3;

/**
 * Dedupe, drop unknown ids, and cap at {@link MAX_POPOVER_SECTIONS}.
 * Used when hydrating localStorage and when the user toggles sections.
 */
export function clampPopoverSectionIds(ids: readonly string[]): string[] {
  const valid = new Set(PALETTE_SECTION_IDS);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!valid.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_POPOVER_SECTIONS) break;
  }
  return out;
}

export function getPaletteSectionById(id: string): PaletteSection | undefined {
  return PALETTE_SECTIONS.find((s) => s.id === id);
}
