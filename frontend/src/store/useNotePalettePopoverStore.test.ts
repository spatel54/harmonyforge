import { beforeEach, describe, expect, it } from "vitest";

import { useNotePalettePopoverStore } from "./useNotePalettePopoverStore";

describe("useNotePalettePopoverStore", () => {
  beforeEach(() => {
    useNotePalettePopoverStore.setState({
      sectionIds: ["accidentals", "articulations", "dynamics"],
    });
  });

  it("defaults to three popover sections", () => {
    expect(useNotePalettePopoverStore.getState().sectionIds).toEqual([
      "accidentals",
      "articulations",
      "dynamics",
    ]);
  });

  it("toggleSection removes an enabled section", () => {
    useNotePalettePopoverStore.getState().toggleSection("articulations");
    expect(useNotePalettePopoverStore.getState().sectionIds).toEqual([
      "accidentals",
      "dynamics",
    ]);
  });

  it("toggleSection adds when under cap", () => {
    useNotePalettePopoverStore.getState().toggleSection("articulations");
    useNotePalettePopoverStore.getState().toggleSection("clefs");
    expect(useNotePalettePopoverStore.getState().sectionIds).toEqual([
      "accidentals",
      "dynamics",
      "clefs",
    ]);
  });

  it("toggleSection no-ops add at cap", () => {
    useNotePalettePopoverStore.getState().toggleSection("clefs");
    expect(useNotePalettePopoverStore.getState().sectionIds).toHaveLength(3);
    expect(useNotePalettePopoverStore.getState().sectionIds).not.toContain("clefs");
  });

  it("setSectionIds clamps unknown and excess ids", () => {
    useNotePalettePopoverStore.getState().setSectionIds([
      "dynamics",
      "bogus",
      "accidentals",
      "articulations",
      "clefs",
    ]);
    expect(useNotePalettePopoverStore.getState().sectionIds).toEqual([
      "dynamics",
      "accidentals",
      "articulations",
    ]);
  });

  it("canAddSection reflects cap", () => {
    const s = useNotePalettePopoverStore.getState();
    expect(s.canAddSection("accidentals")).toBe(true);
    expect(s.canAddSection("clefs")).toBe(false);
    s.toggleSection("accidentals");
    expect(useNotePalettePopoverStore.getState().canAddSection("clefs")).toBe(true);
  });
});
