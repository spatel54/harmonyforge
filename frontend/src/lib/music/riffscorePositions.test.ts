import { describe, expect, it } from "vitest";
import {
  findTopmostNotePositionAt,
  selectMainStaffFiveLineYsFromClusters,
  type StaffHorizLineCluster,
} from "./riffscorePositions";

function clustersFromYsAndWidths(rows: Array<{ y: number; w: number }>): StaffHorizLineCluster[] {
  return rows.map((r) => ({ y: r.y, maxWidth: r.w }));
}

describe("selectMainStaffFiveLineYsFromClusters", () => {
  it("ignores a short ledger line above the staff when widths differ", () => {
    const clusters = clustersFromYsAndWidths([
      { y: 92, w: 40 },
      { y: 100, w: 200 },
      { y: 108, w: 200 },
      { y: 116, w: 200 },
      { y: 124, w: 200 },
      { y: 132, w: 200 },
    ]);
    const ys = selectMainStaffFiveLineYsFromClusters(clusters, 104);
    expect(ys).toEqual([100, 108, 116, 124, 132]);
  });

  it("ignores a short ledger line below the staff when widths differ", () => {
    const clusters = clustersFromYsAndWidths([
      { y: 100, w: 200 },
      { y: 108, w: 200 },
      { y: 116, w: 200 },
      { y: 124, w: 200 },
      { y: 132, w: 200 },
      { y: 140, w: 40 },
    ]);
    const ys = selectMainStaffFiveLineYsFromClusters(clusters, 120);
    expect(ys).toEqual([100, 108, 116, 124, 132]);
  });

  it("returns the only uniform quintuple when there are exactly five lines", () => {
    const clusters = clustersFromYsAndWidths([
      { y: 10, w: 100 },
      { y: 18, w: 100 },
      { y: 26, w: 100 },
      { y: 34, w: 100 },
      { y: 42, w: 100 },
    ]);
    expect(selectMainStaffFiveLineYsFromClusters(clusters, 26)).toEqual([10, 18, 26, 34, 42]);
  });

  it("returns null when fewer than five clusters", () => {
    expect(selectMainStaffFiveLineYsFromClusters(clustersFromYsAndWidths([{ y: 1, w: 1 }]))).toBeNull();
  });
});

describe("findTopmostNotePositionAt", () => {
  const sel = (id: string) => ({
    partId: "p1",
    measureIndex: 0,
    noteIndex: 0,
    noteId: id,
  });

  it("returns the upper note in a vertical overlap", () => {
    const high = { x: 10, y: 40, w: 10, h: 10, selection: sel("a") };
    const low = { x: 10, y: 55, w: 10, h: 10, selection: sel("b") };
    const got = findTopmostNotePositionAt([low, high], 14, 48);
    expect(got?.selection.noteId).toBe("a");
  });
});
