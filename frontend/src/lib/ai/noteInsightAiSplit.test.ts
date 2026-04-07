import { describe, expect, it } from "vitest";
import {
  NOTE_INSIGHT_IDEA_ACTIONS_DELIM,
  NOTE_INSIGHT_SUGGESTIONS_DELIM,
  splitNoteInsightAiContent,
} from "./noteInsightAiSplit";

describe("splitNoteInsightAiContent", () => {
  it("returns full string as explanation when delimiter absent", () => {
    const { explanation, suggestions, ideaActions } =
      splitNoteInsightAiContent("Hello world.");
    expect(explanation).toBe("Hello world.");
    expect(suggestions).toBe("");
    expect(ideaActions).toEqual([]);
  });

  it("splits on delimiter", () => {
    const raw = `First paragraph.\n\n${NOTE_INSIGHT_SUGGESTIONS_DELIM}\n- Try smoother voice-leading\n- Check spacing`;
    const { explanation, suggestions, ideaActions } =
      splitNoteInsightAiContent(raw);
    expect(explanation).toBe("First paragraph.");
    expect(suggestions).toBe("- Try smoother voice-leading\n- Check spacing");
    expect(ideaActions).toEqual([]);
  });

  it("trims whitespace", () => {
    const raw = `  A  \n\n${NOTE_INSIGHT_SUGGESTIONS_DELIM}\n  - B  `;
    const { explanation, suggestions, ideaActions } =
      splitNoteInsightAiContent(raw);
    expect(explanation).toBe("A");
    expect(suggestions).toBe("- B");
    expect(ideaActions).toEqual([]);
  });

  it("splits idea actions JSON after suggestions markdown", () => {
    const raw = `Summary.\n\n${NOTE_INSIGHT_SUGGESTIONS_DELIM}\n- Idea one\n\n${NOTE_INSIGHT_IDEA_ACTIONS_DELIM}\n[{"id":"ia1","noteId":"n1","suggestedPitch":"G4","summary":"Move to G4"}]`;
    const { explanation, suggestions, ideaActions } =
      splitNoteInsightAiContent(raw);
    expect(explanation).toBe("Summary.");
    expect(suggestions).toBe("- Idea one");
    expect(ideaActions).toEqual([
      {
        id: "ia1",
        noteId: "n1",
        suggestedPitch: "G4",
        summary: "Move to G4",
      },
    ]);
  });

  it("returns empty ideaActions for invalid JSON", () => {
    const raw = `${NOTE_INSIGHT_SUGGESTIONS_DELIM}\n- x\n\n${NOTE_INSIGHT_IDEA_ACTIONS_DELIM}\nnot json`;
    const { ideaActions } = splitNoteInsightAiContent(raw);
    expect(ideaActions).toEqual([]);
  });
});
