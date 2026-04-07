/**
 * @tonejs/midi is imported as named export { Midi }; parseMIDI must not use a non-existent default export.
 */

import { parseMIDI } from "./midiParser.js";

/** Format 0, one track, one note (middle C) @ 96 PPQ */
const MINIMAL_MIDI_HEX =
  "4d546864000000060000000100604d54726b0000000c00903c4040803c4000ff2f00";

describe("parseMIDI", () => {
  it("parses minimal SMF buffer", () => {
    const buf = Buffer.from(MINIMAL_MIDI_HEX, "hex");
    const score = parseMIDI(buf);
    expect(score).not.toBeNull();
    expect(score!.melody.length).toBeGreaterThan(0);
    expect(score!.melody[0]!.pitch).toMatch(/^C\d$/);
  });

  it("returns null for invalid buffer", () => {
    expect(parseMIDI(Buffer.from("not midi"))).toBeNull();
  });
});
