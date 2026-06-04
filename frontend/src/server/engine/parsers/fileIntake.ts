/**
 * Unified buffer + filename → ParsedScore for generate / validate / CLI.
 * ZIP sniff (MXL mislabeled as .xml), PDF via Audiveris OMR, then extension routing.
 */

import { XMLParser } from "fast-xml-parser";
import type { ParsedScore } from "../types";
import {
  audiverisPipelineFailureMessage,
  DEFAULT_AUDIVERIS_MS,
  tryAudiverisOnImageBuffer,
  tryAudiverisOnPdfBuffer,
} from "./audiverisPipeline";
import { parseMIDI } from "./midiParser";
import { parseMusicXML } from "./musicxmlParser";
import { parseMXL } from "./mxlParser";
import { looksLikeMusicXml } from "./musicXmlMarkers";
import { mergeParsedScores } from "./mergeParsedScores";

export { looksLikeMusicXml, mergeParsedScores };

export const ACCEPTED_EXTENSIONS_MESSAGE =
  ".xml, .musicxml, .mxml, .mxl, .mid, .midi, or .pdf " +
  "(PDF → MusicXML requires Audiveris on the server — run `make audiveris-setup` locally or use self-hosted Docker)";

export interface IntakeFailure {
  status: number;
  error: string;
}

export type IntakeResult =
  | { ok: true; parsed: ParsedScore }
  | { ok: false; failure: IntakeFailure };

export interface IntakeOptions {
  /** When false, PDF buffers are rejected (e.g. validate-from-file). */
  allowPdfOm?: boolean;
  /** Wall-clock cap for Audiveris batch (ms). */
  audiverisTimeoutMs?: number;
  /** @deprecated Use audiverisTimeoutMs */
  omrTimeoutMs?: number;
  /** @deprecated Ignored — pdfalto removed */
  pdfAltoTimeoutMs?: number;
}

/** Local file header or empty/spanned ZIP signatures */
export function isProbablyZip(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) return false;
  const sig = buffer.readUInt16LE(2);
  return sig === 0x0403 || sig === 0x0605 || sig === 0x0807;
}

export function isProbablyPdf(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer.subarray(0, 4).toString("latin1") === "%PDF";
}

/** Standard MIDI file (SMF) header */
export function isProbablyMidi(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer.subarray(0, 4).toString("latin1") === "MThd";
}

/** PNG (\x89PNG\r\n\x1a\n) or JPEG SOI (FF D8 FF). */
export function isProbablyRasterImage(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }
  return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

/** Decode buffer as UTF-8 for MusicXML sniffing / parsing; strip BOM if present. */
export function bufferToUtf8ScoreText(buffer: Buffer): string {
  let b = buffer;
  if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) {
    b = b.subarray(3);
  }
  return b.toString("utf-8");
}

/** Decode only the start of the buffer for `looksLikeMusicXml` (avoid huge UTF-8 strings on random binaries). */
const MUSICXML_SNIFF_UTF8_MAX = 262_144;

function peekUtf8ForMusicXmlSniff(buffer: Buffer): string {
  let i = 0;
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    i = 3;
  }
  const end = Math.min(buffer.length, i + MUSICXML_SNIFF_UTF8_MAX);
  return buffer.subarray(i, end).toString("utf-8");
}

function tryIntakeMidi(buffer: Buffer): ParsedScore | null {
  const parsed = parseMIDI(buffer);
  return parsed && parsed.melody.length > 0 ? parsed : null;
}

function tryIntakeMusicXmlString(xml: string): ParsedScore | null {
  if (!xml || !xml.trim()) return null;
  let parsed = parseMusicXML(xml);
  if (parsed && parsed.melody.length > 0) return parsed;
  const embedded = extractEmbeddedMusicXml(xml);
  if (embedded) {
    parsed = parseMusicXML(embedded);
    if (parsed && parsed.melody.length > 0) return parsed;
  }
  return null;
}

