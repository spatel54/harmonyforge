/**
 * Fallback parser for score-partwise MusicXML.
 * Used when musicxml-interfaces fails (e.g. xsltproc not installed on macOS).
 * Uses fast-xml-parser — no DTD loading, no external deps.
 */
import type { ParsedScore } from "../types.js";
/**
 * Parse score-partwise MusicXML into ParsedScore.
 * Extracts melody from the first part.
 * Handles namespaced XML, grace notes (skipped), chords (first pitch).
 */
export declare function parsePartwiseMusicXML(xml: string): ParsedScore | null;
