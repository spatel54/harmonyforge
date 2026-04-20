import { describe, expect, it } from "vitest";
import { enrichIntakePreviewError, INTAKE_TROUBLESHOOTING_PATH } from "./intakeErrorHints";

describe("enrichIntakePreviewError", () => {
  it("appends PDF and doc hint for pdf extension", () => {
    const out = enrichIntakePreviewError("OMR failed", "pdf");
    expect(out).toContain("OMR failed");
    expect(out).toContain("pdfalto");
    expect(out).toContain(INTAKE_TROUBLESHOOTING_PATH);
  });

  it("classifies oemer checkpoint errors distinctly", () => {
    const out = enrichIntakePreviewError(
      "oemer: failed to download checkpoint",
      "pdf",
    );
    expect(out).toContain("OEMER_CHECKPOINT_DIR");
  });

  it("classifies empty-score errors distinctly", () => {
    const out = enrichIntakePreviewError(
      "oemer: no .musicxml/.xml files in output (OMR may have failed silently)",
      "pdf",
    );
    expect(out).toContain("no musical staves");
  });

  it("appends engine hint for mxl and txt", () => {
    for (const ext of ["mxl", "txt", "mxml"]) {
      const out = enrichIntakePreviewError("Bad gateway", ext);
      expect(out).toContain("to-preview-musicxml");
      expect(out).toContain(INTAKE_TROUBLESHOOTING_PATH);
    }
  });

  it("returns message only for xml", () => {
    expect(enrichIntakePreviewError("x", "xml")).toBe("x");
  });
});
