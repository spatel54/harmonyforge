/**
 * Appends short, actionable hints when server-side preview intake fails
 * (PDF, MXL/MIDI, mislabeled ZIP-as-.xml, .txt/.mxml, etc.).
 *
 * PDF → MusicXML requires Audiveris on the server host (Java 25+).
 */

const PDF_AUDIVERIS_HINT =
  "PDF → MusicXML needs Audiveris on the server. " +
  "Run `make audiveris-setup` locally (Java 25+) or use the self-hosted Docker image (see docs/deployment.md). " +
  "For fastest results, export your score as MusicXML/MXL/MIDI.";

const PDF_JAVA_HINT =
  "Audiveris requires Java 25 or newer. Install a JDK (e.g. brew install openjdk@25) and re-run `make audiveris-setup`.";

const PDF_NO_OUTPUT_HINT =
  "Audiveris ran but produced no readable MusicXML. Ensure the PDF is upright, high-contrast, and contains notated staves. " +
  "Phone photos saved as PDF work best when the full staff is visible and in focus; MusicXML/MXL is still fastest.";

const PDF_RASTER_DEPS_HINT =
  "Server PDF rasterization failed (@napi-rs/canvas). From the repo root run `make install` (or `cd frontend && npm install`), restart `make dev`, then retry. " +
  "If it still fails, export MusicXML/MXL from your notation app.";

const GENERIC_NON_XML_HINT =
  "The app converts these files on the server (POST /api/to-preview-musicxml). If you’re local, confirm `npm run dev` is running; use plain .xml/.musicxml for the fastest path.";

/** Stable anchor in-repo (for contributors); shown in Playground error panel. */
export const INTAKE_TROUBLESHOOTING_PATH = "docs/progress.md#wl-export-audiveris-2026-06-03";

function classifyPdfError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("@napi-rs/canvas") ||
    m.includes("skia.darwin") ||
    m.includes("pdf-raster:") ||
    (m.includes("module_not_found") && m.includes("canvas"))
  ) {
    return PDF_RASTER_DEPS_HINT;
  }
  if (m.includes("no musicxml") || m.includes("no readable notation") || m.includes("no .omr")) {
    return PDF_NO_OUTPUT_HINT;
  }
  if (
    m.includes("java") &&
    (m.includes("not installed") ||
      m.includes("required") ||
      m.includes("no java runtime") ||
      m.includes("could not detect java"))
  ) {
    return PDF_JAVA_HINT;
  }
  if (m.includes("unable to locate a java runtime")) {
    return PDF_JAVA_HINT;
  }
  if (m.includes("audiveris")) {
    return PDF_AUDIVERIS_HINT;
  }
  if (m.includes("preview failed: 500") || m === "500") {
    return PDF_RASTER_DEPS_HINT;
  }
  return PDF_AUDIVERIS_HINT;
}

export function enrichIntakePreviewError(message: string, fileExt: string): string {
  const ext = fileExt.toLowerCase().replace(/^\./, "");
  const base = message.trim() || "We couldn’t prepare a preview.";
  if (ext === "xml" || ext === "musicxml") {
    return base;
  }
  if (ext === "pdf") {
    return `${base}\n\n${classifyPdfError(base)}\nMore: ${INTAKE_TROUBLESHOOTING_PATH}`;
  }
  return `${base}\n\n${GENERIC_NON_XML_HINT}\nMore: ${INTAKE_TROUBLESHOOTING_PATH}`;
}
