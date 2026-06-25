/**
 * When/where to place chord symbols on the global beat timeline.
 *
 * **Engine (authoritative):** chord slots at `ChordSlot.beat` from inference/solver —
 * harmonic rhythm aligned to melody windows and progression (see `chordInference.ts`).
 *
 * **MusicXML import:** `<harmony>` position = document order within the measure
 * (beat offset from preceding notes/rests).
 *
 * **Vertical detect (refresh):** melody + harmony (≥2 staves); beat-one labels use the
 * union of pitch classes across the whole bar; mid-bar uses instantaneous vertical sonority.
 * Placement: chord on beat 1 of every measure; later beats in the bar only when the
 * symbol differs from that measure's opening chord (no repetition). Barline releases
 * are not separate slots.
 */

import type { ChordSymbolEntry, EditableScore } from "./scoreTypes";
import { beatToRiffQuant } from "./chordSymbolFormat";
import { effectiveMeasureTimeSignature, measureLengthBeats, noteBeats } from "./scoreUtils";

/** Beats between chord symbols — mirrors server `getChordStepSize`. */
export function harmonicRhythmStepBeats(timeSignature?: string): number {
  const m = timeSignature?.trim().match(/^(\d+)\s*\/\s*\d+$/);
  const beatsPerMeasure = m ? Number.parseInt(m[1]!, 10) : 4;
  if (!Number.isFinite(beatsPerMeasure) || beatsPerMeasure <= 0) return 2;
  if (beatsPerMeasure >= 4) return 2;
  if (beatsPerMeasure === 3) return 1.5;
  return Math.max(1, beatsPerMeasure);
}

/** Snap change times to the harmonic-rhythm grid (lead-sheet style placement). */
export function snapBeatsToHarmonicRhythm(beats: number[], stepBeats: number): number[] {
  if (stepBeats <= 0) return beats;
  const out: number[] = [];
  let last = -Infinity;
  for (const beat of beats) {
    const slot = Math.floor(beat / stepBeats + 1e-9) * stepBeats;
    if (slot <= last + 1e-6) continue;
    out.push(slot);
    last = slot;
  }
  return out;
}

export interface SoundingNote {
  globalBeat: number;
  endBeat: number;
  pitchClass: number;
  /** 0 = melody; ≥1 = harmony staves */
  partIndex: number;
}

const MIN_PITCH_CLASSES_FOR_CHORD = 3;

/** Pitch classes that sound at any point during [measureStart, measureEnd). */
export function pitchClassesInMeasure(
  notes: SoundingNote[],
  measureStart: number,
  measureEnd: number,
): { all: Set<number>; harmony: Set<number> } {
  const all = new Set<number>();
  const harmony = new Set<number>();
  for (const n of notes) {
    if (n.globalBeat >= measureEnd - 1e-4 || n.endBeat <= measureStart + 1e-4) continue;
    all.add(n.pitchClass);
    if (n.partIndex >= 1) harmony.add(n.pitchClass);
  }
  return { all, harmony };
}

export function meetsChordDetectThreshold(
  all: Set<number>,
  harmony: Set<number>,
): boolean {
  if (all.size < MIN_PITCH_CLASSES_FOR_CHORD) return false;
  if (harmony.size >= 2) return true;
  // Melody + one harmony line: triad must include harmony (≥1 PC) plus melody.
  return harmony.size >= 1 && all.size >= 3;
}

export function measureIndexForBeat(beat: number, score: EditableScore): number {
  const starts = measureDownbeatBeats(score);
  for (let i = starts.length - 1; i >= 0; i--) {
    if (beat >= starts[i]! - 1e-4) return i;
  }
  return 0;
}

/** PCs sounding at an instant (mid-bar changes). */
export function pitchClassesForChordDetect(
  notes: SoundingNote[],
  time: number,
): Set<number> | null {
  const all = new Set<number>();
  const harmony = new Set<number>();

  for (const n of notes) {
    if (time < n.globalBeat - 1e-4 || time >= n.endBeat - 1e-4) continue;
    all.add(n.pitchClass);
    if (n.partIndex >= 1) harmony.add(n.pitchClass);
  }

  if (!meetsChordDetectThreshold(all, harmony)) return null;
  return all;
}

