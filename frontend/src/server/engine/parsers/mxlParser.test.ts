/**
 * Tests for MXL parser
 */

import AdmZip from "adm-zip";
import { parseMXL } from "./mxlParser";

const MINIMAL_MUSICXML = `<?xml version="1.0"?>
<score-partwise version="2.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

function createMXL(xml: string): Buffer {
  const zip = new AdmZip();
  zip.addFile("META-INF/container.xml", Buffer.from(
    '<?xml version="1.0"?><container><rootfiles><rootfile full-path="score.xml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>',
    "utf-8"
  ));
  zip.addFile("score.xml", Buffer.from(xml, "utf-8"));
  return zip.toBuffer();
}

describe("parseMXL", () => {
  it("parses minimal MXL and extracts melody", () => {
    const mxl = createMXL(MINIMAL_MUSICXML);
    const parsed = parseMXL(mxl);
    expect(parsed).not.toBeNull();
    expect(parsed!.melody).toHaveLength(1);
    expect(parsed!.melody[0]!.pitch).toBe("C4");
    expect(parsed!.key.tonic).toBe("C");
  });

  it("returns null for invalid zip", () => {
    expect(parseMXL(Buffer.from("not a zip"))).toBeNull();
  });
});
