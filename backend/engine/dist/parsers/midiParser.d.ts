/**
 * Parse MIDI → ParsedScore (canonical format)
 * Uses @tonejs/midi for parsing.
 * Format 1: track 0 may be meta-only; uses first track with notes.
 * Extracts key and time signature from header when available.
 */
import type { ParsedScore } from "../types.js";
/** Extract melody from first track with notes; key/time from header */
export declare function parseMIDI(buffer: Buffer): ParsedScore | null;
