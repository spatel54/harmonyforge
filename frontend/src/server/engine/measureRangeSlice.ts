/**
 * Slice a ParsedScore to an inclusive measure range for localized harmony generation (Iteration 6).
 * Rebases melody beats and chord beats to start at 0 for the excerpt.
 */

import type { ChordSlot, MelodyNote, ParsedScore } from "./types";

const DIVISIONS = 8;

function clampDurationBeats(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.round(duration * DIVISIONS) / DIVISIONS;
}

function measureIndexForNote(
  note: MelodyNote,
  beatsPerMeasure: number,
  totalMeasures: number,
): number {
  if (note.measure != null && Number.isFinite(note.measure)) {
    return Math.max(0, Math.min(totalMeasures - 1, Math.floor(note.measure)));
  }
  const b = clampDurationBeats(note.beat);
  return Math.max(0, Math.min(totalMeasures - 1, Math.floor(b / Math.max(0.25, beatsPerMeasure))));
}

/**
 * Returns null if range is empty or invalid.
 */
export function sliceParsedScoreToMeasureRange(
  parsed: ParsedScore,
  startMeasure: number,
  endMeasure: number,
): ParsedScore | null {
  const beatsPerMeasure = parsed.timeSignature?.beats ?? 4;
  const totalMeasures = Math.max(1, parsed.totalMeasures ?? Math.ceil((parsed.totalBeats ?? 0) / beatsPerMeasure));
  if (startMeasure < 0 || endMeasure < 0) return null;
  if (startMeasure > totalMeasures - 1 || endMeasure > totalMeasures - 1) return null;
  const start = Math.min(startMeasure, endMeasure);
  const end = Math.max(startMeasure, endMeasure);

  const sliceMelody = parsed.melody.filter((n) => {
    const m = measureIndexForNote(n, beatsPerMeasure, totalMeasures);
    return m >= start && m <= end;
  });
  if (sliceMelody.length === 0) return null;

  const sliceMeasures = end - start + 1;
  const rebasedMelody: MelodyNote[] = sliceMelody.map((n) => {
    const m = measureIndexForNote(n, beatsPerMeasure, totalMeasures);
    const localMeasure = m - start;
    const beatInMeasure = clampDurationBeats(n.beat - m * beatsPerMeasure);
    const newBeat = localMeasure * beatsPerMeasure + beatInMeasure;
    return {
      ...n,
      beat: clampDurationBeats(newBeat),
      measure: localMeasure,
    };
  });

  let rebasedChords: ChordSlot[] | undefined;
  if (parsed.chords && parsed.chords.length > 0) {
    rebasedChords = [];
    for (const c of parsed.chords) {
      const b = c.beat ?? 0;
      const m = Math.max(0, Math.min(totalMeasures - 1, Math.floor(b / beatsPerMeasure)));
      if (m < start || m > end) continue;
      const localM = m - start;
      const beatInMeasure = clampDurationBeats(b - m * beatsPerMeasure);
      const newBeat = localM * beatsPerMeasure + beatInMeasure;
      rebasedChords.push({ ...c, beat: clampDurationBeats(newBeat) });
    }
    if (rebasedChords.length === 0) rebasedChords = undefined;
  }

  const totalBeats = sliceMeasures * beatsPerMeasure;
  const next: ParsedScore = {
    ...parsed,
    melody: rebasedMelody,
    chords: rebasedChords,
    totalMeasures: sliceMeasures,
    totalBeats,
    pickupBeats: start === 0 ? parsed.pickupBeats : undefined,
  };
  return next;
}
