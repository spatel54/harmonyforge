import { describe, expect, it } from "vitest";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { applyPaletteScoreOp, applyPalettePromptResult } from "@/lib/sandbox/paletteToolScoreOps";
import { PALETTE_SECTIONS } from "@/lib/palettes/paletteRegistry";
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

  it("toggles a tempo preset off when clicked again", () => {
    const score = miniScore();
    const once = applyPaletteScoreOp("tempo-preset-adagio", {
      score,
      noteIds: new Set(["n1"]),
      measureIndex: 0,
    });
    expect(once?.kind).toBe("score");
    if (once?.kind !== "score") return;
    expect(once.score.bpm).toBe(66);
    expect(once.score.parts[0]!.measures[0]!.tempoText).toContain("Adagio");

    const twice = applyPaletteScoreOp("tempo-preset-adagio", {
      score: once.score,
      noteIds: new Set(["n1"]),
      measureIndex: 0,
    });
    expect(twice?.kind).toBe("score");
    if (twice?.kind !== "score") return;
    expect(twice.score.parts[0]!.measures[0]!.tempoText).toBeUndefined();
    expect(twice.score.bpm).toBeUndefined();
  });

  it("keeps later-bar tempo local so earlier bars stay at the starting speed", () => {
    const score: EditableScore = {
      ...miniScore(),
      parts: [
        {
          ...miniScore().parts[0]!,
          measures: [
            miniScore().parts[0]!.measures[0]!,
            {
              id: "m2",
              timeSignature: "4/4",
              notes: [{ id: "n5", pitch: "G5", duration: "q" }],
            },
          ],
        },
      ],
    };
    const result = applyPaletteScoreOp("tempo-preset-allegro", {
      score,
      noteIds: new Set(),
      measureIndex: 1,
    });
    expect(result?.kind).toBe("score");
    if (result?.kind !== "score") return;
    expect(result.score.bpm).toBeUndefined();
    expect(result.score.parts[0]!.measures[1]!.tempoBpm).toBe(132);
    expect(result.score.parts[0]!.measures[0]!.tempoBpm).toBeUndefined();
  });

  it("toggles a repeat mark off when clicked again", () => {
    const score = miniScore();
    const once = applyPaletteScoreOp("measure-repeat-segno", {
      score,
      noteIds: new Set(),
      measureIndex: 0,
    });
    expect(once?.kind).toBe("score");
    if (once?.kind !== "score") return;
    expect(once.score.parts[0]!.measures[0]!.repeatMark).toBe("segno");

    const twice = applyPaletteScoreOp("measure-repeat-segno", {
      score: once.score,
      noteIds: new Set(),
      measureIndex: 0,
    });
    expect(twice?.kind).toBe("score");
    if (twice?.kind !== "score") return;
    expect(twice.score.parts[0]!.measures[0]!.repeatMark).toBeUndefined();
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

  it("handles every palette tool via score op or a known sandbox page path", () => {
    const score = miniScore();
    const pageOwned = new Set([
      "insert-rest",
      "duration-whole",
      "duration-half",
      "duration-quarter",
      "duration-eighth",
      "duration-16th",
      "duration-32nd",
      "duration-dotted",
      "duration-tie",
      "mode-repitch",
      "measure-insert-before",
      "measure-insert-after",
      "measure-delete",
      "measure-clef-treble",
      "measure-clef-bass",
      "measure-clef-alto",
      "measure-clef-tenor",
      "pitch-accidental-sharp",
      "pitch-accidental-flat",
      "pitch-accidental-natural",
      "pitch-accidental-dsharp",
      "pitch-accidental-dflat",
    ]);
    const missing: string[] = [];
    for (const section of PALETTE_SECTIONS) {
      for (const item of section.items) {
        if (pageOwned.has(item.toolId)) continue;
        const result = applyPaletteScoreOp(item.toolId, {
          score,
          noteIds: new Set(["n1", "n2"]),
          measureIndex: 0,
        });
        if (result == null) missing.push(item.toolId);
      }
    }
    expect(missing).toEqual([]);
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
