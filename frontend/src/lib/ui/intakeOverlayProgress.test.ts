import { describe, expect, it } from "vitest";
import { intakeProgressWhileWaiting, isOmrIntakeExtension } from "./intakeOverlayProgress";

describe("intakeOverlayProgress", () => {
  it("detects OMR intake extensions", () => {
    expect(isOmrIntakeExtension("pdf")).toBe(true);
    expect(isOmrIntakeExtension("PNG")).toBe(true);
    expect(isOmrIntakeExtension("xml")).toBe(false);
  });

  it("creeps toward 90% without reaching it quickly for slow OMR", () => {
    expect(intakeProgressWhileWaiting(0, true)).toBe(0);
    expect(intakeProgressWhileWaiting(2_000, true)).toBeLessThan(90);
    expect(intakeProgressWhileWaiting(600_000, true)).toBeLessThanOrEqual(90);
  });

  it("reaches 100 only when caller sets workComplete (cap is 90 while waiting)", () => {
    expect(intakeProgressWhileWaiting(120_000, true)).toBeLessThan(90);
  });
});
