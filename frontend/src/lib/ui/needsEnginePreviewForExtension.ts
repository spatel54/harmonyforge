/**
 * Always build preview via the server intake path.
 *
 * This normalizes all uploads (including `.xml`/`.musicxml`) into a canonical melody MusicXML
 * so Document + Generate run against the same parsed representation.
 */
export function needsEnginePreviewForExtension(ext: string): boolean {
  void ext;
  return true;
}
