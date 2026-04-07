import {
  hasScorePartwiseMarker,
  hasScoreTimewiseMarker,
  looksLikeMusicXml,
} from "./musicXmlMarkers.js";

describe("musicXmlMarkers", () => {
  it("detects unprefixed roots (harmonize-core style)", () => {
    expect(hasScorePartwiseMarker(`<?xml version="1.0"?><score-partwise version="2.0">`)).toBe(true);
    expect(hasScoreTimewiseMarker(`<score-timewise version="2.0">`)).toBe(true);
  });

  it("detects namespace-prefixed roots", () => {
    expect(hasScorePartwiseMarker(`<mx:score-partwise xmlns:mx="http://x">`)).toBe(true);
    expect(hasScoreTimewiseMarker(`<m:score-timewise>`)).toBe(true);
  });

  it("looksLikeMusicXml rejects non-score XML", () => {
    expect(looksLikeMusicXml("<foo/>")).toBe(false);
    expect(looksLikeMusicXml("")).toBe(false);
  });
});