function tryIntakeMusicXmlBuffer(buffer: Buffer): ParsedScore | null {
  const xml = bufferToUtf8ScoreText(buffer);
  return tryIntakeMusicXmlString(xml);
}

export function getExtension(originalname: string): string {
  return (originalname.split(".").pop() ?? "").toLowerCase();
}

function effectiveAudiverisTimeoutMs(options: IntakeOptions): number {
  return options.audiverisTimeoutMs ?? options.omrTimeoutMs ?? DEFAULT_AUDIVERIS_MS;
}

/**
 * Extract first score-partwise or score-timewise document from concatenated text (e.g. ALTO CONTENT).
 * Supports optional namespace prefixes on open/close tags (see harmonize-core / real-world exports).
 */
export function extractEmbeddedMusicXml(fullText: string): string | null {
  if (!fullText || typeof fullText !== "string") return null;
  const pwRe = /<(?:[\w.-]+:)?score-partwise\b/i;
  const twRe = /<(?:[\w.-]+:)?score-timewise\b/i;
  const mPw = pwRe.exec(fullText);
  const mTw = twRe.exec(fullText);
  let start: number;
  let local: "score-partwise" | "score-timewise";
  if (mPw && (!mTw || mPw.index <= mTw.index)) {
    start = mPw.index;
    local = "score-partwise";
  } else if (mTw) {
    start = mTw.index;
    local = "score-timewise";
  } else {
    return null;
  }
  const closeRe = new RegExp(`</(?:[\\w.-]+:)?${local}>`, "i");
  closeRe.lastIndex = start + 1;
  const mClose = closeRe.exec(fullText);
  if (!mClose) return null;
  return fullText.slice(start, mClose.index + mClose[0].length);
}

/** Collect text from ALTO String @CONTENT (handles default namespace). */
export function collectAltoTextContent(altoXml: string): string {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
  });
  let doc: unknown;
  try {
    doc = parser.parse(altoXml);
  } catch {
    return "";
  }
  const chunks: string[] = [];
  const walk = (node: unknown): void => {
    if (node == null) return;
    if (typeof node === "string") {
      chunks.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) {
      if (k === "String" || k.endsWith(":String")) {
        const arr = Array.isArray(v) ? v : [v];
        for (const s of arr) {
          if (s && typeof s === "object") {
            const r = s as Record<string, unknown>;
            const c = r["@_CONTENT"] ?? r["@_content"];
            if (typeof c === "string" && c.length) chunks.push(c);
          }
        }
      }
      walk(v);
    }
  };
  walk(doc);
  return chunks.join("\n");
}

/** Client- or server-rasterized PNG/JPG pages (e.g. from pdfjs) → Audiveris image OMR. */
export function intakeImagePagesToParsedScore(
  pages: Buffer[],
  options: Pick<IntakeOptions, "audiverisTimeoutMs" | "omrTimeoutMs"> = {},
): IntakeResult {
  if (pages.length === 0) {
    return {
      ok: false,
      failure: { status: 400, error: "No page images uploaded" },
    };
  }
  const timeoutMs = effectiveAudiverisTimeoutMs(options);
  const details: string[] = [];
  const parsed: ParsedScore[] = [];

  for (let i = 0; i < pages.length; i++) {
    const buf = pages[i]!;
    if (!isProbablyRasterImage(buf)) {
      details.push(`page ${i + 1}: not a PNG/JPG — skipped`);
      continue;
    }
    const ext = buf[0] === 0xff ? "jpg" : "png";
    const { parsed: one, details: pageDetails } = tryAudiverisOnImageBuffer(buf, ext, timeoutMs);
    details.push(...pageDetails);
    if (one && one.melody.length > 0) parsed.push(one);
  }

  const merged = mergeParsedScores(parsed);
  if (merged && merged.melody.length > 0) {
    return { ok: true, parsed: merged };
  }
  return {
    ok: false,
    failure: {
      status: 501,
      error: audiverisPipelineFailureMessage(details),
    },
  };
}

