import { describe, expect, it } from "vitest";
import { scoreToMidiBuffer } from "./scoreToMidi";
import type { EditableScore } from "./scoreTypes";

const tinyScore: EditableScore = {
  divisions: 16,
  bpm: 120,
  parts: [
    {
      id: "p1",
      name: "Melody",
      clef: "treble",
      measures: [
        {
          id: "m1",
          notes: [
            { id: "n1", pitch: "C4", duration: "q", isRest: false },
            { id: "n2", pitch: "E4", duration: "q", isRest: false },
          ],
        },
      ],
    },
  ],
};

describe("scoreToMidiBuffer", () => {
  it("writes SMF header and at least meta + one part track", () => {
    const buf = scoreToMidiBuffer(tinyScore);
    expect(buf.length).toBeGreaterThan(40);
    const sig = String.fromCharCode(buf[0], buf[1], buf[2], buf[3]);
    expect(sig).toBe("MThd");
    const trk = String.fromCharCode(buf[14], buf[15], buf[16], buf[17]);
    expect(trk).toBe("MTrk");
  });

  it("produces non-empty MIDI for multi-part score", () => {
    const two: EditableScore = {
      ...tinyScore,
      parts: [
        tinyScore.parts[0]!,
        {
          id: "p2",
          name: "Bass",
          clef: "bass",
          measures: [
            {
              id: "m1b",
              notes: [{ id: "n3", pitch: "C3", duration: "h", isRest: false }],
            },
          ],
        },
      ],
    };
    const buf = scoreToMidiBuffer(two);
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    expect(dv.getUint16(10, false)).toBe(3);
  });
});
