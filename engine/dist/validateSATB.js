/**
 * HarmonyForge Logic Core — SATB validation and harmony metrics
 * Per HFLitReview: HER (Harmonic Error Rate), parallel fifths/octaves, voice-leading rules.
 * Taxonomy.md §1.6: range, spacing, parallel fifths/octaves, voice crossing/overlap.
 */
import { checkRange, checkSpacing, checkVoiceOrder, hasParallelFifth, hasParallelOctave, hasVoiceOverlap, } from "./constraints.js";
/**
 * Validate a sequence of SATB voices and return violation counts.
 * HER = slotsWithAnyViolation / totalSlots (per HFLitReview: frequency of theoretically invalid notes).
 */
export function validateSATBSequence(slots) {
    const violations = {
        parallelFifths: 0,
        parallelOctaves: 0,
        rangeViolations: 0,
        spacingViolations: 0,
        voiceOrderViolations: 0,
        voiceOverlapViolations: 0,
    };
    let slotsWithViolations = 0;
    for (let i = 0; i < slots.length; i++) {
        const curr = slots[i];
        const prev = i > 0 ? slots[i - 1] : null;
        let slotHasViolation = false;
        if (!checkRange(curr)) {
            violations.rangeViolations++;
            slotHasViolation = true;
        }
        if (!checkSpacing(curr)) {
            violations.spacingViolations++;
            slotHasViolation = true;
        }
        if (!checkVoiceOrder(curr)) {
            violations.voiceOrderViolations++;
            slotHasViolation = true;
        }
        if (prev) {
            if (hasParallelFifth(prev, curr)) {
                violations.parallelFifths++;
                slotHasViolation = true;
            }
            if (hasParallelOctave(prev, curr)) {
                violations.parallelOctaves++;
                slotHasViolation = true;
            }
            if (hasVoiceOverlap(prev, curr)) {
                violations.voiceOverlapViolations++;
                slotHasViolation = true;
            }
        }
        if (slotHasViolation)
            slotsWithViolations++;
    }
    const totalSlots = slots.length;
    const her = totalSlots > 0 ? slotsWithViolations / totalSlots : 0;
    const totalViolations = violations.parallelFifths +
        violations.parallelOctaves +
        violations.rangeViolations +
        violations.spacingViolations +
        violations.voiceOrderViolations +
        violations.voiceOverlapViolations;
    return {
        violations,
        totalSlots,
        her,
        valid: totalViolations === 0,
    };
}
