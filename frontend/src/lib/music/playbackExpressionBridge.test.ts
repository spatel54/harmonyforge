import { describe, expect, it } from "vitest";
import type { EditableScore } from "./scoreTypes";
import {
  getLivePlaybackBpm,
  getPlaybackScheduleGeneration,
  installPlaybackExpressionBridge,
  syncPlaybackExpressionCache,
} from "./playbackExpressionBridge";
import type { RemapPlaybackTimelineEvent } from "./playbackTempoMap";

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
    expect(g.__HF_LOOKUP_PLAYBACK_VELOCITY?.("C4", 0)).toBe(120);
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

  it("matches RiffScore letter+octave pitch and measure/quant", () => {
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
              timeSignature: "4/4",
              notes: [
                { id: "n1", pitch: "C#4", duration: "q", dynamics: "p" },
                { id: "n2", pitch: "D4", duration: "q", dynamics: "f" },
              ],
            },
          ],
        },
      ],
    };
    syncPlaybackExpressionCache(score);
    const g = globalThis as {
      __HF_LOOKUP_PLAYBACK_VELOCITY?: (
        pitch: string,
        timeSec: number,
        measureIndex?: number,
        quant?: number,
      ) => number | undefined;
      __HF_LOOKUP_PLAYBACK_GAIN?: (
        pitch: string,
        timeSec: number,
        measureIndex?: number,
        quant?: number,
      ) => number | undefined;
    };
    expect(g.__HF_LOOKUP_PLAYBACK_VELOCITY?.("C4", 0, 0, 0)).toBe(44);
    expect(g.__HF_LOOKUP_PLAYBACK_VELOCITY?.("D4", 0.5, 0, 16)).toBe(92);
    const pGain = g.__HF_LOOKUP_PLAYBACK_GAIN?.("C4", 0, 0, 0) ?? 0;
    const fGain = g.__HF_LOOKUP_PLAYBACK_GAIN?.("D4", 0.5, 0, 16) ?? 0;
    expect(fGain).toBeGreaterThan(pGain * 1.4);
  });

  it("remaps playback to the live toolbar BPM when score.bpm is unset", () => {
    installPlaybackExpressionBridge();
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
              notes: [{ id: "n1", pitch: "C4", duration: "w" }],
            },
          ],
        },
      ],
    };
    syncPlaybackExpressionCache(score);
    const g = globalThis as {
      __HF_REMAP_PLAYBACK_TIMELINE?: (
        timeline: RemapPlaybackTimelineEvent[],
        assumedBpm: number,
        startTimeOffset: number,
      ) => { timeline: RemapPlaybackTimelineEvent[]; startTimeOffset: number };
      __HF_LOOKUP_PLAYBACK_LOCAL_BPM?: (
        pitch: string,
        timeSec: number,
        measureIndex?: number,
        quant?: number,
      ) => number | undefined;
    };
    const quarterAt80 = 60 / 80;
    const genBefore = getPlaybackScheduleGeneration();
    const remapped = g.__HF_REMAP_PLAYBACK_TIMELINE?.(
      [{ time: 0, duration: quarterAt80 * 4 }],
      80,
      0,
    );
    expect(remapped?.timeline[0]!.duration).toBeCloseTo(quarterAt80 * 4, 5);
    expect(g.__HF_LOOKUP_PLAYBACK_LOCAL_BPM?.("C4", 0, 0, 0)).toBe(80);
    expect(getLivePlaybackBpm(0, 0)).toBe(80);
    expect(getPlaybackScheduleGeneration()).toBe(genBefore + 1);
  });
});
