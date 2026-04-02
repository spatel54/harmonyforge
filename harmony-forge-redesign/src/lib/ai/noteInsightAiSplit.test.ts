import { describe, expect, it } from "vitest";
import {
  NOTE_INSIGHT_SUGGESTIONS_DELIM,
  splitNoteInsightAiContent,
} from "./noteInsightAiSplit";

describe("splitNoteInsightAiContent", () => {
  it("returns full string as explanation when delimiter absent", () => {
    const { explanation, suggestions } = splitNoteInsightAiContent("Hello world.");
    expect(explanation).toBe("Hello world.");
    expect(suggestions).toBe("");
  });

  it("splits on delimiter", () => {
    const raw = `First paragraph.\n\n${NOTE_INSIGHT_SUGGESTIONS_DELIM}\n- Try smoother voice-leading\n- Check spacing`;
    const { explanation, suggestions } = splitNoteInsightAiContent(raw);
    expect(explanation).toBe("First paragraph.");
    expect(suggestions).toBe("- Try smoother voice-leading\n- Check spacing");
  });

  it("trims whitespace", () => {
    const raw = `  A  \n\n${NOTE_INSIGHT_SUGGESTIONS_DELIM}\n  - B  `;
    const { explanation, suggestions } = splitNoteInsightAiContent(raw);
    expect(explanation).toBe("A");
    expect(suggestions).toBe("- B");
  });
});
