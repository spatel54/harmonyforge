import { describe, expect, it } from "vitest";
import type { EditableScore } from "./scoreTypes";
import {
  installPlaybackExpressionBridge,
  syncPlaybackExpressionCache,
} from "./playbackExpressionBridge";

describe("playbackExpressionBridge", () => {
  it("installs global velocity lookup", () => {
    installPlaybackExpressionBridge();
    const g = globalThis as {
      __HF_LOOKUP_PLAYBACK_VELOCITY?: (pitch: string, timeSec: number) => number | undefined;
    };
    expect(typeof g.__HF_LOOKUP_PLAYBACK_VELOCITY).toBe("function");
  });

  it("syncs piano dynamic velocity for RS play intercept", () => {
    installPlaybackExpressionBridge();
    const score: EditableScore = {
      divisions: 4,
      bpm: 120,
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [{ id: "n1", pitch: "C4", duration: "q", dynamics: "fff" }],
            },
          ],
        },
      ],
    };
    syncPlaybackExpressionCache(score);
    const g = globalThis as {
      __HF_LOOKUP_PLAYBACK_VELOCITY?: (pitch: string, timeSec: number) => number | undefined;
    };
    expect(g.__HF_LOOKUP_PLAYBACK_VELOCITY?.("C4", 0)).toBe(112);
  });

  it("syncs staccato sounding duration in beats for RS play intercept", () => {
    installPlaybackExpressionBridge();
    const score: EditableScore = {
      divisions: 4,
      bpm: 120,
      parts: [
        {
          id: "p1",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [{ id: "n1", pitch: "C4", duration: "q", articulations: ["a."] }],
            },
          ],
        },
      ],
    };
    syncPlaybackExpressionCache(score);
    const g = globalThis as {
      __HF_LOOKUP_PLAYBACK_DURATION?: (pitch: string, timeSec: number) => number | undefined;
    };
    expect(g.__HF_LOOKUP_PLAYBACK_DURATION?.("C4", 0)).toBe(0.5);
  });
});
