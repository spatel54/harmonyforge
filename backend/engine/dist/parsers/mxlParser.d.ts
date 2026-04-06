/**
 * Parse MXL (compressed MusicXML) → ParsedScore.
 * MXL is a ZIP containing META-INF/container.xml and the root MusicXML file.
 */
import type { ParsedScore } from "../types.js";
/**
 * Extract MusicXML from MXL buffer and parse to ParsedScore.
 */
export declare function parseMXL(buffer: Buffer): ParsedScore | null;
