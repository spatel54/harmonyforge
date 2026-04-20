import { describe, expect, it } from "vitest";
import { needsEnginePreviewForExtension } from "./needsEnginePreviewForExtension";

/**
 * Canonical intake contract (post-consolidation): every upload is normalized
 * through the server's /api/to-preview-musicxml so Document + Generate run
 * against the same parsed representation. The helper therefore always returns
 * true — it is kept as a named function so callers stay self-documenting.
 */
describe("needsEnginePreviewForExtension", () => {
  it("always routes through server intake regardless of extension", () => {
    for (const ext of [
      "xml",
      "musicxml",
      "XML",
      "mxml",
      "txt",
      "mid",
      "midi",
      "mxl",
      "pdf",
      "png",
      "jpg",
      "",
      "blob",
    ]) {
      expect(needsEnginePreviewForExtension(ext)).toBe(true);
    }
  });
});
