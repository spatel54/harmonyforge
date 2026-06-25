/**
 * Parse MXL (compressed MusicXML) → ParsedScore.
 * MXL is a ZIP containing META-INF/container.xml and the root MusicXML file.
 */

import AdmZip from "adm-zip";
import { parseMusicXML } from "./musicxmlParser";
import type { ParsedScore } from "../types";

function getRootfilePath(containerXml: string): string | null {
  const match = containerXml.match(/<rootfile\s+[^>]*full-path="([^"]+)"/);
  if (match) return match[1];
  const alt = containerXml.match(/full-path='([^']+)'/);
  return alt ? alt[1] : null;
}

/** Extract raw MusicXML string from an MXL (ZIP) buffer. */
export function extractMusicXmlFromMxlBuffer(buffer: Buffer): string | null {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    let containerXml: string | null = null;
    const xmlEntries: { path: string; content: string }[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const name = entry.entryName;
      const content = entry.getData().toString("utf-8");
      if (name === "META-INF/container.xml" || name.endsWith("/container.xml")) {
        containerXml = content;
      }
      if (name.endsWith(".xml") || name.endsWith(".musicxml")) {
        xmlEntries.push({ path: name, content });
      }
    }

    if (containerXml) {
      const rootPath = getRootfilePath(containerXml);
      if (rootPath) {
        const found = xmlEntries.find(
          (e) => e.path === rootPath || e.path.endsWith(rootPath),
        );
        if (found) return found.content;
      }
    }
    return xmlEntries[0]?.content ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract MusicXML from MXL buffer and parse to ParsedScore.
 */
export function parseMXL(buffer: Buffer): ParsedScore | null {
  const xmlContent = extractMusicXmlFromMxlBuffer(buffer);
  if (!xmlContent) return null;
  return parseMusicXML(xmlContent);
}
