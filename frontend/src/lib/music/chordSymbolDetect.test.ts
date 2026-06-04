import { describe, expect, it } from "vitest";
import { beatToRiffQuant } from "./chordSymbolFormat";
import { measureDownbeatBeats } from "./chordPlacement";
import { buildChordTrackFromScore, detectSymbolFromPcs } from "./chordSymbolDetect";
import type { EditableScore } from "./scoreTypes";

describe("detectSymbolFromPcs", () => {
  it("labels B+E+G as Em not F", () => {
    expect(detectSymbolFromPcs(new Set([11, 4, 7]))).toBe("Em");
  });

  it("labels C+E+G as C", () => {
    expect(detectSymbolFromPcs(new Set([0, 4, 7]))).toBe("C");
  });
});

describe("buildChordTrackFromScore", () => {
  it("puts C on measure 2 downbeat for melody+cello CEG bar", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "melody",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [{ id: "r1", isRest: true, duration: "w" as const }],
              timeSignature: "4/4",
            },
            {
              id: "m2",
              notes: [
                { id: "n1", pitch: "C5", duration: "q" as const },
                { id: "n2", pitch: "E5", duration: "8" as const },
                { id: "n3", pitch: "G5", duration: "q" as const, dots: 1 },
                { id: "n4", pitch: "C5", duration: "8" as const },
              ],
              timeSignature: "4/4",
            },
            {
              id: "m3",
              notes: [
                { id: "n5", pitch: "B4", duration: "q" as const },
                { id: "n6", pitch: "E5", duration: "8" as const },
                { id: "n7", pitch: "G5", duration: "q" as const, dots: 1 },
                { id: "n8", pitch: "G5", duration: "8" as const },
              ],
              timeSignature: "4/4",
            },
          ],
        },
        {
          id: "cello",
          name: "Cello",
          clef: "bass",
          measures: [
            {
              id: "m1",
              notes: [{ id: "r2", isRest: true, duration: "w" as const }],
              timeSignature: "4/4",
            },
            {
              id: "m2",
              notes: [
                { id: "c1", pitch: "C3", duration: "8" as const },
                { id: "c2", pitch: "C3", duration: "8" as const },
                { id: "c3", pitch: "C3", duration: "8" as const },
                { id: "c4", pitch: "C3", duration: "8" as const },
                { id: "c5", pitch: "E3", duration: "8" as const },
                { id: "c6", pitch: "E3", duration: "8" as const },
                { id: "c7", pitch: "E3", duration: "8" as const },
                { id: "c8", pitch: "E3", duration: "8" as const },
              ],
              timeSignature: "4/4",
            },
            {
              id: "m3",
              notes: [
                { id: "c9", pitch: "E3", duration: "8" as const },
                { id: "c10", pitch: "E3", duration: "8" as const },
                { id: "c11", pitch: "E3", duration: "8" as const },
                { id: "c12", pitch: "E3", duration: "8" as const },
                { id: "c13", pitch: "E3", duration: "8" as const },
                { id: "c14", pitch: "E3", duration: "8" as const },
                { id: "c15", pitch: "E3", duration: "8" as const },
                { id: "c16", pitch: "E3", duration: "8" as const },
              ],
              timeSignature: "4/4",
            },
          ],
        },
      ],
    };

    const downbeats = measureDownbeatBeats(score);
    const chords = buildChordTrackFromScore(score);
    const m2Quant = beatToRiffQuant(downbeats[1]!);
    const m3Quant = beatToRiffQuant(downbeats[2]!);
    expect(chords.find((c) => c.quant === m2Quant)?.symbol).toBe("C");
    expect(chords.find((c) => c.quant === m3Quant)?.symbol).toBe("Em");
    expect(chords.filter((c) => c.quant === m3Quant).length).toBe(1);
  });

  it("aligns measure-2 downbeat chord quant with RiffScore 4/4 (64 quants) when bar 1 is underfilled", () => {
    const score: EditableScore = {
      divisions: 1,
      parts: [
        {
          id: "melody",
          name: "Melody",
          clef: "treble",
          measures: [
            {
              id: "m1",
              notes: [{ id: "r1", isRest: true, duration: "h" as const, dots: 1 }],
              timeSignature: "4/4",
            },
            {
              id: "m2",
              notes: [
                { id: "n1", pitch: "C5", duration: "q" as const },
                { id: "n2", pitch: "E5", duration: "q" as const },
                { id: "n3", pitch: "G5", duration: "q" as const },
                { id: "n4", pitch: "C5", duration: "q" as const },
              ],
              timeSignature: "4/4",
            },
          ],
        },
        {
          id: "cello",
          name: "Cello",
          clef: "bass",
          measures: [
            {
              id: "m1",
              notes: [{ id: "r2", isRest: true, duration: "h" as const, dots: 1 }],
              timeSignature: "4/4",
            },
            {
              id: "m2",
              notes: [{ id: "c1", pitch: "C3", duration: "w" as const }],
              timeSignature: "4/4",
            },
          ],
        },
      ],
    };
    const chords = buildChordTrackFromScore(score);
    expect(chords.find((c) => c.quant === 64)?.symbol).toBe("C");
  });
});
