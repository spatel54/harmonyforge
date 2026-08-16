/**
 * Derive MuseScore-style pressed/active state for palette buttons.
 */
import type { DurationType, EditableScore, Measure, Note, Part } from "@/lib/music/scoreTypes";
import { getNoteById } from "@/lib/music/scoreUtils";
import type { PaletteItem } from "@/lib/palettes/paletteRegistry";
import { TEMPO_PRESET_BPM } from "./paletteToolScoreOps";

const ARTIC_TOOL_TO_VALUE: Record<string, string> = {
  "artic-staccato": "a.",
  "artic-tenuto": "a-",
  "artic-accent": "a>",
  "artic-strong-accent": "a^",
  "artic-staccatissimo": "staccatissimo",
  "artic-fermata": "fermata",
  "breath-mark": "breath-mark",
  "breath-caesura": "caesura",
};

const ORNAMENT_TOOLS = new Set([
  "ornament-trill",
  "ornament-turn",
  "ornament-mordent",
  "ornament-mordent-upper",
]);

const LINE_TOOL_TO_KIND: Record<string, string> = {
  "line-slur": "slur",
  "line-cresc-hairpin": "cresc-hairpin",
  "line-decresc-hairpin": "decresc-hairpin",
  "line-8va": "8va",
  "line-8vb": "8vb",
};

const DYN_TOOL_TO_VALUE: Record<string, string> = {
  "dynamics-ppp": "ppp",
  "dynamics-pp": "pp",
  "dynamics-piano": "p",
  "dynamics-mp": "mp",
  "dynamics-mf": "mf",
  "dynamics-f": "f",
  "dynamics-forte": "f",
  "dynamics-ff": "ff",
  "dynamics-fff": "fff",
  "dynamics-sfz": "sfz",
  "dynamics-fp": "fp",
  "dynamics-cresc": "cresc.",
  "dynamics-decresc": "dim.",
};

const DURATION_TOOL_TO_VALUE: Record<string, DurationType> = {
  "duration-whole": "w",
  "duration-half": "h",
  "duration-quarter": "q",
  "duration-eighth": "8",
  "duration-16th": "16",
  "duration-32nd": "32",
};

const ACCIDENTAL_TOOLS: Record<string, "sharp" | "flat" | "natural" | "dsharp" | "dflat"> = {
  "pitch-accidental-sharp": "sharp",
  "pitch-accidental-flat": "flat",
  "pitch-accidental-natural": "natural",
  "pitch-accidental-dsharp": "dsharp",
  "pitch-accidental-dflat": "dflat",
};

function selectedNotes(score: EditableScore | null, noteIds: ReadonlySet<string>): Note[] {
  if (!score || noteIds.size === 0) return [];
  const out: Note[] = [];
  for (const id of noteIds) {
    const hit = getNoteById(score, id);
    if (hit) out.push(hit.note);
  }
  return out;
}

function focusFromSelection(
  score: EditableScore | null,
  noteIds: ReadonlySet<string>,
): { part: Part; measure: Measure } | null {
  if (!score) return null;
  for (const id of noteIds) {
    const hit = getNoteById(score, id);
    if (hit) return { part: hit.part, measure: hit.measure };
  }
  const part = score.parts[0];
  const measure = part?.measures[0];
  if (part && measure) return { part, measure };
  return null;
}

function allHaveArtic(notes: Note[], artic: string): boolean {
  return notes.length > 0 && notes.every((n) => n.articulations?.includes(artic));
}

function allHaveOrnament(notes: Note[], ornament: string): boolean {
  const norm =
    ornament === "mordent-upper" || ornament === "ornament-mordent-upper"
      ? "inverted-mordent"
      : ornament.replace(/^ornament-/, "");
  return notes.length > 0 && notes.every((n) => n.ornament === norm || n.ornament === ornament);
}

function lineActiveOnSelection(notes: Note[], kind: string): boolean {
  if (notes.length === 0) return false;
  if (notes.length === 1) {
    const only = notes[0]!;
    return only.lineStart === kind || only.lineEnd === kind;
  }
  const first = notes[0]!;
  const last = notes[notes.length - 1]!;
  return first.lineStart === kind && last.lineEnd === kind;
}

function dynamicActiveOnAnchor(notes: Note[], value: string): boolean {
  if (notes.length === 0) return false;
  return notes[0]!.dynamics === value;
}

