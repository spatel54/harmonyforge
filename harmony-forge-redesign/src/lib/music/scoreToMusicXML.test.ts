import { describe, expect, it } from "vitest";
import { scoreToMusicXML } from "./scoreToMusicXML";
import type { EditableScore } from "./scoreTypes";

const withChord: EditableScore = {
  divisions: 1,
  chords: [{ id: "c1", quant: 0, symbol: "Am" }],
  parts: [
    {
      id: "P1",
      name: "P1",
      clef: "treble",
      measures: [
        {
          id: "m1",
          notes: [{ id: "n1", pitch: "A4", duration: "q" }],
          timeSignature: "4/4",
        },
      ],
    },
  ],
};

describe("scoreToMusicXML", () => {
  it("includes harmony for chords at measure start quant", () => {
    const xml = scoreToMusicXML(withChord);
    expect(xml).toContain("<harmony>");
    expect(xml).toContain("<root-step>A</root-step>");
  });
});
