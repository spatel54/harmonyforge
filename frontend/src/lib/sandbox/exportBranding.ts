/**
 * Attribution embedded in sandbox exports (print footer, MusicXML, MIDI, WAV).
 */

export const HARMONYFORGE_EXPORT_BRAND = "HarmonyForge";
export const HARMONYFORGE_EXPORT_ATTRIBUTION = "from HarmonyForge";
export const HARMONYFORGE_EXPORT_ATTRIBUTION_LONG = `Exported from ${HARMONYFORGE_EXPORT_BRAND}`;

/** MusicXML `<identification>` block (OSMD ignores it for engraving). */
export function musicXmlIdentificationBlock(encodingDate?: string): string {
  const date = encodingDate ?? new Date().toISOString().slice(0, 10);
  return `  <identification>
    <creator type="software">${HARMONYFORGE_EXPORT_BRAND}</creator>
    <encoding>
      <software>${HARMONYFORGE_EXPORT_BRAND}</software>
      <encoding-date>${date}</encoding-date>
    </encoding>
  </identification>`;
}

/** Insert export identification after `<work>` when present. */
export function injectMusicXmlExportBranding(
  xml: string,
  encodingDate?: string,
): string {
  if (xml.includes("<identification>")) return xml;
  const block = musicXmlIdentificationBlock(encodingDate);
  const workClose = "</work>";
  if (xml.includes(workClose)) {
    return xml.replace(workClose, `${workClose}\n${block}`);
  }
  return xml.replace(/<score-partwise[^>]*>\s*/i, (m) => `${m}${block}\n`);
}
