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

const ALTO_CLEF_GENERIC_PART = `<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P2"><part-name>Inner voices</part-name></score-part></part-list>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <clef><sign>C</sign><line>3</line></clef>
      </attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

describe("parseMusicXML clefs", () => {
  it("reads alto C-clef from attributes when part name does not imply viola", () => {
    const score = parseMusicXML(ALTO_CLEF_GENERIC_PART);
    expect(score).not.toBeNull();
    expect(score!.parts[0]!.clef).toBe("alto");
  });

  it("reads mezzo-soprano and baritone C-clef line numbers", () => {
    const mezzo = parseMusicXML(`<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>X</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>4</divisions><clef><sign>C</sign><line>2</line></clef></attributes>
    <note><rest/><duration>4</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`);
    const baritoneC = parseMusicXML(`<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>X</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>4</divisions><clef><sign>C</sign><line>5</line></clef></attributes>
    <note><rest/><duration>4</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`);
    const sopC = parseMusicXML(`<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>X</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>4</divisions><clef><sign>C</sign><line>1</line></clef></attributes>
    <note><rest/><duration>4</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`);
    expect(mezzo!.parts[0]!.clef).toBe("mezzo");
    expect(baritoneC!.parts[0]!.clef).toBe("baritone_c");
    expect(sopC!.parts[0]!.clef).toBe("soprano_c");
  });

  it("infers treble for choral tenor part name when MusicXML omits clef", () => {
    const score = parseMusicXML(`<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Tenor</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>4</divisions></attributes>
    <note><rest/><duration>4</duration><type>quarter</type></note>
  </measure></part>
</score-partwise>`);
    expect(score!.parts[0]!.clef).toBe("treble");
  });
});

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
