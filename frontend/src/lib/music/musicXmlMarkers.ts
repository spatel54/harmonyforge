/**
 * MusicXML root detection (mirrors backend engine/parsers/musicXmlMarkers.ts and
 * newfiles/harmonize-core.ts validation, with namespace prefixes).
 */

const SCORE_PARTWISE_OPEN = /<(?:[\w.-]+:)?score-partwise\b/i;
const SCORE_TIMEWISE_OPEN = /<(?:[\w.-]+:)?score-timewise\b/i;

export function hasScorePartwiseMarker(xml: string): boolean {
  return typeof xml === "string" && xml.length > 0 && SCORE_PARTWISE_OPEN.test(xml);
}

export function hasScoreTimewiseMarker(xml: string): boolean {
  return typeof xml === "string" && xml.length > 0 && SCORE_TIMEWISE_OPEN.test(xml);
}

export function looksLikeMusicXml(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return hasScorePartwiseMarker(text) || hasScoreTimewiseMarker(text);
}
