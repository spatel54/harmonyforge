/**
 * Vertical sonority chord detection (melody + harmony, ≥2 staves).
 */

import { buildChordTrackFromScore, finalizeChordTrack } from "./chordSymbolDetect";
import type { ChordSymbolEntry, EditableScore } from "./scoreTypes";
import { shouldShowChordNotation } from "./riffscoreAdapter";

export { finalizeChordTrack } from "./chordSymbolDetect";

const MAX_CHORD_SLOTS = 64;

/**
 * Detect chord symbols: beat-one label from full-bar sonority; later beats only on change.
 */
export function detectChordsFromScore(score: EditableScore): ChordSymbolEntry[] {
  if (!shouldShowChordNotation(score)) return [];
  return buildChordTrackFromScore(score, MAX_CHORD_SLOTS);
}
