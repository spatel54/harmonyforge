import { describe, expect, it } from "vitest";
import {
  formatBadgeRow,
  formatDynamicMark,
  measureNotationBadges,
  noteNotationBadges,
  ORNAMENT_GLYPHS,
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

  it("collects words, ornaments, dynamics, and lyrics without duplicating articulations or engraved lines", () => {
    const { above, below } = noteNotationBadges(note);
    expect(above).toContain("dolce");
    expect(above).toContain("\u{1D196}");
    expect(above).toContain("3");
    expect(above).not.toContain("8va");
    expect(above).not.toContain("\u00B7");
    expect(above).toContain("\u{1D190}\u{1D191}");
    expect(below).not.toContain("mf");
    expect(below).toContain("la");
  });

  it("leaves fermata and breath to the notehead glyph overlay", () => {
    const rest: Note = {
      id: "r1",
      pitch: "B4",
      duration: "q",
      isRest: true,
      articulations: ["fermata", "breath-mark"],
    };
    const { above } = noteNotationBadges(rest);
    expect(above).toEqual([]);
  });
});

describe("measureNotationBadges", () => {
  it("includes tempo, rehearsal, and the segno sign (not the word SEGNO)", () => {
    const measure: Measure = {
      id: "m1",
      notes: [],
      tempoText: "Andante \u2669 = 76",
      rehearsalMark: "A",
      repeatMark: "segno",
      barline: "final",
    };
    expect(measureNotationBadges(measure)).toEqual([
      "Andante \u2669 = 76",
      "[A]",
      "\u{1D10B}",
    ]);
  });

  it("uses the coda sign, not the word CODA", () => {
    const measure: Measure = { id: "m1", notes: [], repeatMark: "coda" };
    expect(measureNotationBadges(measure)).toEqual(["\u{1D10C}"]);
  });

  it("keeps D.C. / D.S. / Fine as conventional words", () => {
    expect(measureNotationBadges({ id: "m1", notes: [], repeatMark: "dc" })).toEqual(["D.C."]);
    expect(measureNotationBadges({ id: "m1", notes: [], repeatMark: "fine" })).toEqual(["Fine"]);
  });
});

describe("ornament and dynamic glyphs", () => {
  it("uses Unicode TR / TURN, not ornament-stroke leftovers", () => {
    expect(ORNAMENT_GLYPHS.trill).toBe("\u{1D196}");
    expect(ORNAMENT_GLYPHS.turn).toBe("\u{1D197}");
    expect(ORNAMENT_GLYPHS.mordent).toBe("\u{1D19D}");
  });

  it("maps p/m/f runs to engraved dynamic letters", () => {
    expect(formatDynamicMark("mf")).toBe("\u{1D190}\u{1D191}");
    expect(formatDynamicMark("cresc.")).toBe("cresc.");
  });
});

describe("formatBadgeRow", () => {
  it("joins non-empty badges", () => {
    expect(formatBadgeRow(["mf", "  ", "p"])).toBe("mf p");
    expect(formatBadgeRow([])).toBeNull();
  });
});
