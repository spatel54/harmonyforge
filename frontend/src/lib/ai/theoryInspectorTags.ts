import { parseIntentBlock, type ParsedIntentResult } from "@/lib/ai/intentRouter";

export const TAGS_START = "<<<TAGS>>>";
export const TAGS_END = "<<<END_TAGS>>>";

/** Hardcoded chat starter prompts (Phase 1.4) — label equals sent text. */
export const CHAT_SEED_TAG_PROMPTS = [
  "Why this note?",
  "Check my voice leading",
  "Suggest a passing chord",
  "What else fits here?",
  "Show voice motion",
] as const;

const SEED_SET = new Set<string>(CHAT_SEED_TAG_PROMPTS);

export function isChatSeedTag(tag: string): boolean {
  return SEED_SET.has(tag);
}

/** Remove an incomplete <<<TAGS>>> block from streaming text so it never flashes in the UI. */
export function stripPartialTagsForDisplay(text: string): string {
  const start = text.indexOf(TAGS_START);
  if (start < 0) return text;
  return text.slice(0, start).trimEnd();
}

export function parseTagsBlock(text: string): { tags: string[]; cleaned: string } {
  const start = text.indexOf(TAGS_START);
  if (start < 0) return { tags: [], cleaned: text };
  const end = text.indexOf(TAGS_END, start);
  if (end < 0) return { tags: [], cleaned: stripPartialTagsForDisplay(text) };

  const jsonSlice = text.slice(start + TAGS_START.length, end).trim();
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(jsonSlice) as unknown;
    if (Array.isArray(parsed)) {
      tags = parsed
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } catch {
    tags = [];
  }

  const cleaned = `${text.slice(0, start)}${text.slice(end + TAGS_END.length)}`
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { tags, cleaned };
}

/** After streaming: extract tags, then intent, for final message body. */
export function parseTagsThenIntent(text: string): {
  tags: string[];
  intent: ParsedIntentResult["intent"];
  cleaned: string;
} {
  const { tags, cleaned: noTags } = parseTagsBlock(text);
  const { intent, cleaned } = parseIntentBlock(noTags);
  return { tags, intent, cleaned };
}

const MAX_DYNAMIC_TAGS = 3; // 5 seeds + 3 AI = 8 total cap

/**
 * Merge new AI tags: dedupe, ignore seeds, cap dynamic count, drop oldest first.
 */
export function mergeAiChatTags(prev: string[], incoming: string[]): string[] {
  const next = prev.filter((t) => !SEED_SET.has(t));
  for (const t of incoming) {
    if (SEED_SET.has(t)) continue;
    const s = t.trim();
    if (!s) continue;
    if (!next.includes(s)) next.push(s);
  }
  while (next.length > MAX_DYNAMIC_TAGS) next.shift();
  return next;
}
