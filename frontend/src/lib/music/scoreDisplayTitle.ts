/**
 * Choose a human-visible score title from the upload name + MusicXML metadata.
 * Audiveris often leaves work-title empty, sets it to "Score", or puts a
 * leftover glyph in movement-title — none of those should beat the filename.
 */

const GENERIC_TITLES = new Set([
  "score",
  "untitled",
  "untitled score",
  "music",
  "piece",
  "document",
  "unknown",
  "melody",
  "new score",
]);

export function uploadedFileStem(fileName: string | null | undefined): string | null {
  if (!fileName) return null;
  const stem = fileName.replace(/^.*[/\\]/, "").replace(/\.[^/.]+$/, "").trim();
  return stem.length > 0 ? stem : null;
}

/** True when a MusicXML title is worth showing (not empty, generic, or a stray glyph). */
export function isUsableScoreTitle(raw: string | null | undefined): boolean {
  const t = raw?.replace(/\s+/g, " ").trim() ?? "";
  if (t.length < 2) return false;
  if (!/[A-Za-z0-9]/.test(t)) return false;
  return !GENERIC_TITLES.has(t.toLowerCase());
}

export function deriveDisplayScoreTitle(opts: {
  fileName?: string | null;
  xmlTitle?: string | null;
  xmlMeta?: string | null;
  partNames?: string[];
}): string | null {
  const fileTitle = uploadedFileStem(opts.fileName);
  const rawMetaTitle = opts.xmlTitle?.replace(/\s+/g, " ").trim() ?? "";

  if (!isUsableScoreTitle(rawMetaTitle)) {
    return fileTitle;
  }

  const normalizedMetaTitle = rawMetaTitle.toLowerCase();
  const partNames = (opts.partNames ?? [])
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length > 0);

  if (partNames.includes(normalizedMetaTitle)) {
    return fileTitle ?? rawMetaTitle;
  }

  const normalizedMetaLine = (opts.xmlMeta ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  if (
    normalizedMetaLine.startsWith(`${normalizedMetaTitle} •`) ||
    normalizedMetaLine.startsWith(`${normalizedMetaTitle}·`) ||
    normalizedMetaLine.startsWith(`${normalizedMetaTitle} -`)
  ) {
    return fileTitle ?? rawMetaTitle;
  }

  return rawMetaTitle;
}
