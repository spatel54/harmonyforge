import { describe, expect, it } from "vitest";

import { formatLearnerLetterName } from "./learnerPitchLabel";

describe("formatLearnerLetterName", () => {
  it("strips octave for naturals", () => {
    expect(formatLearnerLetterName("C4")).toBe("C");
    expect(formatLearnerLetterName("A0")).toBe("A");
  });

  it("preserves sharp", () => {
    expect(formatLearnerLetterName("F#5")).toBe("F#");
    expect(formatLearnerLetterName("C#6")).toBe("C#");
  });

  it("preserves flat", () => {
    expect(formatLearnerLetterName("Bb3")).toBe("Bb");
    expect(formatLearnerLetterName("Eb4")).toBe("Eb");
  });

  it("trims whitespace", () => {
    expect(formatLearnerLetterName("  D5  ")).toBe("D");
  });

  it("returns empty for empty input", () => {
    expect(formatLearnerLetterName("")).toBe("");
    expect(formatLearnerLetterName("   ")).toBe("");
  });

  it("falls back for non-standard strings", () => {
    expect(formatLearnerLetterName("C")).toBe("C");
    expect(formatLearnerLetterName("F#")).toBe("F#");
    expect(formatLearnerLetterName("weird")).toBe("weird");
  });
});