export async function intakeFileToParsedScore(
  buffer: Buffer,
  originalname: string,
  options: IntakeOptions,
): Promise<IntakeResult> {
  const ext = getExtension(originalname);
  const audiverisMs = effectiveAudiverisTimeoutMs(options);

  if (isProbablyRasterImage(buffer) || ["png", "jpg", "jpeg"].includes(ext)) {
    if (!options.allowPdfOm) {
      return {
        ok: false,
        failure: {
          status: 501,
          error:
            "Image OMR is not supported on this route. Upload MusicXML, MXL, MIDI, or PDF via /api/generate-from-file.",
        },
      };
    }
    const imageExt = (ext === "jpeg" ? "jpg" : ext) as "png" | "jpg" | "jpeg";
    const { parsed, details } = tryAudiverisOnImageBuffer(buffer, imageExt, audiverisMs);
    if (parsed && parsed.melody.length > 0) {
      return { ok: true, parsed };
    }
    return {
      ok: false,
      failure: {
        status: 501,
        error: audiverisPipelineFailureMessage(details),
      },
    };
  }

  if (isProbablyZip(buffer)) {
    const parsed = parseMXL(buffer);
    if (parsed && parsed.melody.length > 0) {
      return { ok: true, parsed };
    }
    return {
      ok: false,
      failure: {
        status: 422,
        error:
          "Could not parse file or no melody found (if this is MXL, ensure it is valid compressed MusicXML)",
      },
    };
  }

  const treatAsPdf = isProbablyPdf(buffer) || ext === "pdf";
  if (treatAsPdf) {
    if (!options.allowPdfOm) {
      return {
        ok: false,
        failure: {
          status: 501,
          error:
            "PDF validation is not supported. Upload MusicXML, MXL, or MIDI for validation, or generate from PDF via /api/generate-from-file.",
        },
      };
    }
    const { parsed, details } = await tryAudiverisOnPdfBuffer(buffer, audiverisMs);
    if (parsed && parsed.melody.length > 0) {
      return { ok: true, parsed };
    }
    return {
      ok: false,
      failure: {
        status: 501,
        error: audiverisPipelineFailureMessage(details),
      },
    };
  }

  if (isProbablyMidi(buffer) || ["mid", "midi"].includes(ext)) {
    const parsed = tryIntakeMidi(buffer);
    if (parsed) return { ok: true, parsed };
    return {
      ok: false,
      failure: {
        status: 422,
        error: "Could not parse file or no melody found",
      },
    };
  }

  const musicXmlExts = ["xml", "musicxml", "mxml"];
  const utf8ForSniff = peekUtf8ForMusicXmlSniff(buffer);
  const shouldTryMusicXml =
    musicXmlExts.includes(ext) ||
    (ext === "mxl" && !isProbablyZip(buffer)) ||
    looksLikeMusicXml(utf8ForSniff);

  if (shouldTryMusicXml) {
    const parsed = tryIntakeMusicXmlBuffer(buffer);
    if (parsed) return { ok: true, parsed };
    if (ext === "mxl") {
      const fromZip = parseMXL(buffer);
      if (fromZip && fromZip.melody.length > 0) {
        return { ok: true, parsed: fromZip };
      }
    }
    return {
      ok: false,
      failure: {
        status: 422,
        error: "Could not parse file or no melody found",
      },
    };
  }

  const fallbackMidi = tryIntakeMidi(buffer);
  if (fallbackMidi) return { ok: true, parsed: fallbackMidi };

  const fallbackXml = tryIntakeMusicXmlBuffer(buffer);
  if (fallbackXml) return { ok: true, parsed: fallbackXml };

  return {
    ok: false,
    failure: {
      status: 400,
      error: `Unsupported format: .${ext || "(no extension)"}. Use ${ACCEPTED_EXTENSIONS_MESSAGE}.`,
    },
  };
}
