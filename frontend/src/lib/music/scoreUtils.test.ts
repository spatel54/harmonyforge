/**
 * Tests for scoreUtils manipulation helpers.
 * Focus: deleteNotesAsRests (Iter2 §2) — delete must preserve surrounding
 * durations by swapping selected events for rests of the same length.
 */
import { describe, expect, it } from "vitest";

import { deleteNotesAsRests, normalizeScoreRests } from "./scoreUtils";
import type { EditableScore } from "./scoreTypes";

function makeScore(): EditableScore {
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
              { id: "n2", pitch: "D5", duration: "q", articulations: ["staccato"] },
              { id: "n3", pitch: "E5", duration: "q", tie: "start" },
              { id: "n4", pitch: "F5", duration: "q", dynamics: "mf" },
            ],
          },
        ],
      },
    ],
    divisions: 4,
  };
}

describe("deleteNotesAsRests", () => {
  it("replaces selected notes with same-duration rests", () => {
    const score = makeScore();
    const next = deleteNotesAsRests(score, new Set(["n2"]));
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes.length).toBe(4);
    expect(notes[1]!.isRest).toBe(true);
    expect(notes[1]!.duration).toBe("q");
    // Neighbor durations must not change.
    expect(notes[0]!.duration).toBe("q");
    expect(notes[2]!.duration).toBe("q");
    expect(notes[3]!.duration).toBe("q");
    // Stable note-ids — enables undo + suggestion rollback paths.
    expect(notes.map((n) => n.id)).toEqual(["n1", "n2", "n3", "n4"]);
  });

  it("strips articulation/dynamic/tie metadata on converted rests", () => {
    const score = makeScore();
    const next = deleteNotesAsRests(score, new Set(["n2", "n3", "n4"]));
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes[1]!.articulations).toBeUndefined();
    expect(notes[2]!.tie).toBeUndefined();
    expect(notes[3]!.dynamics).toBeUndefined();
  });

  it("no-ops when the id set is empty", () => {
    const score = makeScore();
    const next = deleteNotesAsRests(score, new Set());
    expect(next).toBe(score);
  });

  it("normalizeScoreRests keeps rest fillers aligned to beat boundaries after 8+16", () => {
    const scoreWith816: EditableScore = {
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
                { id: "a", pitch: "C5", duration: "q" },
                { id: "b", pitch: "D5", duration: "q" },
                { id: "c", pitch: "E5", duration: "8" },
                { id: "d", pitch: "F5", duration: "16" },
              ],
            },
          ],
        },
      ],
      divisions: 4,
    };
    const normalized = normalizeScoreRests(scoreWith816);
    const notes = normalized.parts[0]!.measures[0]!.notes;
    // Sum of real note beats: 1 + 1 + 0.5 + 0.25 = 2.75. Remainder = 1.25 beats.
    // Beat-aware fill must NOT start the filler with a single quarter rest
    // that crosses beat 3 → beat 4; it should place a 16th first (to complete
    // beat 3), then a full-quarter rest for beat 4, in that order.
    const firstFiller = notes[4];
    const secondFiller = notes[5];
    expect(firstFiller?.isRest).toBe(true);
    expect(firstFiller?.duration).toBe("16");
    expect(secondFiller?.isRest).toBe(true);
    expect(secondFiller?.duration).toBe("q");
  });

  it("downstream normalize does not truncate the converted rest", () => {
    const score = makeScore();
    const next = deleteNotesAsRests(score, new Set(["n1", "n4"]));
    const normalized = normalizeScoreRests(next);
    const notes = normalized.parts[0]!.measures[0]!.notes;
    // Four quarter events remain (two original, two now-rest).
    expect(notes.length).toBeGreaterThanOrEqual(4);
    expect(notes[0]!.isRest).toBe(true);
    expect(notes[0]!.duration).toBe("q");
  });
});
