/**
 * Pure score mutations for palette / toolbar tool ids (testable without React).
 */
import type { BarlineStyle, EditableScore } from "@/lib/music/scoreTypes";
import {
  applyKeySignatureFromMeasure,
  applyTimeSignatureFromMeasure,
  applyTupletGroup,
  clearTupletOnSelection,
  cloneScore,
  setMeasureBarline,
  setMeasureRepeatMark,
  setMeasureTempoText,
  setNoteChordSymbol,
  setNoteLyric,
  setNoteWords,
  toggleArticulation,
  toggleDynamicOnAnchor,
  toggleLineOnSelection,
  toggleOrnament,
} from "@/lib/music/scoreUtils";

export const ARTIC_TOOL_MAP: Record<string, string> = {
  "artic-staccato": "a.",
  "artic-tenuto": "a-",
  "artic-accent": "a>",
  "artic-strong-accent": "a^",
  "artic-staccatissimo": "staccatissimo",
  "artic-fermata": "fermata",
  "breath-mark": "breath-mark",
  "breath-caesura": "caesura",
};

export const DYN_TOOL_MAP: Record<string, string> = {
  "dynamics-piano": "p",
  "dynamics-forte": "f",
  "dynamics-cresc": "cresc.",
  "dynamics-decresc": "dim.",
  "dynamics-ppp": "ppp",
  "dynamics-pp": "pp",
  "dynamics-mp": "mp",
  "dynamics-mf": "mf",
  "dynamics-f": "f",
  "dynamics-ff": "ff",
  "dynamics-fff": "fff",
  "dynamics-sfz": "sfz",
  "dynamics-fp": "fp",
};

export const LINE_TOOL_MAP: Record<string, string> = {
  "line-slur": "slur",
  "line-cresc-hairpin": "cresc-hairpin",
  "line-decresc-hairpin": "decresc-hairpin",
  "line-8va": "8va",
  "line-8vb": "8vb",
};

export type PaletteScoreOpContext = {
  score: EditableScore;
  noteIds: Set<string>;
  measureIndex: number;
};

export type PaletteScoreOpResult =
  | { kind: "score"; score: EditableScore }
  | { kind: "none" }
  | { kind: "prompt"; promptKind: PalettePromptKind };

export type PalettePromptKind =
  | "lyrics"
  | "chord"
  | "expression"
  | "performance"
  | "rehearsal"
  | "tempo"
  | "time"
  | "key";

export const TEMPO_PRESET_BPM: Record<string, number> = {
  largo: 40,
  adagio: 66,
  andante: 76,
  moderato: 108,
  allegro: 132,
  presto: 168,
};

export const TEMPO_PRESET_TEXT: Record<string, string> = {
  largo: "Largo",
  adagio: "Adagio",
  andante: "Andante",
  moderato: "Moderato",
  allegro: "Allegro",
  presto: "Presto",
};

