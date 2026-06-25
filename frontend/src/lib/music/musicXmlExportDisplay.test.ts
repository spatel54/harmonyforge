import { describe, expect, it } from "vitest";
import { musicXmlForExportDisplay, stripHarmonyFromMusicXml } from "./musicXmlExportDisplay";

const withHarmony = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <harmony>
        <root><root-step>C</root-step></root>
        <kind>major</kind>
      </harmony>
      <note><pitch><step>C</step></pitch></note>
    </measure>
  </part>
</score-partwise>`;

describe("stripHarmonyFromMusicXml", () => {
  it("removes harmony elements", () => {
    const out = stripHarmonyFromMusicXml(withHarmony);
    expect(out).not.toContain("<harmony");
    expect(out).toContain("<note>");
  });
});

describe("musicXmlForExportDisplay", () => {
  it("keeps harmony when showChordSymbols is true", () => {
    expect(musicXmlForExportDisplay(withHarmony, { showChordSymbols: true })).toContain(
      "<harmony",
    );
  });

  it("strips harmony when showChordSymbols is false", () => {
    expect(musicXmlForExportDisplay(withHarmony, { showChordSymbols: false })).not.toContain(
      "<harmony",
    );
  });
});
