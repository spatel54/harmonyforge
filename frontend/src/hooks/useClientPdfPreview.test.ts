/**
 * Tests for the PDF rasterization helper that powers Document's client-side PDF preview.
 *
 * The hook portion is integration-level (requires React + canvas), so we target
 * the exported `rasterizePdf` utility and mock `pdfjs-dist` + DOM canvas.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { rasterizePdf } from "./useClientPdfPreview";

describe("rasterizePdf", () => {
  const originalGlobal = globalThis as unknown as Record<string, unknown>;
  let savedDocument: unknown;

  beforeEach(() => {
    savedDocument = originalGlobal.document;
    const canvases: Array<{ getContext: () => unknown; toBlob: (cb: (b: Blob) => void) => void }> = [];
    originalGlobal.document = {
      createElement: (tag: string) => {
        if (tag !== "canvas") throw new Error(`unexpected tag ${tag}`);
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: () => {}, clearRect: () => {} }),
          toBlob: (cb: (b: Blob) => void) => cb(new Blob([new Uint8Array([0x89, 0x50])], { type: "image/png" })),
        };
        canvases.push(canvas);
        return canvas;
      },
    };
  });

  afterEach(() => {
    originalGlobal.document = savedDocument;
    vi.resetModules();
  });

  function mockPdfjs(pageCount: number) {
    const getPage = vi.fn(async (i: number) => ({
      getViewport: () => ({ width: 100, height: 140 }),
      render: () => ({ promise: Promise.resolve() }),
      pageIndex: i - 1,
    }));
    const loadingTask = {
      promise: Promise.resolve({ numPages: pageCount, getPage }),
    };
    const mod = {
      getDocument: vi.fn(() => loadingTask),
      GlobalWorkerOptions: {} as { workerSrc?: string },
    };
    vi.doMock("pdfjs-dist/legacy/build/pdf.mjs", () => mod);
    return mod;
  }

  it("renders a single-page PDF to one PNG blob", async () => {
    mockPdfjs(1);
    const pages = await rasterizePdf(new ArrayBuffer(8));
    expect(pages).toHaveLength(1);
    expect(pages[0]?.index).toBe(1);
    expect(pages[0]?.png.type).toBe("image/png");
    expect(pages[0]?.width).toBeGreaterThan(0);
  });

  it("renders every page of a multi-page PDF in order", async () => {
    mockPdfjs(3);
    const pages = await rasterizePdf(new ArrayBuffer(8));
    expect(pages.map((p) => p.index)).toEqual([1, 2, 3]);
  });

  it("caps the page count via maxPages", async () => {
    mockPdfjs(10);
    const pages = await rasterizePdf(new ArrayBuffer(8), { maxPages: 2 });
    expect(pages).toHaveLength(2);
  });
});
