/**
 * HarmonyForge Logic Core — SATB constraint checks
 * Per Taxonomy.md §1.6: range, spacing, parallel fifths/octaves, voice crossing/overlap
 */
import { type SATBVoices } from "./types.js";
/** Check all voices are in range */
export declare function checkRange(voices: SATBVoices): boolean;
/** Spacing: S–A ≤ octave (12), A–T ≤ octave, T–B ≤ twelfth (19) */
export declare function checkSpacing(voices: SATBVoices): boolean;
/** No voice crossing: S ≥ A ≥ T ≥ B */
export declare function checkVoiceOrder(voices: SATBVoices): boolean;
/** Parallel fifths between prev and curr */
export declare function hasParallelFifth(prev: SATBVoices, curr: SATBVoices): boolean;
/** Parallel octaves/unisons between prev and curr */
export declare function hasParallelOctave(prev: SATBVoices, curr: SATBVoices): boolean;
/** Voice overlap: lower voice moves above prior upper-voice note */
export declare function hasVoiceOverlap(prev: SATBVoices, curr: SATBVoices): boolean;
/** All constraints for a single chord (no prev) */
export declare function checkChordConstraints(voices: SATBVoices): boolean;
/**
 * All constraints including voice-leading from prev.
 * Validation ordering (HFLitReview): run hard checks first, short-circuit before soft.
 * Order: (1) intra-chord range/spacing/order, (2) parallel fifths, (3) parallel octaves, (4) voice overlap.
 */
export declare function checkVoiceLeading(prev: SATBVoices | null, curr: SATBVoices): boolean;
/** Relaxed voice-leading: allow parallel fifths/octaves, only check range and order */
export declare function checkVoiceLeadingRelaxed(prev: SATBVoices | null, curr: SATBVoices): boolean;
