/**
 * Partwise parser: multi-part melody selection.
 */

import { parsePartwiseMusicXML } from "./partwiseParser.js";

const TWO_PART_MELODY_ON_P2 = `<?xml version="1.0"?>
<score-partwise version="2.0">
  <part-list>
    <score-part id="P1"><part-name>Bass</part-name></score-part>
    <score-part id="P2"><part-name>Violin</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>C</step><octave>2</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>4</divisions>
        <key><fifths>0</fifths><mode>major</mode></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
      </attributes>
      <note><pitch><step>G</step><octave>5</octave></pitch><duration>4</duration><type>whole</type></note>
    </measure>
  </part>
</score-partwise>`;

describe("parsePartwiseMusicXML", () => {
  it("chooses the higher-pitched part as melody when multiple parts exist", () => {
    const parsed = parsePartwiseMusicXML(TWO_PART_MELODY_ON_P2);
    expect(parsed).not.toBeNull();
    expect(parsed!.melody).toHaveLength(1);
    expect(parsed!.melody[0]!.pitch).toBe("G5");
    expect(parsed!.melodyPartName).toBe("Violin");
  });
});
