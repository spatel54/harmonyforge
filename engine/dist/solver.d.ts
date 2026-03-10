/**
 * HarmonyForge Logic Core — Backtracking SATB constraint solver
 */
import type { LeadSheet, SATBVoices, Genre } from "./types.js";
export interface SolverResult {
    slots: Array<{
        chord: {
            roman: string;
            duration?: string;
            beat?: number;
        };
        voices: SATBVoices;
    }>;
}
/** Options for generation: genre affects voice-leading strictness (classical=strict, jazz/pop=relaxed) */
export interface GenerateSATBOptions {
    genre?: Genre;
}
/** Main entry: generate SATB from lead sheet */
export declare function generateSATB(leadSheet: LeadSheet, options?: GenerateSATBOptions): SolverResult | null;
