import { describe, expect, it } from "vitest";
import { needsEnginePreviewForExtension } from "./needsEnginePreviewForExtension";

describe("needsEnginePreviewForExtension", () => {
  it("is false only for xml and musicxml", () => {
    expect(needsEnginePreviewForExtension("xml")).toBe(false);
    expect(needsEnginePreviewForExtension("musicxml")).toBe(false);
    expect(needsEnginePreviewForExtension("XML")).toBe(false);
  });

  it("is true for everything else", () => {
    expect(needsEnginePreviewForExtension("mxml")).toBe(true);
    expect(needsEnginePreviewForExtension("txt")).toBe(true);
    expect(needsEnginePreviewForExtension("mid")).toBe(true);
    expect(needsEnginePreviewForExtension("mxl")).toBe(true);
    expect(needsEnginePreviewForExtension("pdf")).toBe(true);
    expect(needsEnginePreviewForExtension("")).toBe(true);
    expect(needsEnginePreviewForExtension("blob")).toBe(true);
  });
});
