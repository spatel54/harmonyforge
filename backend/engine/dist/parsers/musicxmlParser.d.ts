/**
 * Parse MusicXML → ParsedScore (canonical format)
 * Supports score-partwise and score-timewise. Uses fast-xml-parser (no DTD loading).
 * Falls back to musicxml-interfaces only when custom parsers fail.
 */
import type { ParsedScore } from "../types.js";
export declare function parseMusicXML(xml: string): ParsedScore | null;
