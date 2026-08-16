import { describe, expect, it } from "vitest";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { applyPaletteScoreOp, applyPalettePromptResult } from "@/lib/sandbox/paletteToolScoreOps";
import {
  applyTupletGroup,
  toggleArticulation,
  toggleDynamicOnAnchor,
  toggleLineOnSelection,
  noteBeats,
} from "@/lib/music/scoreUtils";

function miniScore(): EditableScore {
  return {
    parts: [
      {
        id: "p1",
        name: "Melody",
        clef: "treble",
        measures: [
          {
            id: "m1",
            timeSignature: "4/4",
            notes: [
              { id: "n1", pitch: "C5", duration: "q" },
              { id: "n2", pitch: "D5", duration: "q" },
              { id: "n3", pitch: "E5", duration: "q" },
              { id: "n4", pitch: "F5", duration: "q" },
            ],
          },
        ],
      },
    ],
    divisions: 4,
  };
}

describe("toggleArticulation", () => {
  it("toggles staccato on and off", () => {
    const score = miniScore();
    const ids = new Set(["n1"]);
    const once = toggleArticulation(score, ids, "a.");
    expect(once.parts[0]!.measures[0]!.notes[0]!.articulations).toContain("a.");
    const twice = toggleArticulation(once, ids, "a.");
    expect(twice.parts[0]!.measures[0]!.notes[0]!.articulations).toBeUndefined();
  });
});

describe("toggleDynamicOnAnchor", () => {
  it("sets dynamic on first selected note only", () => {
    const score = miniScore();
    const ids = new Set(["n1", "n2"]);
    const next = toggleDynamicOnAnchor(score, ids, "mf");
    expect(next.parts[0]!.measures[0]!.notes[0]!.dynamics).toBe("mf");
    expect(next.parts[0]!.measures[0]!.notes[1]!.dynamics).toBeUndefined();
  });
});

describe("applyPaletteScoreOp", () => {
  it("toggles artic-staccato", () => {
    const score = miniScore();
    const result = applyPaletteScoreOp("artic-staccato", {
      score,
      noteIds: new Set(["n2"]),
      measureIndex: 0,
    });
    expect(result?.kind).toBe("score");
    if (result?.kind === "score") {
      expect(result.score.parts[0]!.measures[0]!.notes[1]!.articulations).toContain("a.");
    }
  });

  it("returns prompt for custom tempo", () => {
    const score = miniScore();
    const result = applyPaletteScoreOp("tempo-preset-custom", {
      score,
      noteIds: new Set(),
      measureIndex: 0,
    });
    expect(result).toEqual({ kind: "prompt", promptKind: "tempo" });
  });
});

describe("applyTupletGroup", () => {
  it("splits one quarter into triplet eighths", () => {
    const score = miniScore();
    const next = applyTupletGroup(score, new Set(["n1"]), 3);
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes.length).toBeGreaterThan(3);
    const tripletNotes = notes.filter((n) => n.tuplet === 3);
    expect(tripletNotes.length).toBe(3);
    const total = tripletNotes.reduce((s, n) => s + noteBeats(n), 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("tags two selected quarters as a 3:2 group without crashing RS mapping", () => {
    const score = miniScore();
    const next = applyTupletGroup(score, new Set(["n1", "n2"]), 3);
    expect(next.parts[0]!.measures[0]!.notes[0]!.tuplet).toBe(3);
    expect(next.parts[0]!.measures[0]!.notes[1]!.tuplet).toBe(3);
  });
});

describe("toggleLineOnSelection", () => {
  it("spans slur across selection and clears on re-toggle", () => {
    const score = miniScore();
    const ids = new Set(["n1", "n2"]);
    const once = toggleLineOnSelection(score, ids, "slur");
    expect(once.parts[0]!.measures[0]!.notes[0]!.lineStart).toBe("slur");
    expect(once.parts[0]!.measures[0]!.notes[1]!.lineEnd).toBe("slur");
    const twice = toggleLineOnSelection(once, ids, "slur");
    expect(twice.parts[0]!.measures[0]!.notes[0]!.lineStart).toBeUndefined();
  });
});

describe("applyPalettePromptResult", () => {
  it("sets lyric text", () => {
    const score = miniScore();
    const next = applyPalettePromptResult("lyrics", "la", {
      score,
      noteIds: new Set(["n1"]),
      measureIndex: 0,
    });
    expect(next?.parts[0]!.measures[0]!.notes[0]!.lyric).toBe("la");
  });
});
