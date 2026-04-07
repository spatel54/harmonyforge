/**
 * Detect MusicXML document roots (aligned with newfiles/harmonize-core validation, extended for
 * namespace prefixes and case variants exporters sometimes emit).
 */

const SCORE_PARTWISE_OPEN = /<(?:[\w.-]+:)?score-partwise\b/i;
const SCORE_TIMEWISE_OPEN = /<(?:[\w.-]+:)?score-timewise\b/i;

export function hasScorePartwiseMarker(xml: string): boolean {
  return typeof xml === "string" && xml.length > 0 && SCORE_PARTWISE_OPEN.test(xml);
}

export function hasScoreTimewiseMarker(xml: string): boolean {
  return typeof xml === "string" && xml.length > 0 && SCORE_TIMEWISE_OPEN.test(xml);
}

/** True if buffer text looks like a MusicXML score (partwise or timewise root). */
export function looksLikeMusicXml(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return hasScorePartwiseMarker(text) || hasScoreTimewiseMarker(text);
}