/** Union of PCs in the measure — used for beat-one chord symbols (lead-sheet bar harmony). */
export function pitchClassesForMeasure(
  notes: SoundingNote[],
  score: EditableScore,
  measureIndex: number,
): Set<number> | null {
  const starts = measureDownbeatBeats(score);
  const start = starts[measureIndex] ?? 0;
  const end = starts[measureIndex + 1] ?? start + measureLengthBeats(score, measureIndex);
  const { all, harmony } = pitchClassesInMeasure(notes, start, end);
  if (!meetsChordDetectThreshold(all, harmony)) return null;
  return all;
}

/** Build sounding notes from all parts (concert pitch strings). */
export function collectSoundingNotes(
  score: EditableScore,
  pitchToPc: (pitch: string) => number | null,
): { notes: SoundingNote[]; totalBeats: number } {
  const notes: SoundingNote[] = [];
  let measureStart = 0;

  for (let mIdx = 0; mIdx < (score.parts[0]?.measures.length ?? 0); mIdx++) {
    const ts = effectiveMeasureTimeSignature(score, mIdx);

    for (let partIndex = 0; partIndex < score.parts.length; partIndex++) {
      const part = score.parts[partIndex]!;
      const measure = part.measures[mIdx];
      if (!measure) continue;
      let beatInMeasure = 0;
      for (const note of measure.notes) {
        if (!note.isRest) {
          const pc = pitchToPc(note.pitch);
          if (pc !== null) {
            const start = measureStart + beatInMeasure;
            const dur = noteBeats(note);
            notes.push({
              globalBeat: start,
              endBeat: start + dur,
              pitchClass: pc,
              partIndex,
            });
          }
        }
        beatInMeasure += noteBeats(note);
      }
    }
    measureStart += measureLengthBeats(score, mIdx);
  }

  return { notes, totalBeats: measureStart };
}

export function isMeasureDownbeat(beat: number, score: EditableScore): boolean {
  return measureDownbeatBeats(score).some((d) => Math.abs(d - beat) < 1e-4);
}

/** Last notated onset beat inside the measure (4/4 → beat 3 of the bar starting at 0). */
export function lastOnsetBeatInMeasure(score: EditableScore, measureIndex: number): number {
  const starts = measureDownbeatBeats(score);
  const start = starts[measureIndex] ?? 0;
  const end = starts[measureIndex + 1] ?? start + measureLengthBeats(score, measureIndex);
  return Math.max(start, end - 1);
}

export function isLastOnsetBeatOfMeasure(beat: number, score: EditableScore): boolean {
  const count = score.parts[0]?.measures.length ?? 0;
  for (let i = 0; i < count; i++) {
    if (Math.abs(beat - lastOnsetBeatInMeasure(score, i)) < 1e-4) return true;
  }
  return false;
}

/** Drop barline-release and final-beat slots; keep downbeats and true mid-bar changes. */
export function filterChordPlacementBeats(beats: number[], score: EditableScore): number[] {
  return beats.filter((b) => {
    if (isMeasureDownbeat(b, score)) return true;
    if (isLastOnsetBeatOfMeasure(b, score)) return false;
    return true;
  });
}

/** Global beat index of each measure's first beat. */
export function measureDownbeatBeats(score: EditableScore): number[] {
  const measureCount = score.parts[0]?.measures.length ?? 0;
  const starts: number[] = [];
  let beat = 0;
  for (let mIdx = 0; mIdx < measureCount; mIdx++) {
    starts.push(beat);
    beat += measureLengthBeats(score, mIdx);
  }
  return starts;
}

/** Times where a note starts or ends — only boundaries can change the vertical sonority. */
export function harmonicChangeTimes(
  notes: SoundingNote[],
  score?: EditableScore,
): number[] {
  const times = new Set<number>();
  times.add(0);
  const downbeats = score ? new Set(measureDownbeatBeats(score)) : null;
  for (const n of notes) {
    times.add(n.globalBeat);
    if (!score) {
      times.add(n.endBeat);
      continue;
    }
    // Barline releases coincide with the next downbeat; last-beat releases are not lead-sheet slots.
    if (downbeats!.has(n.endBeat)) continue;
    if (isLastOnsetBeatOfMeasure(n.endBeat, score)) continue;
    times.add(n.endBeat);
  }
  return [...times].sort((a, b) => a - b);
}

export function pitchClassesSoundingAt(notes: SoundingNote[], time: number): Set<number> {
  const pcs = new Set<number>();
  for (const n of notes) {
    if (time >= n.globalBeat - 1e-4 && time < n.endBeat - 1e-4) {
      pcs.add(n.pitchClass);
    }
  }
  return pcs;
}

function pcSetsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

