import { describe, expect, it } from "vitest";
import { parseMusicXML } from "./musicxmlParser";

const D_MAJOR_PARTWISE = `<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>2</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

const KEY_CHANGE_PARTWISE = `<?xml version="1.0"?>
<score-partwise version="2.0">
  <part-list><score-part id="P1"><part-name>P1</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <attributes>
        <key><fifths>2</fifths><mode>major</mode></key>
      </attributes>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

const D_MAJOR_TIMEWISE = `<?xml version="1.0"?>
<score-timewise version="2.0">
  <part-list><score-part id="P1"><part-name>M</part-name></score-part></part-list>
  <measure number="1">
    <part id="P1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>2</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </part>
  </measure>
</score-timewise>`;

describe("parseMusicXML key signatures", () => {
  it("sets keySignature to 2 for D major partwise", () => {
    const score = parseMusicXML(D_MAJOR_PARTWISE);
    expect(score).not.toBeNull();
    expect(score!.parts[0]!.measures[0]!.keySignature).toBe(2);
  });

  it("carries running key and updates on later measure (partwise)", () => {
    const score = parseMusicXML(KEY_CHANGE_PARTWISE);
    expect(score).not.toBeNull();
    expect(score!.parts[0]!.measures[0]!.keySignature).toBe(0);
    expect(score!.parts[0]!.measures[1]!.keySignature).toBe(2);
  });

  it("sets keySignature for timewise score with key inside part", () => {
    const score = parseMusicXML(D_MAJOR_TIMEWISE);
    expect(score).not.toBeNull();
    expect(score!.parts[0]!.measures[0]!.keySignature).toBe(2);
  });
});
