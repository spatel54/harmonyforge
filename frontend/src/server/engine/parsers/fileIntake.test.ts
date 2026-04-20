/**
 * Tests for unified file intake (ZIP sniff, extension routing, PDF pipeline wiring).
 */

import { vi, type Mock } from "vitest";
import { spawnSync } from "node:child_process";
import AdmZip from "adm-zip";
import {
  ACCEPTED_EXTENSIONS_MESSAGE,
  bufferToUtf8ScoreText,
  collectAltoTextContent,
  extractEmbeddedMusicXml,
  getExtension,
  intakeFileToParsedScore,
  isProbablyMidi,
  isProbablyPdf,
  isProbablyZip,
  looksLikeMusicXml,
} from "./fileIntake";

vi.mock("node:child_process", () => ({
  spawnSync: vi.fn(),
}));

const mockedSpawn = spawnSync as unknown as Mock;

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

const NAMESPACED_MUSICXML = `<?xml version="1.0"?>
<score-partwise xmlns="http://www.musicxml.org/ns/partwise" version="2.0">
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>4</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

function createMXL(xml: string): Buffer {
  const zip = new AdmZip();
  zip.addFile(
    "META-INF/container.xml",
    Buffer.from(
      '<?xml version="1.0"?><container><rootfiles><rootfile full-path="score.xml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>',
      "utf-8",
    ),
  );
  zip.addFile("score.xml", Buffer.from(xml, "utf-8"));
  return zip.toBuffer();
}

/** Format 0, one track, one middle-C quarter @ 96 PPQN — parses with @tonejs/midi */
const MINIMAL_MIDI_HEX =
  "4d546864000000060000000100604d54726b0000000c00903c4040803c4000ff2f00";

describe("fileIntake helpers", () => {
  it("isProbablyZip detects PK header", () => {
    const mxl = createMXL(MINIMAL_MUSICXML);
    expect(isProbablyZip(mxl)).toBe(true);
    expect(isProbablyZip(Buffer.from("plain"))).toBe(false);
  });

  it("isProbablyPdf detects %PDF", () => {
    expect(isProbablyPdf(Buffer.from("%PDF-1.4\n"))).toBe(true);
    expect(isProbablyPdf(Buffer.from("hello"))).toBe(false);
  });

  it("isProbablyMidi detects MThd", () => {
    expect(isProbablyMidi(Buffer.from(MINIMAL_MIDI_HEX, "hex"))).toBe(true);
    expect(isProbablyMidi(Buffer.from("MTh"))).toBe(false);
    expect(isProbablyMidi(Buffer.from("XXXX"))).toBe(false);
  });

  it("looksLikeMusicXml detects partwise / timewise markers", () => {
    expect(looksLikeMusicXml(`  \n${MINIMAL_MUSICXML}`)).toBe(true);
    expect(looksLikeMusicXml(`<mx:score-partwise xmlns:mx="http://example/ns">`)).toBe(true);
    expect(looksLikeMusicXml("<foo/>")).toBe(false);
  });

  it("extractEmbeddedMusicXml slices prefixed partwise document", () => {
    const inner = `<part id="P1"><measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>quarter</type></note></measure></part>`;
    const wrapped = `noise <mx:score-partwise>${inner}</mx:score-partwise> tail`;
    const slice = extractEmbeddedMusicXml(wrapped);
    expect(slice).toContain("<mx:score-partwise>");
    expect(slice).toContain("</mx:score-partwise>");
  });

  it("bufferToUtf8ScoreText strips UTF-8 BOM", () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const rest = Buffer.from(MINIMAL_MUSICXML, "utf-8");
    const t = bufferToUtf8ScoreText(Buffer.concat([bom, rest]));
    expect(t.startsWith("<?xml")).toBe(true);
  });

  it("getExtension lowercases last segment", () => {
    expect(getExtension("Foo.MUSICXML")).toBe("musicxml");
  });

  it("extractEmbeddedMusicXml slices partwise document", () => {
    const noise = `abc ${MINIMAL_MUSICXML} tail`;
    const slice = extractEmbeddedMusicXml(noise);
    expect(slice).toContain("<score-partwise");
    expect(slice).toContain("</score-partwise>");
  });

  it("collectAltoTextContent reads String @_CONTENT", () => {
    const alto = `<?xml version="1.0"?><alto xmlns="http://www.loc.gov/standards/alto/ns-v3#">
      <Layout><Page><PrintSpace><TextBlock><TextLine>
        <String CONTENT="Hello"/>
        <String CONTENT="World"/>
      </TextLine></TextBlock></PrintSpace></Page></Layout></alto>`;
    const t = collectAltoTextContent(alto);
    expect(t).toContain("Hello");
    expect(t).toContain("World");
  });
});

describe("intakeFileToParsedScore", () => {
  beforeEach(() => {
    mockedSpawn.mockReset();
    delete process.env.PDFALTO_BIN;
  });

  it("parses MXL buffer mislabeled as .xml via ZIP sniff", () => {
    const buf = createMXL(MINIMAL_MUSICXML);
    const r = intakeFileToParsedScore(buf, "score.xml", { allowPdfOm: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed.melody.length).toBeGreaterThan(0);
  });

  it("parses plain MusicXML .musicxml buffer", () => {
    const r = intakeFileToParsedScore(Buffer.from(MINIMAL_MUSICXML, "utf-8"), "a.musicxml", {
      allowPdfOm: false,
    });
    expect(r.ok).toBe(true);
  });

  it("extracts embedded score-partwise from noisy .xml wrapper", () => {
    const wrapped = `<!-- export log -->\n${MINIMAL_MUSICXML}\n<!-- end -->\n`;
    const r = intakeFileToParsedScore(Buffer.from(wrapped, "utf-8"), "wrapped.xml", {
      allowPdfOm: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed.melody.length).toBeGreaterThan(0);
  });

  it("parses namespaced MusicXML .musicxml buffer (MuseScore-style)", () => {
    const r = intakeFileToParsedScore(Buffer.from(NAMESPACED_MUSICXML, "utf-8"), "ns.musicxml", {
      allowPdfOm: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.parsed.melody).toHaveLength(1);
      expect(r.parsed.melody[0]!.pitch).toBe("G4");
    }
  });

  it("parses namespaced MXL via ZIP sniff", () => {
    const buf = createMXL(NAMESPACED_MUSICXML);
    const r = intakeFileToParsedScore(buf, "labeled.xml", { allowPdfOm: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed.melody[0]!.pitch).toBe("G4");
  });

  it("rejects PDF for validation when allowPdfOm is false", () => {
    const r = intakeFileToParsedScore(Buffer.from("%PDF-1.1\n"), "a.pdf", { allowPdfOm: false });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure.status).toBe(501);
      expect(r.failure.error).toMatch(/PDF validation is not supported/i);
    }
  });

  it("returns 400 for unknown extension when content is not MIDI or MusicXML", () => {
    const r = intakeFileToParsedScore(Buffer.from("x"), "a.bin", { allowPdfOm: true });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure.status).toBe(400);
      expect(r.failure.error).toContain(ACCEPTED_EXTENSIONS_MESSAGE);
    }
  });

  it("parses SMF via MThd magic when extension is .txt", () => {
    const buf = Buffer.from(MINIMAL_MIDI_HEX, "hex");
    const r = intakeFileToParsedScore(buf, "export.txt", { allowPdfOm: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.parsed.melody.length).toBeGreaterThan(0);
  });

  it("parses MusicXML when extension is .txt (looksLikeMusicXml)", () => {
    const r = intakeFileToParsedScore(Buffer.from(MINIMAL_MUSICXML, "utf-8"), "score.txt", {
      allowPdfOm: false,
    });
    expect(r.ok).toBe(true);
  });

  it("parses MusicXML with empty extension via sniff + fallback", () => {
    const r = intakeFileToParsedScore(Buffer.from(MINIMAL_MUSICXML, "utf-8"), "MyScore", {
      allowPdfOm: false,
    });
    expect(r.ok).toBe(true);
  });

  it("parses .mxml like MusicXML", () => {
    const r = intakeFileToParsedScore(Buffer.from(MINIMAL_MUSICXML, "utf-8"), "x.mxml", {
      allowPdfOm: false,
    });
    expect(r.ok).toBe(true);
  });

  it("runs pdfalto then pdftoppm when PDF and tools fail → 501 with setup hints", () => {
    mockedSpawn.mockReturnValue({
      status: 1,
      stderr: "",
      stdout: "",
      error: undefined,
    } as ReturnType<typeof spawnSync>);
    const r = intakeFileToParsedScore(Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n"), "score.pdf", {
      allowPdfOm: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure.status).toBe(501);
      expect(r.failure.error).toMatch(/pdfalto/i);
      expect(r.failure.error).toMatch(/oemer/i);
    }
    expect(mockedSpawn.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