/** Beat positions where the vertical pitch-class set changes (candidates for chord symbols). */
export function beatsWhereHarmonyChanges(notes: SoundingNote[], score: EditableScore): number[] {
  const times = harmonicChangeTimes(notes, score);
  const out: number[] = [];
  let prev: Set<number> | null = null;

  for (const t of times) {
    const pcs = pitchClassesForChordDetect(notes, t);
    if (!pcs) {
      prev = null;
      continue;
    }
    if (prev && pcSetsEqual(prev, pcs)) continue;
    out.push(t);
    prev = pcs;
  }
  return out;
}

/** Map placement beats to RiffScore chord-track quants. */
export function beatsToChordEntries(
  score: EditableScore,
  beats: number[],
  symbolForPcs: (pcs: Set<number>) => string,
  notes: SoundingNote[],
  makeId: () => string,
): ChordSymbolEntry[] {
  const chords: ChordSymbolEntry[] = [];
  let lastSymbol = "";

  for (const beat of beats) {
    const pcs = pitchClassesForChordDetect(notes, beat);
    if (!pcs) continue;
    const symbol = symbolForPcs(pcs);
    if (!symbol || symbol === "?") continue;
    if (!isMeasureDownbeat(beat, score) && symbol === lastSymbol) continue;
    lastSymbol = symbol;
    chords.push({
      id: makeId(),
      quant: beatToRiffQuant(beat),
      symbol,
    });
  }
  return chords;
}

/**
 * Ensure a chord symbol exists on every measure downbeat (in addition to existing entries).
 */
export function ensureChordsOnMeasureDownbeats(
  score: EditableScore,
  chords: ChordSymbolEntry[],
  resolveSymbolAtBeat: (beat: number, measureIndex: number) => string | null,
  makeId: () => string,
): ChordSymbolEntry[] {
  const downbeats = measureDownbeatBeats(score);
  if (downbeats.length === 0) return chords;

  const byQuant = new Map<number, ChordSymbolEntry>();
  for (const c of chords) {
    if (!byQuant.has(c.quant)) byQuant.set(c.quant, c);
  }

  let lastSymbol = "";
  const sorted = [...chords].sort((a, b) => a.quant - b.quant);

  for (let mIdx = 0; mIdx < downbeats.length; mIdx++) {
    const beat = downbeats[mIdx]!;
    const quant = beatToRiffQuant(beat);
    const measureEnd = downbeats[mIdx + 1] ?? beat + measureLengthBeats(score, mIdx);
    const laterInMeasure = sorted.find(
      (c) => c.quant > quant && c.quant < beatToRiffQuant(measureEnd),
    );

    const existing = byQuant.get(quant);
    let symbol = resolveSymbolAtBeat(beat, mIdx);
    if ((!symbol || symbol === "?") && existing?.symbol) symbol = existing.symbol;
    if ((!symbol || symbol === "?") && lastSymbol) symbol = lastSymbol;
    if ((!symbol || symbol === "?") && laterInMeasure) symbol = laterInMeasure.symbol;
    if (!symbol || symbol === "?") continue;
    const entry: ChordSymbolEntry = {
      id: existing?.id ?? makeId(),
      quant,
      symbol,
    };
    byQuant.set(quant, entry);
    if (!existing) sorted.push(entry);
    lastSymbol = symbol;
  }

  return [...byQuant.values()].sort((a, b) => a.quant - b.quant);
}

/**
 * One symbol at beat 1 of each measure; later slots in the bar only if the symbol changes.
 */
export function condenseChordTrack(
  score: EditableScore,
  chords: ChordSymbolEntry[],
): ChordSymbolEntry[] {
  if (chords.length === 0) return chords;

  const measureStarts = measureDownbeatBeats(score);
  const sorted = [...chords].sort((a, b) => a.quant - b.quant);
  const out: ChordSymbolEntry[] = [];
  let measureAnchorSymbol = "";
  let currentMeasure = -1;

  for (const entry of sorted) {
    const beat = entry.quant / 16;
    const mIdx = measureIndexForBeat(beat, score);
    const mStart = measureStarts[mIdx] ?? 0;
    const isFirstBeatOfMeasure = Math.abs(beat - mStart) < 1e-4;

    if (mIdx !== currentMeasure) {
      currentMeasure = mIdx;
      measureAnchorSymbol = "";
    }

    if (isFirstBeatOfMeasure) {
      out.push(entry);
      measureAnchorSymbol = entry.symbol;
      continue;
    }

    if (entry.symbol !== measureAnchorSymbol) {
      out.push(entry);
    }
  }

  return out;
}
