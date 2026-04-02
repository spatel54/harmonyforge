/** Delimiter the tutor must output on its own line before suggestion bullets. */
export const NOTE_INSIGHT_SUGGESTIONS_DELIM = "<<<SUGGESTIONS>>>";

export function splitNoteInsightAiContent(full: string): {
  explanation: string;
  suggestions: string;
} {
  const idx = full.indexOf(NOTE_INSIGHT_SUGGESTIONS_DELIM);
  if (idx < 0) {
    return { explanation: full.trim(), suggestions: "" };
  }
  const explanation = full.slice(0, idx).trim();
  const suggestions = full.slice(idx + NOTE_INSIGHT_SUGGESTIONS_DELIM.length).trim();
  return { explanation, suggestions };
}
