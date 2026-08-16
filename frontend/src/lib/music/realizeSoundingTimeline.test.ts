import { describe, expect, it } from "vitest";
import type { EditableScore } from "./scoreTypes";
import { realizeSoundingTimeline } from "./realizeSoundingTimeline";

function miniScore(notes: EditableScore["parts"][0]["measures"][0]["notes"]): EditableScore {
  return {
    divisions: 4,
    parts: [
      {
        id: "p1",
        name: "Melody",
        clef: "treble",
        measures: [{ id: "m1", timeSignature: "4/4", notes }],
      },
    ],
  };
}

describe("realizeSoundingTimeline", () => {
  it("applies dynamic velocity carry-forward", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", dynamics: "p" },
      { id: "n2", pitch: "D4", duration: "q" },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[0]?.velocity).toBe(52);
    expect(events[1]?.velocity).toBe(52);
  });

  it("shortens staccato notes", () => {
    const score = miniScore([
      { id: "n1", pitch: "C4", duration: "q", articulations: ["a."] },
    ]);
    const events = realizeSoundingTimeline(score);
    expect(events[0]?.durationBeats).toBeCloseTo(0.5, 5);
  });

  it("expands D.C. al Fine", () => {
    const score: EditableScore = {
      divisions: 4,
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              timeSignature: "4/4",
              notes: [{ id: "n1", pitch: "C4", duration: "q" }],
            },
            {
              id: "m2",
              timeSignature: "4/4",
              repeatMark: "dc",
              notes: [{ id: "n2", pitch: "D4", duration: "q" }],
            },
            {
              id: "m3",
              timeSignature: "4/4",
              repeatMark: "fine",
              notes: [{ id: "n3", pitch: "E4", duration: "q" }],
            },
          ],
        },
      ],
    };
    const events = realizeSoundingTimeline(score);
    const pitches = events.map((e) => e.pitch);
    expect(pitches).toEqual(["C4", "D4", "C4", "D4"]);
  });
});
