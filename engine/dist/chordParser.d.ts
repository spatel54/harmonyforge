/**
 * HarmonyForge Logic Core — Roman numeral chord parser
 * Maps Roman numerals to pitch classes given key context.
 * Supports: I, ii, iii, IV, V, vi, vii°, V7, ii7, iiø7, inversions (6, 6/4, 6/5, 4/3, 4/2)
 */
import type { KeyContext, ParsedChord } from "./types.js";
/** Parse Roman numeral to ParsedChord */
export declare function parseChord(roman: string, key: KeyContext): ParsedChord;
