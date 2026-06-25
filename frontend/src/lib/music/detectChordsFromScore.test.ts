import { describe, expect, it } from "vitest";
import type { EditableScore } from "./scoreTypes";
import { detectChordsFromScore } from "./detectChordsFromScore";

const measure = {
  id: "m1",
  notes: [
    { id: "n1", pitch: "C4", duration: "q" as const },
    { id: "n2", pitch: "E4", duration: "q" as const },
    { id: "n3", pitch: "G4", duration: "q" as const },
    { id: "n4", pitch: "C4", duration: "q" as const },
  ],
  timeSignature: "4/4",
  keySignature: 0,
};

describe("detectChordsFromScore", () => {
  it("returns empty when only one part", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [{ id: "P1", name: "M", clef: "treble", measures: [measure] }],
    };
    expect(detectChordsFromScore(score)).toEqual([]);
  });

  it("skips when fewer than two harmony staves sound together", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        { id: "P1", name: "M", clef: "treble", measures: [{ ...measure, notes: [{ id: "n1", pitch: "C5", duration: "w" as const }] }] },
        { id: "P2", name: "H", clef: "bass", measures: [{ ...measure, notes: [{ id: "n2", pitch: "G3", duration: "w" as const }] }] },
      ],
    };
    expect(detectChordsFromScore(score)).toEqual([]);
  });

  it("detects C major at onset for three-part CEG stack", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        { id: "P1", name: "S", clef: "treble", measures: [{ ...measure, notes: [{ id: "n1", pitch: "C5", duration: "w" as const }] }] },
        { id: "P2", name: "A", clef: "treble", measures: [{ ...measure, notes: [{ id: "n2", pitch: "E4", duration: "w" as const }] }] },
        { id: "P3", name: "B", clef: "bass", measures: [{ ...measure, notes: [{ id: "n3", pitch: "G3", duration: "w" as const }] }] },
      ],
    };
    const chords = detectChordsFromScore(score);
    expect(chords.length).toBeGreaterThan(0);
    expect(chords[0]?.symbol).toBe("C");
    expect(chords[0]?.quant).toBe(0);
  });

  it("places a chord on every measure downbeat across two bars", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "P1",
          name: "S",
          clef: "treble",
          measures: [
            { ...measure, notes: [{ id: "n1", pitch: "C5", duration: "w" as const }] },
            { ...measure, notes: [{ id: "n2", pitch: "D5", duration: "w" as const }] },
          ],
        },
        {
          id: "P2",
          name: "A",
          clef: "treble",
          measures: [
            { ...measure, notes: [{ id: "n3", pitch: "E4", duration: "w" as const }] },
            { ...measure, notes: [{ id: "n4", pitch: "F4", duration: "w" as const }] },
          ],
        },
        {
          id: "P3",
          name: "B",
          clef: "bass",
          measures: [
            { ...measure, notes: [{ id: "n5", pitch: "G3", duration: "w" as const }] },
            { ...measure, notes: [{ id: "n6", pitch: "A3", duration: "w" as const }] },
          ],
        },
      ],
    };
    const chords = detectChordsFromScore(score);
    const downbeatQuants = [0, 64];
    for (const q of downbeatQuants) {
      expect(chords.some((c) => c.quant === q)).toBe(true);
    }
  });
});
