/**
 * Pitch-class chord detection helpers (shared by detect, finalize, import).
 */

import { detect } from "@tonaljs/chord-detect";
import {
  beatToRiffQuant,
  diatonicLeadSheetSymbols,
  simplifyLeadSheetChordSymbol,
} from "./chordSymbolFormat";
import {
  bassPcAt,
  beatsToChordEntries,
  beatsWhereHarmonyChanges,
  collectSoundingNotes,
  condenseChordTrack,
  ensureChordsOnMeasureDownbeats,
  filterChordPlacementBeats,
  harmonicRhythmStepBeats,
  isMeasureDownbeat,
  layeredPcsAt,
  measureDownbeatBeats,
  meetsChordDetectThreshold,
  pitchClassesForMeasure,
  pitchClassesInMeasure,
  snapBeatsToHarmonicRhythm,
  type SoundingNote,
} from "./chordPlacement";
import type { ChordSymbolEntry, EditableScore } from "./scoreTypes";
import { generateId } from "./scoreTypes";
import { measureLengthBeats } from "./scoreUtils";

const PC_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const STEP_TO_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

export function pitchToPc(pitch: string): number | null {
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return null;
  let pc = STEP_TO_PC[m[1]!] ?? 0;
  if (m[2] === "#") pc += 1;
  if (m[2] === "b") pc -= 1;
  return ((pc % 12) + 12) % 12;
}

function pcsToNoteNames(pcs: Set<number>): string[] {
  return [...pcs].sort((a, b) => a - b).map((pc) => PC_NAMES[pc]!);
}

