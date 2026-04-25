/**
 * Types for Grammarly-style inline score suggestions.
 * The Stylist AI returns structured corrections; the frontend renders
 * ghost notes and accept/reject controls.
 */

import type { DurationType } from "./scoreTypes";

/** A single proposed note change from the Stylist AI. */
export interface ScoreCorrection {
  id: string;
  noteId: string;
  partId: string;
  measureIndex: number;
  noteIndex: number;
  originalPitch: string;
  suggestedPitch: string;
  originalDuration?: DurationType;
  suggestedDuration?: DurationType;
  ruleLabel: string;
  rationale: string;
}

/** Proactive harmonic ideas from the Stylist (Iteration 7) — not auto-applied. */
export interface MusicalAlternativeHint {
  shortLabel: string;
  description: string;
}

/** A grouped set of corrections from a single AI request. */
export interface SuggestionBatch {
  id: string;
  corrections: ScoreCorrection[];
  summary: string;
  violationType?: string;
  status: "pending" | "partial" | "resolved";
  createdAt: number;
  /** Optional passing-chord / inversion / quality ideas — display-only unless user acts manually. */
  musicalAlternatives?: MusicalAlternativeHint[];
}

export type CorrectionStatus = "pending" | "accepted" | "rejected";

/** What the LLM returns (before frontend hydration). */
export interface LLMCorrection {
  noteId: string;
  suggestedPitch: string;
  suggestedDuration?: string;
  ruleLabel: string;
  rationale: string;
}
