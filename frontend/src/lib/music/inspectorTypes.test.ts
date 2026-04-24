import { describe, expect, it } from "vitest";
import { laySummaryForIssueHighlight } from "./inspectorTypes";

describe("laySummaryForIssueHighlight", () => {
  it("explains parallel fifths in plain language when the voice pair is known", () => {
    const t = laySummaryForIssueHighlight({
      noteId: "n1",
      label: "Parallel fifth",
      severity: "error",
      ruleId: "parallelFifth",
      involvedVoices: ["soprano", "bass"],
    });
    expect(t).toMatch(/soprano/i);
    expect(t).toMatch(/bass/i);
    expect(t).toMatch(/fifth/i);
    expect(t).toMatch(/same direction/i);
  });

  it("falls back to a generic parallel-fifth blurb without voice metadata", () => {
    expect(
      laySummaryForIssueHighlight({
        noteId: "n1",
        label: "Parallel fifth",
        severity: "error",
      }),
    ).toMatch(/parallel fifths/i);
  });

  it("passes through short unknown engine messages", () => {
    expect(
      laySummaryForIssueHighlight({
        noteId: "n1",
        label: "Spacing too wide between alto and tenor",
        severity: "warning",
      }),
    ).toContain("Spacing");
  });
});
