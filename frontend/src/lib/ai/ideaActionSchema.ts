/**
 * Zod schema for optional <<<IDEA_ACTIONS>>> JSON from the note-insight tutor.
 * Parsed client-side from streamed text (not structured LLM output).
 */

import { z } from "zod";

const scientificPitch = z
  .string()
  .regex(
    /^[A-G](#|b)?\d+$/,
    "Scientific pitch like A4, F#3, Bb2",
  );

export const ideaActionItemSchema = z.object({
  id: z.string().min(1).max(64),
  noteId: z.string().min(1),
  suggestedPitch: scientificPitch,
  summary: z.string().min(1).max(280),
});

export const ideaActionsArraySchema = z.array(ideaActionItemSchema).max(8);

export type IdeaAction = z.infer<typeof ideaActionItemSchema>;
