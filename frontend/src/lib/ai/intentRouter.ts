/**
 * Parse and route `<<<INTENT>>>` JSON blocks emitted by the Theory Inspector.
 *
 * The LLM prompts already instruct the tutor to emit a JSON object describing
 * actions the user asked for that the chat cannot perform directly (mood
 * changes, pickup edits, regenerate, etc.). We parse that block client-side
 * and surface a confirmation bubble — accepting it writes to the generation
 * config store and/or navigates to the right screen.
 */

import { z } from "zod";

export const INTENT_MARKER = "<<<INTENT>>>";

const baseIntent = z.object({
  reason: z.string().max(400).optional(),
});

const setMoodIntent = baseIntent.extend({
  action: z.literal("set_mood"),
  value: z.enum(["major", "minor"]),
});

const setGenreIntent = baseIntent.extend({
  action: z.literal("set_genre"),
  value: z.enum(["classical", "jazz", "pop"]),
});

const setRhythmDensityIntent = baseIntent.extend({
  action: z.literal("set_rhythm_density"),
  value: z.enum(["chordal", "mixed", "flowing"]),
});

const setPickupBeatsIntent = baseIntent.extend({
  action: z.literal("set_pickup_beats"),
  value: z.number().finite().min(0).max(8),
});

const regenerateIntent = baseIntent.extend({
  action: z.literal("regenerate"),
});

const openDocumentIntent = baseIntent.extend({
  action: z.literal("open_document_page"),
});

const openSandboxIntent = baseIntent.extend({
  action: z.literal("open_sandbox_page"),
});

export const intentSchema = z.discriminatedUnion("action", [
  setMoodIntent,
  setGenreIntent,
  setRhythmDensityIntent,
  setPickupBeatsIntent,
  regenerateIntent,
  openDocumentIntent,
  openSandboxIntent,
]);

export type Intent = z.infer<typeof intentSchema>;

export interface ParsedIntentResult {
  intent: Intent | null;
  /** Message body stripped of the INTENT block; safe to render to the user. */
  cleaned: string;
  /** Raw JSON text we tried to parse (for debug output). */
  rawJson?: string;
}

/**
 * Split the streamed tutor reply into its visible body + any INTENT block.
 * The marker can appear anywhere — the block stretches from the marker line
 * to the next blank line or end of string.
 */
export function parseIntentBlock(text: string): ParsedIntentResult {
  if (!text.includes(INTENT_MARKER)) {
    return { intent: null, cleaned: text };
  }
  const idx = text.indexOf(INTENT_MARKER);
  const before = text.slice(0, idx).trimEnd();
  const tail = text.slice(idx + INTENT_MARKER.length);

  // Find first non-blank line after the marker; take JSON until the next
  // blank line or end of string.
  const newlineAfter = tail.indexOf("\n");
  const rest = newlineAfter >= 0 ? tail.slice(newlineAfter + 1) : "";
  const blockEnd = rest.search(/\n\s*\n/);
  const rawJson = (blockEnd >= 0 ? rest.slice(0, blockEnd) : rest).trim();
  const afterBlock = blockEnd >= 0 ? rest.slice(blockEnd) : "";

  const cleaned = `${before}${afterBlock}`.replace(/\n{3,}/g, "\n\n").trim();

  if (!rawJson) return { intent: null, cleaned };

  try {
    const parsed = JSON.parse(rawJson);
    const result = intentSchema.safeParse(parsed);
    if (result.success) {
      return { intent: result.data, cleaned, rawJson };
    }
  } catch {
    // swallow malformed JSON — the chat body still renders
  }
  return { intent: null, cleaned, rawJson };
}

/** Human-readable summary a confirmation bubble can render. */
export function describeIntent(intent: Intent): string {
  switch (intent.action) {
    case "set_mood":
      return `Set mood to ${intent.value}`;
    case "set_genre":
      return `Set genre to ${intent.value}`;
    case "set_rhythm_density":
      return `Set harmony motion to ${intent.value}`;
    case "set_pickup_beats":
      return `Set pickup beats to ${intent.value}`;
    case "regenerate":
      return "Regenerate harmonies with the current settings";
    case "open_document_page":
      return "Go back to the Document page";
    case "open_sandbox_page":
      return "Open the Sandbox editor";
  }
}

export interface IntentApplyHandlers {
  setMood?: (mood: "major" | "minor") => void;
  setGenre?: (genre: "classical" | "jazz" | "pop") => void;
  setRhythmDensity?: (value: "chordal" | "mixed" | "flowing") => void;
  setPickupBeats?: (beats: number) => void;
  regenerate?: () => void;
  navigate?: (path: "/document" | "/sandbox" | "/") => void;
}

/**
 * Execute the parsed intent against provided store setters / router.
 * Returns true if any handler consumed the intent, false otherwise.
 */
export function applyIntent(intent: Intent, handlers: IntentApplyHandlers): boolean {
  switch (intent.action) {
    case "set_mood":
      handlers.setMood?.(intent.value);
      return !!handlers.setMood;
    case "set_genre":
      handlers.setGenre?.(intent.value);
      return !!handlers.setGenre;
    case "set_rhythm_density":
      handlers.setRhythmDensity?.(intent.value);
      return !!handlers.setRhythmDensity;
    case "set_pickup_beats":
      handlers.setPickupBeats?.(intent.value);
      return !!handlers.setPickupBeats;
    case "regenerate":
      handlers.regenerate?.();
      return !!handlers.regenerate;
    case "open_document_page":
      handlers.navigate?.("/document");
      return !!handlers.navigate;
    case "open_sandbox_page":
      handlers.navigate?.("/sandbox");
      return !!handlers.navigate;
  }
}
