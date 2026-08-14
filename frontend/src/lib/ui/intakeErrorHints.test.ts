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

  it("does not classify successful pdf-raster lines as canvas failure", () => {
    const out = enrichIntakePreviewError(
      "PDF could not be converted to MusicXML.\n\nDetails:\n- pdf-raster: rendered 1 page(s) for OMR (1224×1584px)\n- page 1: audiveris: binary not found",
      "pdf",
    );
    expect(out).not.toContain("@napi-rs/canvas");
    expect(out).toContain("Audiveris");
  });

  it("classifies pdf-raster exceptions as canvas deps failure", () => {
    const out = enrichIntakePreviewError(
      "Details:\n- pdf-raster: Cannot find module '@napi-rs/canvas'",
      "pdf",
    );
    expect(out).toContain("@napi-rs/canvas");
  });

  it("classifies binary not found as Audiveris setup", () => {
    const out = enrichIntakePreviewError(
      "audiveris: binary not found — run `make audiveris-setup`",
      "pdf",
    );
    expect(out).toContain("make audiveris-setup");
    expect(out).not.toContain("@napi-rs/canvas");
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
