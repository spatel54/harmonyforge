import { describe, expect, it } from "vitest";
import { enrichIntakePreviewError, INTAKE_TROUBLESHOOTING_PATH } from "./intakeErrorHints";

describe("enrichIntakePreviewError", () => {
  it("appends PDF and doc hint for pdf extension", () => {
    const out = enrichIntakePreviewError("OMR failed", "pdf");
    expect(out).toContain("OMR failed");
    expect(out).toContain("pdfalto");
    expect(out).toContain(INTAKE_TROUBLESHOOTING_PATH);
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
