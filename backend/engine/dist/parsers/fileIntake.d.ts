/**
 * Unified buffer + filename → ParsedScore for generate / validate / CLI.
 * ZIP sniff (MXL mislabeled as .xml), PDF via pdfalto (ALTO + embedded MusicXML) + poppler + oemer, then extension routing.
 */
import type { ParsedScore } from "../types.js";
import { looksLikeMusicXml } from "./musicXmlMarkers.js";
export { looksLikeMusicXml };
export declare const ACCEPTED_EXTENSIONS_MESSAGE = ".xml, .musicxml, .mxml, .mxl, .mid, .midi, or .pdf (PDF needs pdfalto, Poppler pdftoppm, and oemer on the server; see docs)";
export interface IntakeFailure {
    status: number;
    error: string;
}
export type IntakeResult = {
    ok: true;
    parsed: ParsedScore;
} | {
    ok: false;
    failure: IntakeFailure;
};
export interface IntakeOptions {
    /** When false, PDF buffers are rejected (e.g. validate-from-file). */
    allowPdfOm?: boolean;
    pdfAltoTimeoutMs?: number;
    omrTimeoutMs?: number;
}
/** Local file header or empty/spanned ZIP signatures */
export declare function isProbablyZip(buffer: Buffer): boolean;
export declare function isProbablyPdf(buffer: Buffer): boolean;
/** Standard MIDI file (SMF) header */
export declare function isProbablyMidi(buffer: Buffer): boolean;
/** Decode buffer as UTF-8 for MusicXML sniffing / parsing; strip BOM if present. */
export declare function bufferToUtf8ScoreText(buffer: Buffer): string;
export declare function getExtension(originalname: string): string;
/**
 * Extract first score-partwise or score-timewise document from concatenated text (e.g. ALTO CONTENT).
 * Supports optional namespace prefixes on open/close tags (see harmonize-core / real-world exports).
 */
export declare function extractEmbeddedMusicXml(fullText: string): string | null;
/** Collect text from ALTO String @CONTENT (handles default namespace). */
export declare function collectAltoTextContent(altoXml: string): string;
export declare function intakeFileToParsedScore(buffer: Buffer, originalname: string, options: IntakeOptions): IntakeResult;
