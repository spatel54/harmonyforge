/**
 * Appends short, actionable hints when server-side preview intake fails
 * (PDF, MXL/MIDI, mislabeled ZIP-as-.xml, .txt/.mxml, etc.).
 *
 * Post-consolidation: the engine runs inside the Next.js app, so the host’s
 * PDF/OMR tooling (pdfalto + Poppler + oemer) determines whether PDF preview
 * actually works. We detect four common classes and tailor the hint.
 */

const PDF_TOOLING_HINT =
  "PDF → MusicXML needs pdfalto + Poppler (pdftoppm) + Python oemer on the server. " +
  "Use the self-hosted Docker image (see docs/deployment.md) for guaranteed support, " +
  "or export your score as MusicXML/MXL/MIDI for fastest results.";

const PDF_PAGE_RENDERED_HINT =
  "The browser already rasterized the PDF; upload should retry with pre-rendered PNGs. " +
  "If this keeps failing, the server host lacks oemer.";

const PDF_OMR_CHECKPOINTS_HINT =
  "oemer was invoked but failed — usually because ONNX checkpoints could not be downloaded. " +
  "Run `make preflight-omr` on the host, or set OEMER_CHECKPOINT_DIR to a writable volume.";

const PDF_NO_STAVES_HINT =
  "OMR ran but found no musical staves on the page. If the PDF is scanned, make sure the scan is " +
  "upright, high-contrast, and contains a single-line melody.";

const GENERIC_NON_XML_HINT =
  "Non-XML previews are built by the app at POST /api/to-preview-musicxml — ensure the app server is running.";

/** Stable anchor in-repo (for contributors); shown in Playground error panel. */
export const INTAKE_TROUBLESHOOTING_PATH = "docs/progress.md#multi-format-pdf-intake";

function classifyPdfError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("oemer: no .musicxml") || m.includes("no readable notation")) {
    return PDF_NO_STAVES_HINT;
  }
  if (m.includes("oemer:") || m.includes("checkpoint")) {
    return PDF_OMR_CHECKPOINTS_HINT;
  }
  if (m.includes("pdfalto:") || m.includes("pdftoppm")) {
    return PDF_TOOLING_HINT;
  }
  if (m.includes("pre-rasteriz") || m.includes("page image")) {
    return PDF_PAGE_RENDERED_HINT;
  }
  return PDF_TOOLING_HINT;
}

export function enrichIntakePreviewError(message: string, fileExt: string): string {
  const ext = fileExt.toLowerCase().replace(/^\./, "");
  const base = message.trim() || "Preview failed";
  if (ext === "xml" || ext === "musicxml") {
    return base;
  }
  if (ext === "pdf") {
    return `${base}\n\n${classifyPdfError(base)}\nMore: ${INTAKE_TROUBLESHOOTING_PATH}`;
  }
  return `${base}\n\n${GENERIC_NON_XML_HINT}\nMore: ${INTAKE_TROUBLESHOOTING_PATH}`;
}
