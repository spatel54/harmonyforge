/**
 * Tests for MusicXML parser
 */

import { parseMusicXML } from "./musicxmlParser.js";

const PARTWISE_C_MAJOR = `<?xml version="1.0"?>
<score-partwise version="2.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

describe("parseMusicXML", () => {
  it("returns null for invalid XML", () => {
    expect(parseMusicXML("not xml")).toBeNull();
    expect(parseMusicXML("")).toBeNull();
  });

  it("returns null for empty or malformed score", () => {
    expect(parseMusicXML("<root/>")).toBeNull();
  });

  it("parses score-partwise with melody and C major key", () => {
    const parsed = parseMusicXML(PARTWISE_C_MAJOR);
    expect(parsed).not.toBeNull();
    expect(parsed!.melody.length).toBeGreaterThan(0);
    expect(parsed!.key.tonic).toBe("C");
    expect(parsed!.key.mode).toBe("major");
  });

  it("parses score-timewise", () => {
    const xml = `<?xml version="1.0"?>
<score-timewise version="2.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <measure number="1">
    <part id="P1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </part>
  </measure>
</score-timewise>`;
    const parsed = parseMusicXML(xml);
    expect(parsed).not.toBeNull();
    expect(parsed!.melody).toHaveLength(2);
    expect(parsed!.melody[0]!.pitch).toBe("C4");
    expect(parsed!.melody[1]!.pitch).toBe("E4");
    expect(parsed!.key.tonic).toBe("C");
  });

  it("parses namespaced MusicXML (MuseScore-style)", () => {
    const xml = `<?xml version="1.0"?>
<score-partwise xmlns="http://www.musicxml.org/ns/partwise" version="2.0">
  <part-list><score-part id="P1"><part-name>Violin</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;
    const parsed = parseMusicXML(xml);
    expect(parsed).not.toBeNull();
    expect(parsed!.melody).toHaveLength(1);
    expect(parsed!.melody[0]!.pitch).toBe("G4");
    expect(parsed!.melodyPartName).toBe("Violin");
  });
});
