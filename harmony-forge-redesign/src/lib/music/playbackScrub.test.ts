import { describe, expect, it } from "vitest";
import type { EditableScore, NotePosition } from "./scoreTypes";
import {
  buildMeasurePlaybackSpans,
  clampContentX,
  contentXToMeasureQuant,
  contentXToNearestMeasureStart,
  riffQuantsForMeasure,
} from "./playbackScrub";

const minimalScore: EditableScore = {
  divisions: 1,
  parts: [
    {
      id: "p1",
      name: "S",
      clef: "treble",
      measures: [
        { id: "m0", notes: [] },
        { id: "m1", notes: [] },
      ],
    },
  ],
};

function pos(m: number, x: number): NotePosition {
  return {
    x,
    y: 0,
    w: 10,
    h: 10,
    selection: {
      partId: "p1",
      measureIndex: m,
      noteIndex: 0,
      noteId: "n",
    },
  };
}

describe("riffQuantsForMeasure", () => {
  it("defaults to 64 for 4/4", () => {
    expect(riffQuantsForMeasure(minimalScore, 0)).toBe(64);
  });

  it("uses measure time signature when set", () => {
    const score: EditableScore = {
      ...minimalScore,
      parts: [
        {
          ...minimalScore.parts[0]!,
          measures: [
            { id: "m0", notes: [], timeSignature: "3/4" },
            { id: "m1", notes: [] },
          ],
        },
      ],
    };
    expect(riffQuantsForMeasure(score, 0)).toBe(48);
  });
});

describe("buildMeasurePlaybackSpans", () => {
  it("splits measures at midpoint between note clusters", () => {
    const spans = buildMeasurePlaybackSpans(
      [pos(0, 100), pos(0, 120), pos(1, 300), pos(1, 320)],
      2,
      500,
    );
    expect(spans).toHaveLength(2);
    expect(spans[0]!.measureIndex).toBe(0);
    expect(spans[1]!.measureIndex).toBe(1);
    expect(spans[0]!.endX).toBe(spans[1]!.startX);
    expect(spans[0]!.endX).toBeCloseTo((130 + 300) / 2, 5);
  });
});

describe("contentXToMeasureQuant", () => {
  it("maps start of measure to quant 0", () => {
    const spans = buildMeasurePlaybackSpans([pos(0, 0), pos(0, 100)], 1, 200);
    const r = contentXToMeasureQuant(spans[0]!.startX + 2, spans, minimalScore);
    expect(r.measureIndex).toBe(0);
    expect(r.quant).toBe(0);
  });

  it("maps near end of 4/4 measure toward high quant", () => {
    const spans = buildMeasurePlaybackSpans([pos(0, 0), pos(0, 100)], 1, 200);
    const end = spans[0]!.endX - 1;
    const r = contentXToMeasureQuant(end, spans, minimalScore);
    expect(r.measureIndex).toBe(0);
    expect(r.quant).toBeGreaterThan(32);
  });
});

describe("contentXToNearestMeasureStart", () => {
  it("snaps X to the chosen measure’s start", () => {
    const spans = buildMeasurePlaybackSpans(
      [pos(0, 100), pos(1, 400)],
      2,
      600,
    );
    const midM0 = (spans[0]!.startX + spans[0]!.endX) / 2;
    const r = contentXToNearestMeasureStart(midM0, spans, minimalScore);
    expect(r.measureIndex).toBe(0);
    expect(r.snapContentX).toBe(spans[0]!.startX);
  });
});

describe("clampContentX", () => {
  it("clamps to span extent", () => {
    const spans = buildMeasurePlaybackSpans([pos(0, 50)], 1, 200);
    expect(clampContentX(-100, spans)).toBe(spans[0]!.startX);
    expect(clampContentX(9999, spans)).toBe(spans[0]!.endX);
  });
});
