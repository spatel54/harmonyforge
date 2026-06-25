/**
 * Server-side PDF → PNG rasterization for OMR (photo/scanned PDFs and image-only exports).
 * Uses pdfjs-dist + @napi-rs/canvas (same stack as client preview, runs in Node API routes).
 */

import { createCanvas } from "@napi-rs/canvas";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

export type RasterizedPdfPage = {
  pageIndex: number;
  png: Buffer;
  width: number;
  height: number;
};

export type RasterizePdfOptions = {
  /** Max pages to render (default 8). */
  maxPages?: number;
  /** Longest edge in pixels after render (default 2400). */
  maxEdgePx?: number;
  /** Initial render scale before downscale (default 2). */
  scale?: number;
};

const DEFAULT_MAX_PAGES = 8;
const DEFAULT_MAX_EDGE_PX = 2400;
const DEFAULT_SCALE = 2;

const PDFJS_PKG = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../node_modules/pdfjs-dist",
);
const PDFJS_WORKER_URL = pathToFileURL(join(PDFJS_PKG, "legacy/build/pdf.worker.mjs")).href;

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  }
  return pdfjs;
}

function scaleForMaxEdge(width: number, height: number, maxEdgePx: number, baseScale: number): number {
  const w = width * baseScale;
  const h = height * baseScale;
  const edge = Math.max(w, h);
  if (edge <= maxEdgePx) return baseScale;
  return baseScale * (maxEdgePx / edge);
}

/**
 * Render PDF pages to PNG buffers suitable for Audiveris image OMR.
 */
export async function rasterizePdfBufferToPngPages(
  buffer: Buffer,
  options: RasterizePdfOptions = {},
): Promise<RasterizedPdfPage[]> {
  const maxPages = Math.max(1, options.maxPages ?? DEFAULT_MAX_PAGES);
  const maxEdgePx = Math.max(400, options.maxEdgePx ?? DEFAULT_MAX_EDGE_PX);
  const baseScale = Math.max(0.5, options.scale ?? DEFAULT_SCALE);

  const { getDocument } = await loadPdfJs();
  const data = new Uint8Array(buffer);
  const doc = await getDocument({ data, disableFontFace: true }).promise;

  const out: RasterizedPdfPage[] = [];
  const pageCount = Math.min(doc.numPages, maxPages);

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const baseVp = page.getViewport({ scale: 1 });
    const scale = scaleForMaxEdge(baseVp.width, baseVp.height, maxEdgePx, baseScale);
    const viewport = page.getViewport({ scale });
    const w = Math.ceil(viewport.width);
    const h = Math.ceil(viewport.height);
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create 2D canvas for PDF rasterization");
    }
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;
    out.push({
      pageIndex: i,
      png: canvas.toBuffer("image/png"),
      width: w,
      height: h,
    });
  }

  return out;
}

export { isLikelyRasterImagePdf } from "./pdfRasterHeuristic";
