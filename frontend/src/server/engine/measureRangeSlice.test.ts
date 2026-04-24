import { describe, expect, it } from "vitest";
import { sliceParsedScoreToMeasureRange } from "./measureRangeSlice";
import type { ParsedScore } from "./types";

describe("sliceParsedScoreToMeasureRange", () => {
  it("keeps only melody in the inclusive measure span and rebases beats", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, measure: 0, duration: 1 },
        { pitch: "D5", beat: 1, measure: 0, duration: 1 },
        { pitch: "E5", beat: 0, measure: 1, duration: 1 },
        { pitch: "F5", beat: 1, measure: 1, duration: 1 },
      ],
      timeSignature: { beats: 2, beatType: 4 },
      totalMeasures: 2,
      totalBeats: 4,
    };
    const sliced = sliceParsedScoreToMeasureRange(parsed, 1, 1);
    expect(sliced).not.toBeNull();
    expect(sliced!.melody.length).toBe(2);
    expect(sliced!.melody[0]!.beat).toBe(0);
    expect(sliced!.melody[0]!.measure).toBe(0);
    expect(sliced!.totalMeasures).toBe(1);
    expect(sliced!.totalBeats).toBe(2);
  });

  it("returns null when no notes fall in range", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 0, measure: 0, duration: 1 }],
      timeSignature: { beats: 4, beatType: 4 },
      totalMeasures: 1,
      totalBeats: 4,
    };
    expect(sliceParsedScoreToMeasureRange(parsed, 2, 3)).toBeNull();
  });

  it("slices multiple measures and rebases chord beats", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, measure: 0, duration: 1 },
        { pitch: "D5", beat: 4, measure: 1, duration: 1 },
        { pitch: "E5", beat: 8, measure: 2, duration: 1 },
      ],
      chords: [
        { roman: "I", beat: 0 },
        { roman: "IV", beat: 4 },
        { roman: "V", beat: 8 },
      ],
      timeSignature: { beats: 4, beatType: 4 },
      totalMeasures: 3,
      totalBeats: 12,
    };
    const sliced = sliceParsedScoreToMeasureRange(parsed, 0, 1);
    expect(sliced).not.toBeNull();
    expect(sliced!.totalMeasures).toBe(2);
    expect(sliced!.totalBeats).toBe(8);
    expect(sliced!.melody).toHaveLength(2);
    expect(sliced!.chords).toBeDefined();
    expect(sliced!.chords!.map((c) => c.beat)).toEqual([0, 4]);
  });

  it("preserves pickupBeats when range starts at global measure 0", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [{ pitch: "C5", beat: 1, measure: 0, duration: 1 }],
      timeSignature: { beats: 4, beatType: 4 },
      totalMeasures: 2,
      totalBeats: 8,
      pickupBeats: 1,
    };
    const sliced = sliceParsedScoreToMeasureRange(parsed, 0, 0);
    expect(sliced!.pickupBeats).toBe(1);
  });

  it("clears pickupBeats when range starts after measure 0", () => {
    const parsed: ParsedScore = {
      key: { tonic: "C", mode: "major" },
      melody: [
        { pitch: "C5", beat: 0, measure: 0, duration: 1 },
        { pitch: "D5", beat: 0, measure: 1, duration: 1 },
      ],
      timeSignature: { beats: 4, beatType: 4 },
      totalMeasures: 2,
      totalBeats: 8,
      pickupBeats: 1,
    };
    const sliced = sliceParsedScoreToMeasureRange(parsed, 1, 1);
    expect(sliced!.pickupBeats).toBeUndefined();
  });
});
