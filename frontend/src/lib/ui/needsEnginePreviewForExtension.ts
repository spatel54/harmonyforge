/**
 * Playground: only `.xml` / `.musicxml` are parsed client-side for preview.
 * All other extensions (including `.mxml`, `.txt`, empty, MIDI, MXL, PDF) go through
 * POST /api/to-preview-musicxml so the engine can sniff ZIP/MIDI/MusicXML content.
 */
export function needsEnginePreviewForExtension(ext: string): boolean {
  const e = ext.toLowerCase();
  return e !== "xml" && e !== "musicxml";
}
