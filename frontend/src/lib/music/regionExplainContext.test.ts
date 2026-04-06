import { describe, expect, it } from "vitest";
import {
  buildMeasureFocusFacts,
  buildPartFocusFacts,
  collectNoteIdsInMeasure,
} from "@/lib/music/regionExplainContext";
import type { EditableScore } from "@/lib/music/scoreTypes";

function m(
  id: string,
  notes: Array<{ id: string; pitch?: string; duration: "q" | "h"; isRest?: boolean }>,
) {
  return {
    id: `m-${id}`,
    timeSignature: "4/4",
    keySignature: 0,
    notes: notes.map((n) =>
      n.isRest
        ? { id: n.id, pitch: "C4", duration: n.duration, isRest: true as const }
        : { id: n.id, pitch: n.pitch ?? "C4", duration: n.duration },
    ),
  };
}

describe("buildMeasureFocusFacts", () => {
  it("lists all parts for one measure and collects note ids", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "p0",
          name: "Melody",
          clef: "treble",
          measures: [m("a", [{ id: "n0", pitch: "C4", duration: "q" }])],
        },
        {
          id: "p1",
          name: "Harm",
          clef: "treble",
          measures: [m("b", [{ id: "n1", pitch: "E4", duration: "q" }])],
        },
      ],
    };
    const { lines, noteIds } = buildMeasureFocusFacts(score, 0);
    expect(lines.some((l) => l.startsWith("MEASURE FOCUS:"))).toBe(true);
    expect(lines.some((l) => l.includes("Melody") && l.includes("C4"))).toBe(true);
    expect(lines.some((l) => l.includes("Harm") && l.includes("E4"))).toBe(true);
    expect(new Set(noteIds)).toEqual(new Set(["n0", "n1"]));
  });

  it("collectNoteIdsInMeasure matches buildMeasureFocusFacts noteIds", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "a",
          name: "A",
          clef: "treble",
          measures: [m("1", [{ id: "x", pitch: "D4", duration: "q" }])],
        },
      ],
    };
    expect(collectNoteIdsInMeasure(score, 0)).toEqual(["x"]);
  });
});

describe("buildPartFocusFacts", () => {
  it("summarizes measures and collects all note ids in part", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "solo",
          name: "Violin",
          clef: "treble",
          measures: [
            m("1", [{ id: "a", pitch: "G4", duration: "q" }]),
            m("2", [{ id: "b", pitch: "A4", duration: "q" }]),
          ],
        },
      ],
    };
    const { lines, noteIds } = buildPartFocusFacts(score, "solo");
    expect(lines[0]).toContain("PART FOCUS");
    expect(lines[0]).toContain("Violin");
    expect(lines.some((l) => l.startsWith("m1:") && l.includes("G4"))).toBe(true);
    expect(lines.some((l) => l.startsWith("m2:") && l.includes("A4"))).toBe(true);
    expect(noteIds.sort()).toEqual(["a", "b"]);
  });
});
