import { describe, expect, it } from "vitest";
import {
  buildStaffAnchorYs,
  pitchFromStaffGeometry,
} from "./staffPreviewPitch";

describe("buildStaffAnchorYs", () => {
  it("builds nine Y anchors from five lines", () => {
    const lines = [10, 18, 26, 34, 42];
    const ys = buildStaffAnchorYs(lines);
    expect(ys).toHaveLength(9);
    expect(ys[0]).toBe(10);
    expect(ys[1]).toBe(14);
    expect(ys[8]).toBe(42);
  });
});

describe("pitchFromStaffGeometry", () => {
  it("maps treble staff center Y to nearest diatonic pitch", () => {
    const lines = [10, 18, 26, 34, 42];
    expect(pitchFromStaffGeometry("treble", lines, 14)).toBe("E5");
    expect(pitchFromStaffGeometry("treble", lines, 10)).toBe("F5");
    expect(pitchFromStaffGeometry("treble", lines, 42)).toBe("E4");
  });

  it("accepts bass clef", () => {
    const lines = [0, 8, 16, 24, 32];
    const midFirstSpace = 4;
    expect(pitchFromStaffGeometry("bass", lines, midFirstSpace)).toBe("G3");
  });
});
