import {
  clampWithRubberband,
  pointerVelocityPxPerSec,
  rubberbandOvershoot,
} from "./gestureMotion";

describe("gestureMotion", () => {
  it("rubberbandOvershoot resists further past the bound", () => {
    expect(rubberbandOvershoot(10, 400)).toBeLessThan(10);
    expect(rubberbandOvershoot(100, 400)).toBeLessThan(rubberbandOvershoot(200, 400));
  });

  it("clampWithRubberband allows slight overshoot below min", () => {
    const v = clampWithRubberband(-20, 0, 100, 400);
    expect(v).toBeLessThan(0);
    expect(v).toBeGreaterThan(-20);
  });

  it("pointerVelocityPxPerSec computes px/s from samples", () => {
    const v = pointerVelocityPxPerSec([
      { x: 0, y: 0, t: 0 },
      { x: 50, y: 0, t: 100 },
    ]);
    expect(v.vx).toBeCloseTo(500);
    expect(v.vy).toBe(0);
  });
});
