/**
 * Apply export/preview display preferences to partwise MusicXML (OSMD / print).
 */

/** Remove all &lt;harmony&gt; blocks so chord symbols are hidden in preview/print. */
export function stripHarmonyFromMusicXml(xml: string): string {
  return xml.replace(/<harmony\b[^>]*>[\s\S]*?<\/harmony>\s*/gi, "");
}

export type ExportDisplayPreferences = {
  showChordSymbols: boolean;
};

export function musicXmlForExportDisplay(
  xml: string,
  prefs: ExportDisplayPreferences,
): string {
  if (prefs.showChordSymbols) return xml;
  return stripHarmonyFromMusicXml(xml);
}
