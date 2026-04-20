"use client";

/**
 * Client-side PDF rasterization for the HarmonyForge intake pipeline.
 *
 * Why client-side?
 * - Browsers can run `pdfjs-dist` without native tooling, so uploading a PDF always
 *   yields a visible preview page on Document.
 * - When the server lacks Poppler (`pdftoppm`) — e.g. Vercel serverless — the route
 *   handler can still run `oemer` on the pre-rasterized PNGs sent from here.
 * - Multi-page PDFs are supported: each page becomes its own PNG; the engine merges
 *   parsed scores when > 1 page is provided.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface ClientPdfPage {
  /** 1-based page number to match oemer’s naming. */
  index: number;
  /** PNG blob of the page at the requested scale. */
  png: Blob;
  /** Pixel dimensions after rendering. */
  width: number;
  height: number;
}

export interface ClientPdfPreview {
  pages: ClientPdfPage[];
  /** Object URL for page 1 (revoked automatically on unmount / re-run). */
  previewUrl: string | null;
  /** True while pdfjs is parsing + rendering. */
  isRendering: boolean;
  /** Error message when rendering fails. */
  error: string | null;
}

const DEFAULT_RENDER_SCALE = 2; // ~144 DPI; balances OMR fidelity vs upload size

/**
 * Render every page of a PDF buffer to a PNG blob. Dynamically imports pdfjs-dist
 * so the library only loads when a PDF is actually selected.
 */
export async function rasterizePdf(
  buffer: ArrayBuffer,
  options: { scale?: number; maxPages?: number } = {},
): Promise<ClientPdfPage[]> {
  const scale = options.scale ?? DEFAULT_RENDER_SCALE;
  const maxPages = Math.max(1, options.maxPages ?? 16);

  const pdfjs = await import("pdfjs-dist");
  // Serve pdf.worker.mjs from /public/pdfjs (copied by postinstall). Fallback to
  // fake-worker mode is automatic when the file 404s — slower but still functional.
  const globalOpts = pdfjs.GlobalWorkerOptions as { workerSrc?: string };
  if (!globalOpts.workerSrc) {
    globalOpts.workerSrc = "/pdfjs/pdf.worker.mjs";
  }

  const loadingTask = pdfjs.getDocument({ data: buffer });
  const doc = await loadingTask.promise;
  const pages: ClientPdfPage[] = [];
  const pageCount = Math.min(doc.numPages, maxPages);
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D canvas context for PDF rasterization");
    await page.render({ canvasContext: ctx, viewport }).promise;
    const png = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!png) throw new Error(`Could not encode PDF page ${i} as PNG`);
    pages.push({ index: i, png, width: canvas.width, height: canvas.height });
  }
  return pages;
}

/**
 * React hook that rasterizes the given PDF file and returns preview pages + a
 * page-1 object URL for the Document preview pane.
 *
 * Passing a non-PDF file (or null) resets state and does nothing.
 */
export function useClientPdfPreview(file: File | null): ClientPdfPreview & {
  reset: () => void;
} {
  const [pages, setPages] = useState<ClientPdfPage[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const revoke = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    revoke();
    setPages([]);
    setPreviewUrl(null);
    setIsRendering(false);
    setError(null);
  }, [revoke]);

  useEffect(() => {
    let cancelled = false;
    if (!file) {
      reset();
      return;
    }
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      reset();
      return;
    }

    setIsRendering(true);
    setError(null);
    (async () => {
      try {
        const buf = await file.arrayBuffer();
        const rendered = await rasterizePdf(buf);
        if (cancelled) return;
        revoke();
        const firstUrl = rendered.length > 0 ? URL.createObjectURL(rendered[0].png) : null;
        urlRef.current = firstUrl;
        setPages(rendered);
        setPreviewUrl(firstUrl);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Could not render PDF";
        setError(msg);
        setPages([]);
        setPreviewUrl(null);
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, reset, revoke]);

  useEffect(() => {
    return revoke;
  }, [revoke]);

  return { pages, previewUrl, isRendering, error, reset };
}
