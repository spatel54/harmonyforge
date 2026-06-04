import { describe, expect, it, beforeEach } from "vitest";
import {
  clearHfPlaybackPosition,
  getHfPlaybackPositionTick,
  installPlaybackPositionBridge,
} from "./playbackPositionBridge";

describe("playbackPositionBridge", () => {
  beforeEach(() => {
    installPlaybackPositionBridge();
    clearHfPlaybackPosition();
  });

  it("stores the latest playback segment tick", () => {
    const g = globalThis as {
      __HF_ON_PLAYBACK_POSITION?: (
        m: number,
        q: number,
        d: number,
      ) => void;
    };
    g.__HF_ON_PLAYBACK_POSITION?.(1, 16, 0.5);
    const tick = getHfPlaybackPositionTick();
    expect(tick).toMatchObject({
      measureIndex: 1,
      quant: 16,
      durationSec: 0.5,
    });
    expect(tick?.at).toBeGreaterThan(0);
  });

  it("clears tick on clear", () => {
    const g = globalThis as {
      __HF_ON_PLAYBACK_POSITION?: (
        m: number,
        q: number,
        d: number,
      ) => void;
    };
    g.__HF_ON_PLAYBACK_POSITION?.(0, 0, 1);
    clearHfPlaybackPosition();
    expect(getHfPlaybackPositionTick()).toBeNull();
  });
});
