/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from "vitest";
import {
  clearPendingRiffScorePlayFrom,
  HF_PLAYBACK_PARK_EVENT,
  HF_RIFFSCORE_PAUSE_EVENT,
  parkPlaybackStart,
  pauseRiffScoreTransport,
} from "./riffscorePlaybackBridge";

type G = typeof globalThis & {
  __HF_RIFFSCORE_PLAY_FROM?: { measureIndex: number; quant: number } | null;
};

describe("parkPlaybackStart", () => {
  afterEach(() => {
    clearPendingRiffScorePlayFrom();
  });

  it("stores Play-from without starting audio", () => {
    parkPlaybackStart(2, 16);
    expect((globalThis as G).__HF_RIFFSCORE_PLAY_FROM).toEqual({
      measureIndex: 2,
      quant: 16,
    });
  });

  it("notifies listeners of the parked measure and quant", () => {
    const seen: Array<{ measureIndex: number; quant: number }> = [];
    const onPark = (e: Event) => {
      const detail = (e as CustomEvent<{ measureIndex: number; quant: number }>).detail;
      seen.push(detail);
    };
    window.addEventListener(HF_PLAYBACK_PARK_EVENT, onPark);
    parkPlaybackStart(1, 32);
    window.removeEventListener(HF_PLAYBACK_PARK_EVENT, onPark);
    expect(seen).toEqual([{ measureIndex: 1, quant: 32 }]);
  });
});

describe("pauseRiffScoreTransport", () => {
  it("dispatches a pause event for the patched RiffScore listener", () => {
    let paused = 0;
    const onPause = () => {
      paused += 1;
    };
    window.addEventListener(HF_RIFFSCORE_PAUSE_EVENT, onPause);
    pauseRiffScoreTransport();
    window.removeEventListener(HF_RIFFSCORE_PAUSE_EVENT, onPause);
    expect(paused).toBe(1);
  });
});
