/**
 * Parser for score-timewise MusicXML.
 * Structure: measure → part → note (vs partwise: part → measure → note).
 * Uses fast-xml-parser — no DTD loading, handles namespaces.
 */
import type { ParsedScore } from "../types.js";
/**
 * Parse score-timewise MusicXML into ParsedScore.
 * Extracts melody from the first part in each measure.
 */
export declare function parseTimewiseMusicXML(xml: string): ParsedScore | null;
