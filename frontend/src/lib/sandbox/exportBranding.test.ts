import { describe, expect, it } from "vitest";
import {
  HARMONYFORGE_EXPORT_BRAND,
  injectMusicXmlExportBranding,
} from "./exportBranding";

const partwiseHead = `<?xml version="1.0"?>
<score-partwise version="3.0">
  <work>
    <work-title>Demo</work-title>
  </work>
  <part-list></part-list>
</score-partwise>`;

describe("injectMusicXmlExportBranding", () => {
  it("adds identification after work", () => {
    const xml = injectMusicXmlExportBranding(partwiseHead, "2026-06-04");
    expect(xml).toContain("<identification>");
    expect(xml).toContain(`<software>${HARMONYFORGE_EXPORT_BRAND}</software>`);
    expect(xml).toContain("<encoding-date>2026-06-04</encoding-date>");
  });

  it("is idempotent", () => {
    const once = injectMusicXmlExportBranding(partwiseHead, "2026-06-04");
    expect(injectMusicXmlExportBranding(once, "2026-06-04")).toBe(once);
  });
});