/** Score-only palette tools (no React/session). Returns null when tool is not handled here. */
export function applyPaletteScoreOp(
  toolId: string,
  ctx: PaletteScoreOpContext,
): PaletteScoreOpResult | null {
  const { score, noteIds, measureIndex } = ctx;

  const artic = ARTIC_TOOL_MAP[toolId];
  if (artic && noteIds.size > 0) {
    return { kind: "score", score: toggleArticulation(score, noteIds, artic) };
  }

  if (toolId.startsWith("ornament-") && noteIds.size > 0) {
    const ornament = toolId.slice("ornament-".length);
    return { kind: "score", score: toggleOrnament(score, noteIds, ornament) };
  }

  const dyn = DYN_TOOL_MAP[toolId];
  if (dyn && noteIds.size > 0) {
    return { kind: "score", score: toggleDynamicOnAnchor(score, noteIds, dyn) };
  }

  const lineKind = LINE_TOOL_MAP[toolId];
  if (lineKind && noteIds.size > 0) {
    return { kind: "score", score: toggleLineOnSelection(score, noteIds, lineKind) };
  }

  if (toolId.startsWith("tuplet-") && noteIds.size > 0) {
    const rest = toolId.slice("tuplet-".length);
    if (rest === "clear") {
      return { kind: "score", score: clearTupletOnSelection(score, noteIds) };
    }
    const n = Number.parseInt(rest, 10);
    if (Number.isFinite(n) && n > 0) {
      return { kind: "score", score: applyTupletGroup(score, noteIds, n) };
    }
  }

  if (toolId.startsWith("measure-barline-")) {
    const style = toolId.slice("measure-barline-".length) as BarlineStyle;
    return { kind: "score", score: setMeasureBarline(score, measureIndex, style) };
  }

  if (toolId.startsWith("measure-repeat-")) {
    const kind = toolId.slice("measure-repeat-".length);
    if (kind === "clear") {
      return { kind: "score", score: setMeasureRepeatMark(score, measureIndex, null) };
    }
    if (["segno", "coda", "dc", "ds", "fine"].includes(kind)) {
      return {
        kind: "score",
        score: setMeasureRepeatMark(
          score,
          measureIndex,
          kind as "segno" | "coda" | "dc" | "ds" | "fine",
        ),
      };
    }
  }

  if (toolId.startsWith("measure-change-key-")) {
    const raw = toolId.slice("measure-change-key-".length);
    const fifths = Number.parseInt(raw, 10);
    if (Number.isFinite(fifths) && fifths >= -7 && fifths <= 7) {
      return { kind: "score", score: applyKeySignatureFromMeasure(score, measureIndex, fifths) };
    }
  }

  if (toolId.startsWith("measure-change-time-")) {
    const raw = toolId.slice("measure-change-time-".length);
    const match = raw.match(/^(\d+)-(\d+)$/);
    if (match) {
      const ts = `${match[1]}/${match[2]}`;
      return { kind: "score", score: applyTimeSignatureFromMeasure(score, measureIndex, ts) };
    }
  }

  if (toolId.startsWith("tempo-preset-")) {
    const kind = toolId.slice("tempo-preset-".length);
    const presets: Record<string, { text: string; bpm: number }> = Object.fromEntries(
      Object.entries(TEMPO_PRESET_BPM).map(([id, bpm]) => [
        id,
        { text: TEMPO_PRESET_TEXT[id] ?? id, bpm },
      ]),
    );
    if (kind === "custom") return { kind: "prompt", promptKind: "tempo" };
    if (kind in presets) {
      const { text, bpm } = presets[kind]!;
      return {
        kind: "score",
        score: setMeasureTempoText(score, measureIndex, `${text} ♩ = ${bpm}`, bpm),
      };
    }
  }

  if (toolId === "measure-change-time") return { kind: "prompt", promptKind: "time" };
  if (toolId === "measure-change-key") return { kind: "prompt", promptKind: "key" };
  if (toolId === "text-lyrics") return { kind: "prompt", promptKind: "lyrics" };
  if (toolId === "text-chord-symbol") return { kind: "prompt", promptKind: "chord" };
  if (toolId === "text-expression") return { kind: "prompt", promptKind: "expression" };
  if (toolId === "text-performance") return { kind: "prompt", promptKind: "performance" };
  if (toolId === "measure-rehearsal-mark") return { kind: "prompt", promptKind: "rehearsal" };

  return null;
}

export function applyPalettePromptResult(
  promptKind: PalettePromptKind,
  text: string,
  ctx: PaletteScoreOpContext,
): EditableScore | null {
  const { score, noteIds, measureIndex } = ctx;
  const trimmed = text.trim();

  switch (promptKind) {
    case "lyrics":
      return setNoteLyric(score, noteIds, trimmed === "" ? null : text);
    case "chord":
      return setNoteChordSymbol(score, noteIds, trimmed === "" ? null : text);
    case "expression":
    case "performance":
      return setNoteWords(score, noteIds, trimmed === "" ? null : text);
    case "rehearsal": {
      const next = cloneScore(score);
      for (const part of next.parts) {
        const measure = part.measures[measureIndex];
        if (measure) {
          if (trimmed === "") delete measure.rehearsalMark;
          else measure.rehearsalMark = trimmed;
        }
      }
      return next;
    }
    case "tempo": {
      const bpm = Number.parseFloat(trimmed);
      if (!Number.isFinite(bpm) || bpm <= 0) return null;
      return setMeasureTempoText(score, measureIndex, `♩ = ${Math.round(bpm)}`, bpm);
    }
    case "time":
      if (!trimmed) return null;
      return applyTimeSignatureFromMeasure(score, measureIndex, trimmed);
    case "key": {
      const fifths = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(fifths) || fifths < -7 || fifths > 7) return null;
      return applyKeySignatureFromMeasure(score, measureIndex, fifths);
    }
    default:
      return null;
  }
}
