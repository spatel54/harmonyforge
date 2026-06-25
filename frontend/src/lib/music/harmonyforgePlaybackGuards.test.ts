import { beforeEach, describe, expect, it } from "vitest";
import { isPlaybackDebugBridgeInstalled } from "./playbackDebugLog";
import { isPlaybackMetronomeBridgeInstalled } from "./playbackMetronome";
import { isPlaybackPartScheduleBridgeInstalled } from "./playbackPartSchedule";
import { isPlaybackPositionBridgeInstalled } from "./playbackPositionBridge";

type G = typeof globalThis & {
  __HF_DISABLE_CHORD_PLAYBACK?: boolean;
};

describe("harmonyforgePlaybackGuards (side-effect import)", () => {
  beforeEach(async () => {
    await import("./harmonyforgePlaybackGuards");
  });

  it("installs all RiffScore global bridges", () => {
    expect(isPlaybackMetronomeBridgeInstalled()).toBe(true);
    expect(isPlaybackPositionBridgeInstalled()).toBe(true);
    expect(isPlaybackDebugBridgeInstalled()).toBe(true);
    expect(isPlaybackPartScheduleBridgeInstalled()).toBe(true);
    expect((globalThis as G).__HF_DISABLE_CHORD_PLAYBACK).toBe(true);
  });
});
