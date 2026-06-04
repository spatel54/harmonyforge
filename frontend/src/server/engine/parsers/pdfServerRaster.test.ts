import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isLikelyRasterImagePdf,
  rasterizePdfBufferToPngPages,
} from "./pdfServerRaster";

const FIXTURE_DIR = dirname(fileURLToPath(import.meta.url));
const FIXTURE_IMG9642 = join(FIXTURE_DIR, "fixtures/IMG_9642.pdf");
const FIXTURE_PDF = "/Users/dvgenis/Desktop/JPEG image.pdf";

describe("isLikelyRasterImagePdf", () => {
  it("detects photo-style PDFs with a large embedded image", () => {
    if (existsSync(FIXTURE_PDF)) {
      expect(isLikelyRasterImagePdf(readFileSync(FIXTURE_PDF))).toBe(true);
      return;
    }
    const buf = Buffer.from(
      "%PDF-1.3\n1 0 obj<</Subtype/Image/Width 1512/Height 488/Filter/FlateDecode>>stream\n",
      "latin1",
    );
    expect(isLikelyRasterImagePdf(buf)).toBe(true);
  });

  it("returns false for minimal vector PDF stub", () => {
    expect(isLikelyRasterImagePdf(Buffer.from("%PDF-1.4\n%%EOF\n"))).toBe(false);
  });

  it("detects macOS photo PDF fixture IMG_9642", () => {
    if (!existsSync(FIXTURE_IMG9642)) return;
    expect(isLikelyRasterImagePdf(readFileSync(FIXTURE_IMG9642))).toBe(true);
  });
});

describe("rasterizePdfBufferToPngPages", () => {
  it("renders a one-page photo PDF to PNG", async () => {
    if (!existsSync(FIXTURE_PDF)) return;
    const pages = await rasterizePdfBufferToPngPages(readFileSync(FIXTURE_PDF), {
      maxPages: 1,
    });
    expect(pages).toHaveLength(1);
    expect(pages[0]!.png.length).toBeGreaterThan(10_000);
    expect(pages[0]!.width).toBeGreaterThan(100);
  });
});
