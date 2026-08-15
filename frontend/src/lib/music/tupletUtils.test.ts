import { describe, expect, it } from "vitest";
import { innerDurationForTupletSlot, noteSoundingBeats } from "./tupletUtils";
import type { Note } from "./scoreTypes";

describe("tupletUtils", () => {
  it("maps quarter slot to triplet eighth inner duration", () => {
    expect(innerDurationForTupletSlot(1, 3)).toBe("8");
  });

  it("computes triplet eighth sounding beats", () => {
    const note: Note = { id: "n1", pitch: "C4", duration: "8", tuplet: 3 };
    expect(noteSoundingBeats(note)).toBeCloseTo(1 / 3, 5);
  });
});
