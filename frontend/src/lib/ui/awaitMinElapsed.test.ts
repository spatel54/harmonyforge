import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { awaitMinElapsedSince } from "./awaitMinElapsed";

describe("awaitMinElapsedSince", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves immediately when minMs already elapsed", async () => {
    const start = Date.now() - 5000;
    await expect(awaitMinElapsedSince(start, 2000)).resolves.toBeUndefined();
  });

  it("waits for the remaining time", async () => {
    const start = Date.now();
    vi.setSystemTime(10_050);
    const p = awaitMinElapsedSince(start, 100);
    await vi.advanceTimersByTimeAsync(50);
    await expect(p).resolves.toBeUndefined();
  });
});
