import { describe, expect, it } from "vitest";
import { editableScoreToRsScore, riffScoreToEditableScore } from "./riffscoreAdapter";
import type { EditableScore } from "./scoreTypes";

const minimal: EditableScore = {
  divisions: 1,
  bpm: 96,
  chords: [{ id: "c1", quant: 0, symbol: "Cmaj7" }],
  parts: [
    {
      id: "P1",
      name: "Melody",
      clef: "treble",
      measures: [
        {
          id: "m1",
          notes: [{ id: "n1", pitch: "C4", duration: "q" }],
          timeSignature: "4/4",
          keySignature: 0,
        },
      ],
    },
  ],
};

describe("riffscoreAdapter", () => {
  it("embeds bpm and chordTrack in RsScore", () => {
    const rs = editableScoreToRsScore(minimal);
    expect(rs.bpm).toBe(96);
    expect(rs.chordTrack?.length).toBe(1);
    expect(rs.chordTrack?.[0]?.symbol).toBe("Cmaj7");
  });

  it("maps chordTrack and bpm back to EditableScore", () => {
    const rs = editableScoreToRsScore(minimal);
    const hf = riffScoreToEditableScore(rs, new Map(), minimal.parts, minimal);
    expect(hf.bpm).toBe(96);
    expect(hf.chords?.length).toBe(1);
    expect(hf.chords?.[0]?.symbol).toBe("Cmaj7");
  });
});
