import { describe, expect, it } from "vitest";

import {
  clampPopoverSectionIds,
  DEFAULT_POPOVER_SECTION_IDS,
  MAX_POPOVER_SECTIONS,
  PALETTE_SECTION_IDS,
  PALETTE_SECTIONS,
} from "./paletteRegistry";

describe("clampPopoverSectionIds", () => {
  it("returns defaults when given empty input", () => {
    expect(clampPopoverSectionIds([])).toEqual([]);
  });

  it("dedupes and drops unknown ids", () => {
    expect(
      clampPopoverSectionIds([
        "accidentals",
        "accidentals",
        "not-a-section",
        "dynamics",
      ]),
    ).toEqual(["accidentals", "dynamics"]);
  });

  it("caps at MAX_POPOVER_SECTIONS", () => {
    const ids = ["accidentals", "articulations", "dynamics", "clefs", "lines"];
    expect(clampPopoverSectionIds(ids)).toHaveLength(MAX_POPOVER_SECTIONS);
    expect(clampPopoverSectionIds(ids)).toEqual([
      "accidentals",
      "articulations",
      "dynamics",
    ]);
  });

  it("preserves order of first valid ids", () => {
    expect(clampPopoverSectionIds(["dynamics", "accidentals"])).toEqual([
      "dynamics",
      "accidentals",
    ]);
  });

  it("DEFAULT_POPOVER_SECTION_IDS are valid registry ids", () => {
    for (const id of DEFAULT_POPOVER_SECTION_IDS) {
      expect(PALETTE_SECTION_IDS).toContain(id);
    }
    expect(DEFAULT_POPOVER_SECTION_IDS).toHaveLength(MAX_POPOVER_SECTIONS);
  });

  it("every palette item has a descriptive title", () => {
    for (const section of PALETTE_SECTIONS) {
      for (const item of section.items) {
        expect(item.title.trim().length).toBeGreaterThan(item.label.length);
      }
    }
  });
});
