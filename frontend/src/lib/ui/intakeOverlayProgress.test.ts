import { describe, expect, it } from "vitest";
import { generateProgressWhileWaiting, intakeProgressWhileWaiting, isOmrIntakeExtension } from "./intakeOverlayProgress";

describe("intakeOverlayProgress", () => {
  it("detects OMR intake extensions", () => {
    expect(isOmrIntakeExtension("pdf")).toBe(true);
    expect(isOmrIntakeExtension("PNG")).toBe(true);
    expect(isOmrIntakeExtension("xml")).toBe(false);
  });

  it("creeps toward 92% without reaching it quickly for slow OMR", () => {
    expect(intakeProgressWhileWaiting(0, true)).toBe(0);
    expect(intakeProgressWhileWaiting(2_000, true)).toBeLessThan(90);
    expect(intakeProgressWhileWaiting(600_000, true)).toBeLessThanOrEqual(92);
  });

  it("climbs through the branded overlay window for fast (non-OMR) intake", () => {
    expect(intakeProgressWhileWaiting(400, false)).toBeGreaterThan(30);
    expect(intakeProgressWhileWaiting(2_000, false)).toBeGreaterThan(80);
    expect(intakeProgressWhileWaiting(2_000, false)).toBeLessThanOrEqual(92);
  });

  it("reaches 100 only when caller sets workComplete (cap is 92 while waiting)", () => {
    expect(intakeProgressWhileWaiting(120_000, true)).toBeLessThan(92);
  });

  it("keeps generating progress moving after the first couple of seconds", () => {
    const early = generateProgressWhileWaiting(2_000);
    const mid = generateProgressWhileWaiting(30_000);
    const late = generateProgressWhileWaiting(90_000);
    expect(early).toBeGreaterThan(30);
    expect(early).toBeLessThan(70);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
    expect(late).toBeLessThanOrEqual(92);
    expect(generateProgressWhileWaiting(600_000)).toBe(92);
  });
});
