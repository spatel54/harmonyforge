import { describe, expect, it } from "vitest";
import { isPaletteItemPressed } from "./palettePressedState";
import type { EditableScore } from "@/lib/music/scoreTypes";
import type { PaletteItem } from "@/lib/palettes/paletteRegistry";

function item(toolId: string): PaletteItem {
  return { id: toolId, label: toolId, title: toolId, toolId };
}

function scoreWith(note: EditableScore["parts"][0]["measures"][0]["notes"][0]): EditableScore {
  return {
    divisions: 4,
    parts: [
      {
        id: "p1",
        name: "Melody",
        clef: "treble",
        measures: [{ id: "m1", notes: [note] }],
      },
    ],
  };
}

describe("isPaletteItemPressed", () => {
  it("marks slur pressed when a single selected note starts the slur", () => {
    const score = scoreWith({
      id: "n1",
      pitch: "C4",
      duration: "q",
      lineStart: "slur",
    });
    expect(
      isPaletteItemPressed(item("line-slur"), {
        score,
        selectedNoteIds: new Set(["n1"]),
        activeTool: null,
      }),
    ).toBe(true);
  });

  it("marks the selected note duration pressed", () => {
    const score = scoreWith({ id: "n1", pitch: "C4", duration: "8" });
    expect(
      isPaletteItemPressed(item("duration-eighth"), {
        score,
        selectedNoteIds: new Set(["n1"]),
        activeTool: "duration-quarter",
      }),
    ).toBe(true);
    expect(
      isPaletteItemPressed(item("duration-quarter"), {
        score,
        selectedNoteIds: new Set(["n1"]),
        activeTool: "duration-quarter",
      }),
    ).toBe(false);
  });

  it("marks treble clef pressed from the focused part", () => {
    const score = scoreWith({ id: "n1", pitch: "C4", duration: "q" });
    expect(
      isPaletteItemPressed(item("measure-clef-treble"), {
        score,
        selectedNoteIds: new Set(["n1"]),
        activeTool: null,
      }),
    ).toBe(true);
  });

  it("marks sharp accidental from pitch spelling", () => {
    const score = scoreWith({ id: "n1", pitch: "C#4", duration: "q" });
    expect(
      isPaletteItemPressed(item("pitch-accidental-sharp"), {
        score,
        selectedNoteIds: new Set(["n1"]),
        activeTool: null,
      }),
    ).toBe(true);
  });
});
