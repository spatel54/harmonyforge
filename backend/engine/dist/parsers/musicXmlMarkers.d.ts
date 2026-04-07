/**
 * Detect MusicXML document roots (aligned with newfiles/harmonize-core validation, extended for
 * namespace prefixes and case variants exporters sometimes emit).
 */
export declare function hasScorePartwiseMarker(xml: string): boolean;
export declare function hasScoreTimewiseMarker(xml: string): boolean;
/** True if buffer text looks like a MusicXML score (partwise or timewise root). */
export declare function looksLikeMusicXml(text: string): boolean;
