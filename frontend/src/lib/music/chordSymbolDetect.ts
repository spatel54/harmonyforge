/**
 * Pitch-class chord detection helpers (shared by detect, finalize, import).
 */

import { detect } from "@tonaljs/chord-detect";
import { normalizeLeadSheetChordSymbol } from "./chordSymbolFormat";
import {
  beatsToChordEntries,
  beatsWhereHarmonyChanges,
  collectSoundingNotes,
  condenseChordTrack,
  ensureChordsOnMeasureDownbeats,
  filterChordPlacementBeats,
  harmonicRhythmStepBeats,
  isMeasureDownbeat,
  measureDownbeatBeats,
  pitchClassesForChordDetect,
  pitchClassesForMeasure,
  snapBeatsToHarmonicRhythm,
  type SoundingNote,
} from "./chordPlacement";
import type { ChordSymbolEntry, EditableScore } from "./scoreTypes";
import { generateId } from "./scoreTypes";
import { beatToRiffQuant } from "./chordSymbolFormat";

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
  } else if (suffix.startsWith("dim")) {
    intervals.push(0, 3, 6);
  } else if (suffix.includes("m7")) {
    intervals.push(0, 3, 7, 10);
  } else if (suffix === "7" || (suffix.endsWith("7") && !suffix.startsWith("m"))) {
    intervals.push(0, 4, 7, 10);
  } else if (suffix.includes("maj7")) {
    intervals.push(0, 4, 7, 11);
  } else if (suffix.startsWith("m")) {
    intervals.push(0, 3, 7);
  } else if (suffix.includes("+") || suffix.includes("aug")) {
    intervals.push(0, 4, 8);
  } else {
    intervals.push(0, 4, 7);
  }
  return new Set(intervals.map((i) => (root + i) % 12));
}

function matchScore(symbol: string, pcs: Set<number>): number {
  const tones = chordTonePcs(symbol);
  let hits = 0;
  for (const pc of pcs) if (tones.has(pc)) hits++;
  return hits;
}

export function detectSymbolFromPcs(pcs: Set<number>): string {
  if (pcs.size === 0) return "?";
  const names = pcsToNoteNames(pcs);
  const candidates = detect(names, { assumePerfectFifth: true });
  let best = "";
  let bestScore = -1;
  for (const raw of candidates.slice(0, 8)) {
    const sym = normalizeLeadSheetChordSymbol(raw);
    if (!sym || sym === "?") continue;
    const score = matchScore(sym, pcs);
    const complexity = sym.includes("7") || sym.includes("dim") ? 2 : 1;
    const bestComplexity = best.includes("7") || best.includes("dim") ? 2 : 1;
    if (
      score > bestScore ||
      (score === bestScore && complexity < bestComplexity) ||
      (score === bestScore && complexity === bestComplexity && sym.length < best.length)
    ) {
      bestScore = score;
      best = sym;
    }
  }
  return best || "?";
}

function resolveSymbolForMeasure(
  notes: SoundingNote[],
  score: EditableScore,
  measureIndex: number,
): string | null {
  const pcs = pitchClassesForMeasure(notes, score, measureIndex);
  if (!pcs) return null;
  const symbol = detectSymbolFromPcs(pcs);
  return symbol === "?" ? null : symbol;
}

function resolveSymbolAtInstant(notes: SoundingNote[], beat: number): string | null {
  const pcs = pitchClassesForChordDetect(notes, beat);
  if (!pcs) return null;
  const symbol = detectSymbolFromPcs(pcs);
  return symbol === "?" ? null : symbol;
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
    let symbol = resolveSymbolForMeasure(notes, score, mIdx);
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
  const midChords = beatsToChordEntries(
    score,
    midBeats,
    detectSymbolFromPcs,
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
      resolveSymbolForMeasure(notes, score, mIdx) ?? resolveSymbolAtInstant(notes, beat),
    () => generateId("c"),
  );
  return condenseChordTrack(score, withDownbeats).slice(0, maxSlots);
}
