/**
 * Melody-only MusicXML for reviewer-primary study arm (no generate-from-file).
 */

export function readMelodyXmlForReviewer(
  file: File,
  storePreviewXml: string | null,
): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (["xml", "musicxml"].includes(ext)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read score file."));
      reader.readAsText(file, "utf-8");
    });
  }
  if (storePreviewXml && storePreviewXml.trim().length > 0) {
    return Promise.resolve(storePreviewXml);
  }
  return Promise.reject(
    new Error(
      "No melody preview available. Go back to the playground and upload again.",
    ),
  );
}
