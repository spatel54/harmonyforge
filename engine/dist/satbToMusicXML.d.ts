/**
 * SATB solver result → MusicXML (SATB grand staff)
 * Builds timewise MusicXML that preserves source melody rhythm when available.
 */
import type { SolverResult } from "./solver.js";
import type { ParsedScore, Voice } from "./types.js";
/** Options for MusicXML output format: partwise for MuseScore compatibility */
export interface SatbToMusicXMLOptions {
    format?: "timewise" | "partwise";
    version?: "2.0" | "3.0";
    /** When true and source has melody: output melody as first part, then add harmony parts (not replace) */
    additiveHarmonies?: boolean;
}
/** Build MusicXML string from SATB result. Outputs only parts with selected instruments. */
export declare function satbToMusicXML(result: SolverResult, instruments?: Record<Voice, string[]>, source?: ParsedScore, options?: SatbToMusicXMLOptions): string;
/**
 * Single-part partwise MusicXML 2.0 from ParsedScore (Document preview after PDF/MIDI/MXL intake).
 * No DOCTYPE so browsers avoid loading external DTDs.
 */
export declare function parsedScoreToPartwiseMelodyMusicXML(source: ParsedScore): string;
