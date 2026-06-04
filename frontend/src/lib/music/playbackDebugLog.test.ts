import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPlaybackDebugRing,
  hfLogPlayback,
  installPlaybackDebugBridge,
  isPlaybackDebugBridgeInstalled,
} from "./playbackDebugLog";

describe("playbackDebugLog", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no-ops in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    installPlaybackDebugBridge();
    const before = getPlaybackDebugRing().length;
    hfLogPlayback({ message: "test" });
    expect(getPlaybackDebugRing()).toHaveLength(before);
    expect(isPlaybackDebugBridgeInstalled()).toBe(true);
  });

  it("records in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    installPlaybackDebugBridge();
    const before = getPlaybackDebugRing().length;
    hfLogPlayback({ hypothesisId: "A", message: "part schedule" });
    expect(getPlaybackDebugRing().length).toBeGreaterThanOrEqual(before + 1);
  });
});
