/**
 * HarmonyForge Logic Core — SATB validation and harmony metrics
 * Per HFLitReview: HER (Harmonic Error Rate), parallel fifths/octaves, voice-leading rules.
 * Taxonomy.md §1.6: range, spacing, parallel fifths/octaves, voice crossing/overlap.
 */
import type { SATBVoices } from "./types.js";
export interface ValidationViolations {
    parallelFifths: number;
    parallelOctaves: number;
    rangeViolations: number;
    spacingViolations: number;
    voiceOrderViolations: number;
    voiceOverlapViolations: number;
}
export interface ValidationResult {
    violations: ValidationViolations;
    totalSlots: number;
    /** Harmonic Error Rate: fraction of chord slots with at least one violation (0 = perfect) */
    her: number;
    valid: boolean;
}
type TraceVoiceKey = keyof SATBVoices;
export interface SlotFinding {
    rule: "range" | "spacing" | "voiceOrder" | "parallelFifth" | "parallelOctave" | "voiceOverlap";
    severity: "error" | "warning";
    voices: TraceVoiceKey[];
    message: string;
}
export interface SlotTrace {
    slotIndex: number;
    findings: SlotFinding[];
}
export interface ValidationTraceResult extends ValidationResult {
    trace: SlotTrace[];
}
/**
 * Validate a sequence of SATB voices and return violation counts.
 * HER = slotsWithAnyViolation / totalSlots (per HFLitReview: frequency of theoretically invalid notes).
 */
export declare function validateSATBSequence(slots: SATBVoices[]): ValidationResult;
export declare function validateSATBSequenceWithTrace(slots: SATBVoices[]): ValidationTraceResult;
export {};
