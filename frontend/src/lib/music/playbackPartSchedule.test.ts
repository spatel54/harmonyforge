import { describe, expect, it } from "vitest";
import {
  countNonMonotonicPartTimes,
  ensureStrictlyIncreasingPartTimes,
} from "./playbackPartSchedule";

describe("playbackPartSchedule", () => {
  it("offsets simultaneous multi-voice events for Tone.Part", () => {
    const raw = [
      { time: 0, pitch: "C4" },
      { time: 0, pitch: "E4" },
      { time: 0, pitch: "G4" },
      { time: 0.25, pitch: "B4" },
    ];
    expect(countNonMonotonicPartTimes(raw)).toBe(2);
    const fixed = ensureStrictlyIncreasingPartTimes(raw);
    expect(countNonMonotonicPartTimes(fixed)).toBe(0);
    expect(fixed[0]!.time).toBe(0);
    expect(fixed[1]!.time).toBeCloseTo(0.001, 5);
    expect(fixed[2]!.time).toBeCloseTo(0.002, 5);
    expect(fixed[3]!.time).toBe(0.25);
  });
});