function allDotted(notes: Note[]): boolean {
  return notes.length > 0 && notes.every((n) => (n.dots ?? 0) > 0);
}

function allTuplet(notes: Note[], n: number): boolean {
  return notes.length > 0 && notes.every((note) => note.tuplet === n);
}

function allTied(notes: Note[]): boolean {
  return notes.length > 0 && notes.every((n) => n.tie === "start" || n.tie === "continue");
}

function pitchAccidental(pitch: string): "sharp" | "flat" | "natural" | "dsharp" | "dflat" {
  const m = pitch.match(/^([A-G])(#{1,2}|bb|b)?(\d+)$/);
  const acc = m?.[2];
  if (acc === "##") return "dsharp";
  if (acc === "#") return "sharp";
  if (acc === "bb") return "dflat";
  if (acc === "b") return "flat";
  return "natural";
}

/** True when the palette item should render pressed (aria-pressed). */
export function isPaletteItemPressed(
  item: PaletteItem,
  ctx: {
    score: EditableScore | null;
    selectedNoteIds: ReadonlySet<string>;
    activeTool: string | null;
    dottedInputMode?: boolean;
  },
): boolean {
  const { score, selectedNoteIds, activeTool, dottedInputMode } = ctx;
  const toolId = item.toolId;
  const notes = selectedNotes(score, selectedNoteIds);
  const focus = focusFromSelection(score, selectedNoteIds);

  if (toolId === "mode-repitch") {
    return activeTool === toolId;
  }

  const durationValue = DURATION_TOOL_TO_VALUE[toolId];
  if (durationValue) {
    if (notes.length > 0) return notes.every((n) => n.duration === durationValue);
    return activeTool === toolId;
  }

  if (toolId === "duration-dotted") {
    if (notes.length > 0) return allDotted(notes);
    return Boolean(dottedInputMode);
  }

  if (toolId === "duration-tie") {
    return allTied(notes);
  }

  const artic = ARTIC_TOOL_TO_VALUE[toolId];
  if (artic) return allHaveArtic(notes, artic);

  if (ORNAMENT_TOOLS.has(toolId)) {
    const orn = toolId.slice("ornament-".length);
    return allHaveOrnament(notes, orn);
  }

  const lineKind = LINE_TOOL_TO_KIND[toolId];
  if (lineKind) return lineActiveOnSelection(notes, lineKind);

  const dyn = DYN_TOOL_TO_VALUE[toolId];
  if (dyn) return dynamicActiveOnAnchor(notes, dyn);

  if (toolId.startsWith("tuplet-") && toolId !== "tuplet-clear") {
    const n = Number.parseInt(toolId.slice("tuplet-".length), 10);
    if (Number.isFinite(n)) return allTuplet(notes, n);
  }

  const accWant = ACCIDENTAL_TOOLS[toolId];
  if (accWant) {
    const pitched = notes.filter((n) => !n.isRest);
    return pitched.length > 0 && pitched.every((n) => pitchAccidental(n.pitch) === accWant);
  }

  if (toolId.startsWith("measure-clef-") && focus) {
    return focus.part.clef === toolId.slice("measure-clef-".length);
  }

  if (toolId.startsWith("measure-change-key-") && focus) {
    const fifths = Number.parseInt(toolId.slice("measure-change-key-".length), 10);
    if (!Number.isFinite(fifths)) return false;
    const current = focus.measure.keySignature ?? 0;
    return current === fifths;
  }

  if (toolId.startsWith("measure-change-time-") && focus) {
    const raw = toolId.slice("measure-change-time-".length);
    const match = raw.match(/^(\d+)-(\d+)$/);
    if (!match) return false;
    const ts = `${match[1]}/${match[2]}`;
    return (focus.measure.timeSignature ?? "4/4") === ts;
  }

  if (toolId.startsWith("measure-barline-") && focus) {
    const style = toolId.slice("measure-barline-".length);
    return (focus.measure.barline ?? "normal") === style;
  }

  if (toolId.startsWith("measure-repeat-") && toolId !== "measure-repeat-clear" && focus) {
    return focus.measure.repeatMark === toolId.slice("measure-repeat-".length);
  }

  if (toolId.startsWith("tempo-preset-") && toolId !== "tempo-preset-custom" && score) {
    const kind = toolId.slice("tempo-preset-".length);
    const bpm = TEMPO_PRESET_BPM[kind];
    return typeof bpm === "number" && score.bpm === bpm;
  }

  return false;
}
