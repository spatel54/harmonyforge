import {
  ideaActionsArraySchema,
  type IdeaAction,
} from "@/lib/ai/ideaActionSchema";

/** Delimiter the tutor must output on its own line before suggestion bullets. */
export const NOTE_INSIGHT_SUGGESTIONS_DELIM = "<<<SUGGESTIONS>>>";

/** After markdown bullets, optional JSON array of implementable pitch edits. */
export const NOTE_INSIGHT_IDEA_ACTIONS_DELIM = "<<<IDEA_ACTIONS>>>";

function safeParseIdeaActions(jsonPart: string): IdeaAction[] {
  if (!jsonPart.trim()) return [];
  try {
    const data: unknown = JSON.parse(jsonPart);
    const r = ideaActionsArraySchema.safeParse(data);
    return r.success ? r.data : [];
  } catch {
    return [];
  }
}

export function splitNoteInsightAiContent(full: string): {
  explanation: string;
  suggestions: string;
  ideaActions: IdeaAction[];
} {
  const idx = full.indexOf(NOTE_INSIGHT_SUGGESTIONS_DELIM);
  if (idx < 0) {
    return { explanation: full.trim(), suggestions: "", ideaActions: [] };
  }
  const explanation = full.slice(0, idx).trim();
  const afterSuggestions = full
    .slice(idx + NOTE_INSIGHT_SUGGESTIONS_DELIM.length)
    .trim();

  const iaIdx = afterSuggestions.indexOf(NOTE_INSIGHT_IDEA_ACTIONS_DELIM);
  if (iaIdx < 0) {
    return {
      explanation,
      suggestions: afterSuggestions,
      ideaActions: [],
    };
  }

  const suggestionsMarkdown = afterSuggestions.slice(0, iaIdx).trim();
  const jsonPart = afterSuggestions
    .slice(iaIdx + NOTE_INSIGHT_IDEA_ACTIONS_DELIM.length)
    .trim();

  return {
    explanation,
    suggestions: suggestionsMarkdown,
    ideaActions: safeParseIdeaActions(jsonPart),
  };
}
