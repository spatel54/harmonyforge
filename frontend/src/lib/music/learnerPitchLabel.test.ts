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

  it("preserves double sharp and double flat", () => {
    expect(formatLearnerLetterName("C##4")).toBe("C##");
    expect(formatLearnerLetterName("Ebb5")).toBe("Ebb");
    expect(formatLearnerLetterName("F♯")).toBe("F#");
    expect(formatLearnerLetterName("G♭")).toBe("Gb");
  });

  it("trims whitespace", () => {
    expect(formatLearnerLetterName("  D5  ")).toBe("D");
  });

  it("returns empty for empty input", () => {
    expect(formatLearnerLetterName("")).toBe("");
    expect(formatLearnerLetterName("   ")).toBe("");
  });

  it("parses letter-only and OSMD-style pitch strings", () => {
    expect(formatLearnerLetterName("C")).toBe("C");
    expect(formatLearnerLetterName("F#")).toBe("F#");
    expect(formatLearnerLetterName("G4.")).toBe("G");
    expect(formatLearnerLetterName("weird")).toBe("");
  });
});
