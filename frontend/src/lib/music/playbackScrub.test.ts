import { describe, expect, it } from "vitest";
import type { EditableScore, NotePosition } from "./scoreTypes";
import {
  buildMeasurePlaybackSpans,
  clampContentX,
  contentXForMeasureQuant,
  contentXForPlaybackTick,
  contentXToMeasureQuant,
  contentXToNearestMeasureStart,
  fractionToMeasureQuant,
  measureQuantToFraction,
  noteStartQuantInMeasure,
  quantToBeatLabel,
  riffQuantsForMeasure,
  secondsPerQuantForScore,
  advancePlaybackTick,
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

describe("contentXForPlaybackTick", () => {
  it("matches contentXForMeasureQuant at segment start", () => {
    const spans = buildMeasurePlaybackSpans([pos(0, 0), pos(0, 200)], 1, 400);
    const x0 = contentXForMeasureQuant(0, 0, spans, minimalScore);
    const tick = contentXForPlaybackTick(
      minimalScore,
      spans,
      0,
      0,
      1,
      0,
    );
    expect(tick).toBe(x0);
  });

  it("advances horizontally through a half-bar rest segment", () => {
    const score: EditableScore = { ...minimalScore, bpm: 120 };
    const spans = buildMeasurePlaybackSpans([pos(0, 0), pos(0, 200)], 1, 400);
    const spq = secondsPerQuantForScore(score);
    const halfBarSec = 32 * spq;
    const xStart = contentXForPlaybackTick(score, spans, 0, 0, halfBarSec, 0);
    const xMid = contentXForPlaybackTick(
      score,
      spans,
      0,
      0,
      halfBarSec,
      halfBarSec / 2,
    );
    expect(xMid).toBeGreaterThan(xStart);
  });

  it("continues into the next measure when elapsed time crosses the barline", () => {
    const score: EditableScore = { ...minimalScore, bpm: 120 };
    const spans = buildMeasurePlaybackSpans(
      [pos(0, 0), pos(0, 100), pos(1, 200), pos(1, 300)],
      2,
      400,
    );
    const barSec = 64 * secondsPerQuantForScore(score);
    const x0 = contentXForPlaybackTick(score, spans, 0, 0, barSec * 2, 0);
    const xNext = contentXForPlaybackTick(
      score,
      spans,
      0,
      0,
      barSec * 2,
      barSec + barSec / 4,
    );
    expect(xNext).toBeGreaterThan(x0);
    expect(contentXToMeasureQuant(xNext, spans, score).measureIndex).toBe(1);
  });

  it("advances slower at live 80 BPM than the 120 default when score.bpm is unset", () => {
    const spans = buildMeasurePlaybackSpans([pos(0, 0), pos(0, 200)], 1, 400);
    const x80 = contentXForPlaybackTick(minimalScore, spans, 0, 0, 10, 1.5, 80);
    const x120 = contentXForPlaybackTick(minimalScore, spans, 0, 0, 10, 1.5, 120);
    expect(x80).toBeLessThan(x120);
    expect(x80).toBeGreaterThan(contentXForPlaybackTick(minimalScore, spans, 0, 0, 10, 0, 80));
  });
});

describe("contentXForMeasureQuant", () => {
  it("round-trips mid-measure quant with contentXToMeasureQuant", () => {
    const spans = buildMeasurePlaybackSpans([pos(0, 80), pos(0, 200)], 1, 400);
    const mid = (spans[0]!.startX + spans[0]!.endX) / 2;
    const { measureIndex, quant } = contentXToMeasureQuant(mid, spans, minimalScore);
    const x = contentXForMeasureQuant(measureIndex, quant, spans, minimalScore);
    const back = contentXToMeasureQuant(x, spans, minimalScore);
    expect(back.measureIndex).toBe(measureIndex);
    expect(back.quant).toBe(quant);
  });
});

describe("quantToBeatLabel", () => {
  it("formats bar and beat for 4/4", () => {
    expect(quantToBeatLabel(0, minimalScore, 0)).toBe("Bar 1 · beat 1");
    expect(quantToBeatLabel(16, minimalScore, 0)).toBe("Bar 1 · beat 2");
  });
});

describe("timeline measure/quant mapping", () => {
  it("round-trips fraction through measure + quant", () => {
    const start = fractionToMeasureQuant(minimalScore, 0);
    expect(start).toEqual({ measureIndex: 0, quant: 0 });
    const mid = fractionToMeasureQuant(minimalScore, 0.5);
    expect(mid.measureIndex).toBe(1);
    expect(mid.quant).toBe(0);
    const back = measureQuantToFraction(minimalScore, mid.measureIndex, mid.quant);
    expect(back).toBeCloseTo(0.5, 5);
  });

  it("advances into the next bar at live 80 BPM", () => {
    const score: EditableScore = { ...minimalScore, bpm: 80 };
    const barSec = 64 * secondsPerQuantForScore(score, 80);
    const next = advancePlaybackTick(score, 0, 0, barSec * 2, barSec + barSec / 4, 80);
    expect(next.measureIndex).toBe(1);
    expect(next.quant).toBeGreaterThan(0);
  });

  it("maps a later note in the bar to a later start quant", () => {
    const score: EditableScore = {
      ...minimalScore,
      parts: [
        {
          ...minimalScore.parts[0]!,
          measures: [
            {
              id: "m0",
              notes: [
                { id: "n0", pitch: "C4", duration: "q" },
                { id: "n1", pitch: "E4", duration: "q" },
              ],
            },
            { id: "m1", notes: [] },
          ],
        },
      ],
    };
    expect(noteStartQuantInMeasure(score, "p1", 0, 0)).toBe(0);
    expect(noteStartQuantInMeasure(score, "p1", 0, 1)).toBe(16);
  });
});
