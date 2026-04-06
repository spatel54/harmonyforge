/**
 * Chord inference: when no chords in file, infer diatonic progression.
 * Genre affects candidates and transition preferences (HFLitReview: classical vs jazz vs pop).
 */
import type { ParsedScore, ChordSlot, Genre } from "./types.js";
/** Infer chords from melody with melody-compatible diatonic selection. Genre affects candidates and transitions. */
export declare function inferChords(parsed: ParsedScore, mood?: "major" | "minor", genre?: Genre): ChordSlot[];
/** Ensure ParsedScore has chords (use inferred if missing). Mood and genre affect inference. */
export declare function ensureChords(parsed: ParsedScore, mood?: "major" | "minor", genre?: Genre): ParsedScore & {
    chords: ChordSlot[];
};
