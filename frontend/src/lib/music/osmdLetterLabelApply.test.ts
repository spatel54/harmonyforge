import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  nextAnimationFrames,
  waitForElementLayout,
} from "./osmdLetterLabelApply";

describe("waitForElementLayout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves immediately when element has size", async () => {
    const el = document.createElement("div");
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      width: 100,
      height: 200,
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 100,
      bottom: 200,
      toJSON: () => ({}),
    });
    const p = waitForElementLayout(el, 500);
    await vi.runAllTimersAsync();
    await p;
  });
});

describe("nextAnimationFrames", () => {
  it("waits the requested number of frames", async () => {
    let count = 0;
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        count += 1;
        cb(0);
        return count;
      },
    );
    await nextAnimationFrames(2);
    expect(count).toBe(2);
    vi.unstubAllGlobals();
  });
});
