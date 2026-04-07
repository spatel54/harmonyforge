/**
 * Chord inference: when no chords in file, infer diatonic progression.
 * Genre affects candidates and transition preferences (HFLitReview: classical vs jazz vs pop).
 */
import type { ParsedScore, ChordSlot, Genre } from "./types.js";
/** Default cap on inferred chord slots (long scores widen the grid). Override with HF_MAX_CHORD_SLOTS. */
export declare const DEFAULT_MAX_CHORD_SLOTS = 128;
export declare function resolveMaxChordSlots(): number;
/**
 * Base grid step from meter, then widen if the score would exceed max chord slots (keeps SATB solver tractable).
 */
export declare function resolveAdaptiveBeatsPerChord(parsed: ParsedScore, lastBeat: number, maxSlots?: number): number;
/** Infer chords from melody with melody-compatible diatonic selection. Genre affects candidates and transitions. */
export declare function inferChords(parsed: ParsedScore, mood?: "major" | "minor", genre?: Genre): ChordSlot[];
/**
 * When MusicXML embeds more harmony symbols than the solver cap, keep an evenly spaced subset
 * in beat order (always includes first and last slots) so SATB search stays tractable.
 */
export declare function downsampleChordSlotsToMax(chords: ChordSlot[], maxSlots: number): ChordSlot[];
/** Ensure ParsedScore has chords (use inferred if missing). Mood and genre affect inference. */
export declare function ensureChords(parsed: ParsedScore, mood?: "major" | "minor", genre?: Genre): ParsedScore & {
    chords: ChordSlot[];
};
