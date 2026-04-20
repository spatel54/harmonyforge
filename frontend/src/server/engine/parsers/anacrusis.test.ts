/**
 * Tests for pickup (anacrusis) detection in partwise + timewise parsers.
 * Feedback reference: docs/Iteration2.txt §1.
 */

import { parsePartwiseMusicXML } from "./partwiseParser";
import { parseTimewiseMusicXML } from "./timewiseParser";

describe("anacrusis / pickup measure detection", () => {
  it("partwise parser flags implicit='yes' measure 0 as pickup", () => {
    const xml = `<?xml version="1.0"?>
<score-partwise version="2.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1">
    <measure number="0" implicit="yes">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
    <measure number="1">
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration></note>
    </measure>
  </part>
</score-partwise>`;
    const parsed = parsePartwiseMusicXML(xml);
    expect(parsed).not.toBeNull();
    expect(parsed!.pickupBeats).toBeCloseTo(1, 4);
    expect(parsed!.timeSignature?.beats).toBe(4);
  });

  it("partwise parser infers pickup from short first measure (no implicit attribute)", () => {
    const xml = `<?xml version="1.0"?>
<score-partwise version="2.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>8</duration></note>
    </measure>
    <measure number="2">
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration></note>
    </measure>
  </part>
</score-partwise>`;
    const parsed = parsePartwiseMusicXML(xml);
    expect(parsed).not.toBeNull();
    expect(parsed!.pickupBeats).toBeCloseTo(2, 4);
  });

  it("partwise parser leaves pickupBeats undefined when first measure is full-length", () => {
    const xml = `<?xml version="1.0"?>
<score-partwise version="2.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration></note>
    </measure>
  </part>
</score-partwise>`;
    const parsed = parsePartwiseMusicXML(xml);
    expect(parsed).not.toBeNull();
    expect(parsed!.pickupBeats).toBeUndefined();
  });

  it("timewise parser flags implicit='yes' measure 0 as pickup", () => {
    const xml = `<?xml version="1.0"?>
<score-timewise version="2.0">
  <part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list>
  <measure number="0" implicit="yes">
    <part id="P1">
      <attributes>
        <divisions>4</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration></note>
    </part>
  </measure>
  <measure number="1">
    <part id="P1">
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>16</duration></note>
    </part>
  </measure>
</score-timewise>`;
    const parsed = parseTimewiseMusicXML(xml);
    expect(parsed).not.toBeNull();
    expect(parsed!.pickupBeats).toBeCloseTo(1, 4);
  });
});
