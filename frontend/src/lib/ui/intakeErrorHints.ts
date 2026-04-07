/**
 * Appends short, actionable hints when server-side preview intake fails
 * (PDF, MXL/MIDI, mislabeled ZIP-as-.xml, .txt/.mxml, etc.).
 * See docs/progress.md#multi-format-pdf-intake.
 */

const PDF_HINT =
  "PDF preview needs the engine host with pdfalto, Poppler (pdftoppm), and Python oemer (3.10–12; checkpoints on first run). " +
  "Try MusicXML or MXL if setup is incomplete.";

const GENERIC_NON_XML_HINT =
  "Non-XML previews are built by the engine at POST /api/to-preview-musicxml — ensure the backend is running and NEXT_PUBLIC_API_URL points to it.";

/** Stable anchor in-repo (for contributors); shown in Playground error panel. */
export const INTAKE_TROUBLESHOOTING_PATH = "docs/progress.md#multi-format-pdf-intake";

export function enrichIntakePreviewError(message: string, fileExt: string): string {
  const ext = fileExt.toLowerCase().replace(/^\./, "");
  const base = message.trim() || "Preview failed";
  if (ext === "xml" || ext === "musicxml") {
    return base;
  }
  if (ext === "pdf") {
    return `${base}\n\n${PDF_HINT}\nMore: ${INTAKE_TROUBLESHOOTING_PATH}`;
  }
  return `${base}\n\n${GENERIC_NON_XML_HINT}\nMore: ${INTAKE_TROUBLESHOOTING_PATH}`;
}
