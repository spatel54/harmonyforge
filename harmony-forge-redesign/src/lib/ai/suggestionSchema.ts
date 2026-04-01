/**
 * Zod schema for LLM structured output — Stylist corrections.
 * Used with LangChain's withStructuredOutput() to validate
 * the LLM's response shape.
 */

import { z } from "zod";

export const correctionSchema = z.object({
  noteId: z
    .string()
    .describe("The ID of the note to correct, from the provided score context"),
  suggestedPitch: z
    .string()
    .describe("The suggested pitch in scientific notation, e.g. 'A4', 'F#3'"),
  suggestedDuration: z
    .string()
    .nullable()
    .describe("New duration if changing it ('w', 'h', 'q', '8', '16', '32'), or null to keep current"),
  ruleLabel: z
    .string()
    .describe("Short label for the rule being applied, e.g. 'Parallel 5th resolution'"),
  rationale: z
    .string()
    .describe("1-2 sentence explanation of why this correction resolves the violation"),
});

export const suggestResponseSchema = z.object({
  corrections: z
    .array(correctionSchema)
    .describe("List of note corrections to resolve the violation"),
  summary: z
    .string()
    .describe("Overall explanation of the suggested corrections"),
});

export type SuggestResponse = z.infer<typeof suggestResponseSchema>;
