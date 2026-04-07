import { describe, expect, it } from "vitest";
import { hasScorePartwiseMarker, looksLikeMusicXml } from "./musicXmlMarkers";

describe("musicXmlMarkers", () => {
  it("matches harmonize-core style substring checks with namespace support", () => {
    expect(hasScorePartwiseMarker(`<?xml?><score-partwise>`)).toBe(true);
    expect(hasScorePartwiseMarker(`<ns:score-partwise xmlns:ns="http://x">`)).toBe(true);
    expect(looksLikeMusicXml("<foo/>")).toBe(false);
  });
});
