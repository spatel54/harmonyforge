import { describe, expect, it } from "vitest";
import {
  formatBadgeRow,
  measureNotationBadges,
  noteNotationBadges,
} from "./notationOverlayBadges";
import type { Measure, Note } from "./scoreTypes";

describe("noteNotationBadges", () => {
  const note: Note = {
    id: "n1",
    pitch: "C4",
    duration: "q",
    articulations: ["a.", "a>"],
    dynamics: "mf",
    ornament: "trill",
    lyric: "la",
    words: "dolce",
    tuplet: 3,
    lineStart: "8va",
  };

  it("collects above and below badges", () => {
    const { above, below } = noteNotationBadges(note);
    expect(above).toContain("dolce");
    expect(above).toContain("·");
    expect(above).toContain("tr");
    expect(above).toContain("3");
    expect(below).toContain("mf");
    expect(below).toContain("la");
  });
});

describe("measureNotationBadges", () => {
  it("includes tempo and rehearsal marks", () => {
    const measure: Measure = {
      id: "m1",
      notes: [],
      tempoText: "Andante ♩ = 76",
      rehearsalMark: "A",
      repeatMark: "segno",
      barline: "final",
    };
    expect(measureNotationBadges(measure)).toEqual([
      "Andante ♩ = 76",
      "[A]",
      "SEGNO",
      "final",
    ]);
  });
});

describe("formatBadgeRow", () => {
  it("joins non-empty badges", () => {
    expect(formatBadgeRow(["mf", "  ", "p"])).toBe("mf p");
    expect(formatBadgeRow([])).toBeNull();
  });
});
