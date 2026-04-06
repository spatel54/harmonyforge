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

/** A grouped set of corrections from a single AI request. */
export interface SuggestionBatch {
  id: string;
  corrections: ScoreCorrection[];
  summary: string;
  violationType?: string;
  status: "pending" | "partial" | "resolved";
  createdAt: number;
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
