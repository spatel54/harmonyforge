import { describe, expect, it } from "vitest";

import { computePopoverLayout } from "./NotePalettePopover";
import type { NotePosition } from "@/lib/music/scoreTypes";

const anchor = (y: number, h = 12): NotePosition => ({
  x: 100,
  y,
  w: 12,
  h,
  selection: { partId: "p1", measureIndex: 0, noteIndex: 0, noteId: "n1" },
});

describe("computePopoverLayout", () => {
  it("places below the note and caps height to remaining canvas", () => {
    const layout = computePopoverLayout(anchor(40), { width: 800, height: 200 }, 240);
    expect(layout.top).toBe(40 + 12 + 8);
    expect(layout.maxHeight).toBe(200 - layout.top - 8);
    expect(layout.top + layout.maxHeight).toBeLessThanOrEqual(192);
  });

  it("flips above when there is more room above the note", () => {
    const layout = computePopoverLayout(anchor(360), { width: 800, height: 400 }, 240);
    expect(layout.top).toBeLessThan(360);
    expect(layout.top + layout.maxHeight).toBeLessThanOrEqual(360);
    expect(layout.maxHeight).toBeGreaterThan(200);
  });

  it("never overflows the container", () => {
    const layout = computePopoverLayout(anchor(180), { width: 400, height: 220 }, 240);
    expect(layout.top).toBeGreaterThanOrEqual(8);
    expect(layout.left).toBeGreaterThanOrEqual(8);
    expect(layout.top + layout.maxHeight).toBeLessThanOrEqual(212);
  });
});
