import type { ParsedScore } from "../types";

/**
 * Append parsed scores (in time order) into a single ParsedScore.
 * Offsets follower melody/chord beats by the predecessor's totals.
 */
export function mergeParsedScores(parts: ParsedScore[]): ParsedScore | null {
  const nonEmpty = parts.filter((p) => p && p.melody.length > 0);
  if (nonEmpty.length === 0) return null;
  if (nonEmpty.length === 1) return nonEmpty[0]!;

  const [head, ...rest] = nonEmpty;
  const merged: ParsedScore = {
    key: head.key,
    melody: [...head.melody],
    chords: head.chords ? [...head.chords] : undefined,
    timeSignature: head.timeSignature,
    totalBeats: head.totalBeats ?? 0,
    totalMeasures: head.totalMeasures,
    melodyPartName: head.melodyPartName,
    pickupBeats: head.pickupBeats,
  };

  for (const part of rest) {
    const beatOffset = merged.totalBeats ?? 0;
    const measureOffset = merged.totalMeasures ?? 0;
    for (const note of part.melody) {
      merged.melody.push({
        pitch: note.pitch,
        beat: note.beat + beatOffset,
        duration: note.duration,
        measure: note.measure !== undefined ? note.measure + measureOffset : undefined,
      });
    }
    if (part.chords && part.chords.length > 0) {
      if (!merged.chords) merged.chords = [];
      for (const chord of part.chords) {
        merged.chords.push({
          ...chord,
          beat: chord.beat !== undefined ? chord.beat + beatOffset : undefined,
        });
      }
    }
    merged.totalBeats = (merged.totalBeats ?? 0) + (part.totalBeats ?? 0);
    if (merged.totalMeasures !== undefined && part.totalMeasures !== undefined) {
      merged.totalMeasures += part.totalMeasures;
    }
  }
  return merged;
}
