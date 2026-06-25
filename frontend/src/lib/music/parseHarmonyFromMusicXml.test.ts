import { describe, expect, it } from "vitest";
import { parseMusicXML } from "./musicxmlParser";

const partwiseWithHarmony = `<?xml version="1.0"?>
<score-partwise version="3.0">
  <part-list>
    <score-part id="P1"><part-name>Melody</part-name></score-part>
    <score-part id="P2"><part-name>Alto</part-name></score-part>
    <score-part id="P3"><part-name>Bass</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <harmony><root><root-step>C</root-step></root><kind text="C">major</kind></harmony>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
      <harmony><root><root-step>G</root-step></root><kind text="G7">dominant</kind></harmony>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>8</duration><type>half</type></note>
    </measure>
  </part>
  <part id="P3">
    <measure number="1">
      <note><pitch><step>C</step><octave>3</octave></pitch><duration>8</duration><type>half</type></note>
    </measure>
  </part>
</score-partwise>`;

describe("parseMusicXML harmony", () => {
  it("populates EditableScore.chords from P1 harmony elements", () => {
    const score = parseMusicXML(partwiseWithHarmony);
    expect(score?.chords?.length).toBe(2);
    expect(score?.chords?.[0]?.symbol).toBe("C");
    expect(score?.chords?.[0]?.quant).toBe(0);
    expect(score?.chords?.[1]?.symbol).toBe("G7");
    expect(score?.chords?.[1]?.quant).toBe(16);
  });
});
