/**
 * Tests for scoreUtils manipulation helpers.
 * Focus: deleteNotesAsRests (Iter2 §2) — delete must preserve surrounding
 * durations by swapping selected events for rests of the same length.
 */
import { describe, expect, it } from "vitest";

import {
  convertRestToPitch,
  deleteNotesAsRests,
  normalizeScoreRests,
  restsToNotes,
  setPitchByLetter,
  transposeNotes,
} from "./scoreUtils";
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

describe("restsToNotes (MuseScore repitch)", () => {
  function makeRestScore(): EditableScore {
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
                {
                  id: "n2",
                  pitch: "B4",
                  duration: "h",
                  isRest: true,
                  articulations: ["staccato"],
                  dynamics: "mf",
                  tie: "start",
                },
                { id: "n3", pitch: "E5", duration: "q" },
              ],
            },
          ],
        },
      ],
      divisions: 4,
    };
  }

  it("converts a rest into a note at the same duration", () => {
    const score = makeRestScore();
    const next = restsToNotes(score, new Set(["n2"]), "G");
    const notes = next.parts[0]!.measures[0]!.notes;
    expect(notes[1]!.isRest).toBeFalsy();
    expect(notes[1]!.duration).toBe("h");
    expect(notes[1]!.pitch).toMatch(/^G\d$/);
  });

  it("inherits octave from nearest pitched neighbor", () => {
    const score = makeRestScore();
    const next = restsToNotes(score, new Set(["n2"]), "D");
    const notes = next.parts[0]!.measures[0]!.notes;
    // Neighbors live in octave 5 (C5, E5) → D should resolve to D5 not D4.
    expect(notes[1]!.pitch).toBe("D5");
  });

  it("strips rest metadata (tie/articulation/dynamics) on conversion", () => {
    const score = makeRestScore();
    const next = restsToNotes(score, new Set(["n2"]), "A");
    const note = next.parts[0]!.measures[0]!.notes[1]!;
    expect(note.articulations).toBeUndefined();
    expect(note.dynamics).toBeUndefined();
    expect(note.tie).toBeUndefined();
  });

  it("keeps an empty-measure rest at its declared duration", () => {
    const score: EditableScore = {
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "bass",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [{ id: "r1", pitch: "B4", duration: "w", isRest: true }],
            },
          ],
        },
      ],
      divisions: 4,
    };
    const next = restsToNotes(score, new Set(["r1"]), "F");
    const note = next.parts[0]!.measures[0]!.notes[0]!;
    expect(note.duration).toBe("w");
    expect(note.isRest).toBeFalsy();
    // Bass clef default octave (D3) → F3.
    expect(note.pitch).toBe("F3");
  });

  it("no-ops on empty id set", () => {
    const score = makeRestScore();
    expect(restsToNotes(score, new Set(), "C")).toBe(score);
  });

  it("setPitchByLetter repitches selected rests as notes", () => {
    const score = makeRestScore();
    const next = setPitchByLetter(score, new Set(["n2"]), "F");
    const note = next.parts[0]!.measures[0]!.notes[1]!;
    expect(note.isRest).toBeFalsy();
    expect(note.duration).toBe("h");
    expect(note.pitch).toMatch(/^F\d$/);
  });

  it("transposeNotes converts a rest before transposing", () => {
    const score = makeRestScore();
    const next = transposeNotes(score, new Set(["n2"]), 1);
    const note = next.parts[0]!.measures[0]!.notes[1]!;
    expect(note.isRest).toBeFalsy();
    expect(note.duration).toBe("h");
  });

  it("convertRestToPitch applies an explicit pitch at the same duration", () => {
    const score = makeRestScore();
    const next = convertRestToPitch(score, "n2", "A3");
    const note = next.parts[0]!.measures[0]!.notes[1]!;
    expect(note.isRest).toBeFalsy();
    expect(note.pitch).toBe("A3");
    expect(note.duration).toBe("h");
  });
});
