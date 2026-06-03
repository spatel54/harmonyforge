import { describe, expect, it } from "vitest";
import { enrichIntakePreviewError, INTAKE_TROUBLESHOOTING_PATH } from "./intakeErrorHints";

describe("enrichIntakePreviewError", () => {
  it("appends Audiveris hint for pdf extension", () => {
    const out = enrichIntakePreviewError("OMR failed", "pdf");
    expect(out).toContain("OMR failed");
    expect(out).toContain("Audiveris");
    expect(out).toContain(INTAKE_TROUBLESHOOTING_PATH);
  });

  it("classifies missing MusicXML output distinctly", () => {
    const out = enrichIntakePreviewError(
      "audiveris: no MusicXML (.xml/.mxl) produced in output directory",
      "pdf",
    );
    expect(out).toContain("no readable MusicXML");
  });

  it("classifies empty-score errors distinctly", () => {
    const out = enrichIntakePreviewError(
      "audiveris: no .omr book produced after import",
      "pdf",
    );
    expect(out).toContain("no readable MusicXML");
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