function parseRootPc(symbol: string): number | null {
  const m = symbol.match(/^([A-G])([#b]?)/);
  if (!m) return null;
  let pc = STEP_TO_PC[m[1]!] ?? 0;
  if (m[2] === "#") pc += 1;
  if (m[2] === "b") pc -= 1;
  return ((pc % 12) + 12) % 12;
}

/** Rough chord-tone set for ranking detect candidates against sounding PCs. */
function chordTonePcs(symbol: string): Set<number> {
  const root = parseRootPc(symbol);
  if (root === null) return new Set();
  const suffix = symbol.slice(symbol.match(/^[A-G][#b]?/)?.[0]?.length ?? 1).toLowerCase();
  const intervals: number[] = [];
  if (suffix.startsWith("m7b5") || suffix.includes("ø")) {
    intervals.push(0, 3, 6, 9);
  } else if (suffix.includes("maj7") || suffix.includes("ma7")) {
    intervals.push(0, 4, 7, 11);
  } else if (suffix.startsWith("dim")) {
    intervals.push(0, 3, 6);
  } else if (suffix.includes("m7")) {
    intervals.push(0, 3, 7, 10);
  } else if (suffix === "7" || (suffix.endsWith("7") && !suffix.startsWith("m"))) {
    intervals.push(0, 4, 7, 10);
  } else if (suffix.startsWith("m")) {
    intervals.push(0, 3, 7);
  } else if (suffix.includes("+") || suffix.includes("aug")) {
    intervals.push(0, 4, 8);
  } else {
    intervals.push(0, 4, 7);
  }
  return new Set(intervals.map((i) => (root + i) % 12));
}

function matchScore(symbol: string, pcs: Set<number>): { hits: number; extra: number; missing: number } {
  const tones = chordTonePcs(symbol);
  let hits = 0;
  let extra = 0;
  for (const pc of pcs) {
    if (tones.has(pc)) hits++;
    else extra++;
  }
  let missing = 0;
  for (const t of tones) if (!pcs.has(t)) missing++;
  return { hits, extra, missing };
}

export type DetectSymbolOptions = {
  bassPc?: number | null;
  keyFifths?: number;
  previousSymbol?: string;
};

export function detectSymbolFromPcs(pcs: Set<number>, opts: DetectSymbolOptions = {}): string {
  if (pcs.size === 0) return "?";
  const names = pcsToNoteNames(pcs);
  const tonal = detect(names, { assumePerfectFifth: true });
  const diatonic = new Set(
    diatonicLeadSheetSymbols(opts.keyFifths ?? 0).map((s) => simplifyLeadSheetChordSymbol(s)),
  );
  const pool = new Set<string>();
  for (const raw of tonal.slice(0, 12)) {
    const sym = simplifyLeadSheetChordSymbol(raw);
    if (sym && sym !== "?") pool.add(sym);
  }
  for (const d of diatonic) pool.add(d);

  let best = "";
  let bestScore = -Infinity;
  for (const sym of pool) {
    const tones = chordTonePcs(sym);
    if (tones.size === 0) continue;
    const { hits, extra, missing } = matchScore(sym, pcs);
    let score = hits * 6 - extra * 2 - missing;
    if (diatonic.has(sym)) score += 5;
    const root = parseRootPc(sym);
    if (opts.bassPc != null && root === opts.bassPc) score += 4;
    if (opts.previousSymbol && root != null) {
      const prevRoot = parseRootPc(opts.previousSymbol);
      if (prevRoot != null) {
        const interval = (prevRoot - root + 12) % 12;
        if (interval === 7) score += 5;
        if (interval === 5) score += 3;
        if (interval === 0) score += 2;
      }
    }
    const seventh =
      root != null && (pcs.has((root + 10) % 12) || pcs.has((root + 11) % 12));
    if (sym.includes("7") && !seventh) score -= 4;
    if (sym.includes("7") && seventh) score += 2;
    if (sym.includes("7") && opts.bassPc != null && root !== opts.bassPc) score -= 5;
    score -= Math.max(0, sym.length - 4);
    if (score > bestScore) {
      bestScore = score;
      best = sym;
    }
  }
  return best || "?";
}

function detectFromLayered(
  layered: { all: Set<number>; harmony: Set<number> } | null,
  opts: DetectSymbolOptions,
): string | null {
  if (!layered) return null;
  if (layered.harmony.size >= 3) {
    const h = detectSymbolFromPcs(layered.harmony, opts);
    if (h && h !== "?") return h;
  }
  const s = detectSymbolFromPcs(layered.all, opts);
  return !s || s === "?" ? null : s;
}

function detectOpts(
  score: EditableScore,
  notes: SoundingNote[],
  beat: number,
  previousSymbol?: string,
): DetectSymbolOptions {
  return {
    keyFifths: score.parts[0]?.measures[0]?.keySignature ?? 0,
    bassPc: bassPcAt(notes, beat),
    previousSymbol,
  };
}

function resolveSymbolForMeasure(
  notes: SoundingNote[],
  score: EditableScore,
  measureIndex: number,
  previousSymbol = "",
): string | null {
  const starts = measureDownbeatBeats(score);
  const start = starts[measureIndex] ?? 0;
  const opts = detectOpts(score, notes, start, previousSymbol);
  const fromDownbeat = detectFromLayered(layeredPcsAt(notes, start), opts);
  if (fromDownbeat) return fromDownbeat;

  const halfEnd = start + Math.min(2, measureLengthBeats(score, measureIndex));
  const firstHalf = pitchClassesInMeasure(notes, start, halfEnd);
  if (meetsChordDetectThreshold(firstHalf.all, firstHalf.harmony)) {
    const fromHalf = detectFromLayered(firstHalf, opts);
    if (fromHalf) return fromHalf;
  }

  const pcs = pitchClassesForMeasure(notes, score, measureIndex);
  if (!pcs) return null;
  const symbol = detectSymbolFromPcs(pcs, opts);
  return symbol === "?" ? null : symbol;
}

function resolveSymbolAtInstant(
  notes: SoundingNote[],
  score: EditableScore,
  beat: number,
  previousSymbol = "",
): string | null {
  return detectFromLayered(layeredPcsAt(notes, beat), detectOpts(score, notes, beat, previousSymbol));
}

/** Beat-one chord per measure from bar-wide vertical sonority (melody + harmony). */
export function buildMeasureDownbeatChords(
  score: EditableScore,
  notes: SoundingNote[],
  makeId: () => string,
): ChordSymbolEntry[] {
  const downbeats = measureDownbeatBeats(score);
  const chords: ChordSymbolEntry[] = [];
  let lastSymbol = "";

  for (let mIdx = 0; mIdx < downbeats.length; mIdx++) {
    let symbol = resolveSymbolForMeasure(notes, score, mIdx, lastSymbol);
    if ((!symbol || symbol === "?") && lastSymbol) symbol = lastSymbol;
    if (!symbol || symbol === "?") continue;
    chords.push({
      id: makeId(),
      quant: beatToRiffQuant(downbeats[mIdx]!),
      symbol,
    });
    lastSymbol = symbol;
  }

  return chords;
}

/** Full detect pipeline: bar harmony on beat one + mid-bar changes only when symbol differs. */
export function buildChordTrackFromScore(score: EditableScore, maxSlots = 64): ChordSymbolEntry[] {
  const { notes } = collectSoundingNotes(score, pitchToPc);
  const ts = score.parts[0]?.measures[0]?.timeSignature;
  const step = harmonicRhythmStepBeats(ts);

  const downbeatChords = buildMeasureDownbeatChords(score, notes, () => generateId("c"));
  const raw = beatsWhereHarmonyChanges(notes, score);
  const midBeats = filterChordPlacementBeats(snapBeatsToHarmonicRhythm(raw, step), score).filter(
    (b) => !isMeasureDownbeat(b, score),
  );
  const fifths = score.parts[0]?.measures[0]?.keySignature ?? 0;
  const midChords = beatsToChordEntries(
    score,
    midBeats,
    (pcs) => detectSymbolFromPcs(pcs, { keyFifths: fifths }),
    notes,
    () => generateId("c"),
  );

  return condenseChordTrack(score, [...downbeatChords, ...midChords]).slice(0, maxSlots);
}

/** Ensure every measure downbeat has a chord, in addition to existing placements. */
export function finalizeChordTrack(
  score: EditableScore,
  chords: ChordSymbolEntry[],
  maxSlots = 64,
): ChordSymbolEntry[] {
  if (measureDownbeatBeats(score).length === 0) return chords;
  const { notes } = collectSoundingNotes(score, pitchToPc);
  const withDownbeats = ensureChordsOnMeasureDownbeats(
    score,
    chords,
    (beat, mIdx) =>
      resolveSymbolForMeasure(notes, score, mIdx) ?? resolveSymbolAtInstant(notes, score, beat),
    () => generateId("c"),
  );
  return condenseChordTrack(score, withDownbeats).slice(0, maxSlots);
}
