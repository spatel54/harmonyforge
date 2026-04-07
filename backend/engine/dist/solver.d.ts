/**
 * HarmonyForge Logic Core — Backtracking SATB constraint solver
 */
import type { LeadSheet, SATBVoices, Genre } from "./types.js";
export declare class SolverBudgetExceededError extends Error {
    readonly code: "SOLVER_BUDGET_EXCEEDED";
    constructor(message?: string);
}
export declare function resolveSolverMaxNodes(): number;
/** 0 = no wall-clock limit. */
export declare function resolveSolverMaxMs(): number;
export declare function resolveGreedyThreshold(): number;
/** auto: always try greedy first, then backtrack; greedy: same; backtrack|exact: skip greedy. */
export declare function resolveSolverMode(): "auto" | "greedy_first" | "backtrack_only";
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
    /** Override env HF_SOLVER_MAX_NODES for tests. */
    maxNodes?: number;
    /** Override env HF_SOLVER_MAX_MS (0 = no limit). */
    maxMs?: number;
    /** Skip greedy first pass (tests / deterministic backtrack-only). */
    skipGreedy?: boolean;
}
/** Main entry: generate SATB from lead sheet */
export declare function generateSATB(leadSheet: LeadSheet, options?: GenerateSATBOptions): SolverResult | null;
