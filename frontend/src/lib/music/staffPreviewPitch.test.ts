import { describe, expect, it } from "vitest";
import {
  buildStaffAnchorYs,
  pitchFromStaffGeometry,
  staffAnchorYForPitch,
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

  it("maps alto (C-clef middle line) so staff vertical center is middle C", () => {
    const lines = [10, 18, 26, 34, 42];
    const midY = (10 + 42) / 2;
    expect(pitchFromStaffGeometry("alto", lines, midY)).toBe("C4");
  });

  it("maps alto clef all nine line/space positions to concert letter names (viola C-clef)", () => {
    const lines = [10, 18, 26, 34, 42];
    const ys = buildStaffAnchorYs([...lines].sort((a, b) => a - b));
    const expectedTopToBottom = ["G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3"];
    expect(ys).toHaveLength(9);
    for (let i = 0; i < 9; i++) {
      expect(pitchFromStaffGeometry("alto", lines, ys[i]!)).toBe(expectedTopToBottom[i]);
    }
  });

  it("maps tenor C clef so line 2 from top (second staff line) is middle C", () => {
    const lines = [10, 18, 26, 34, 42];
    expect(pitchFromStaffGeometry("tenor", lines, 18)).toBe("C4");
  });

  it("maps mezzo-soprano C clef so line 2 from bottom is middle C", () => {
    const lines = [10, 18, 26, 34, 42];
    expect(pitchFromStaffGeometry("mezzo", lines, 34)).toBe("C4");
  });

  it("maps soprano C clef so bottom line is middle C", () => {
    const lines = [10, 18, 26, 34, 42];
    expect(pitchFromStaffGeometry("soprano_c", lines, 42)).toBe("C4");
  });

  it("maps baritone C clef so top line is middle C", () => {
    const lines = [10, 18, 26, 34, 42];
    expect(pitchFromStaffGeometry("baritone_c", lines, 10)).toBe("C4");
  });
});

describe("staffAnchorYForPitch", () => {
  it("inverts treble pitch→Y for staff anchors", () => {
    const lines = [10, 18, 26, 34, 42];
    expect(staffAnchorYForPitch("treble", lines, "E5")).toBe(14);
    expect(staffAnchorYForPitch("treble", lines, "F5")).toBe(10);
    expect(staffAnchorYForPitch("treble", lines, "E4")).toBe(42);
  });

  it("inverts alto clef: middle C on middle line, top/bottom lines match viola C-clef", () => {
    const lines = [10, 18, 26, 34, 42];
    expect(staffAnchorYForPitch("alto", lines, "C4")).toBe(26);
    expect(staffAnchorYForPitch("alto", lines, "G4")).toBe(10);
    expect(staffAnchorYForPitch("alto", lines, "F3")).toBe(42);
  });

  it("returns null when anchor Y would be non-finite", () => {
    const lines = [NaN, 18, 26, 34, 42];
    expect(staffAnchorYForPitch("treble", lines, "F5")).toBeNull();
  });
});
