"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { renderOsmdExportScore } from "@/lib/music/osmdExportRender";
import { osmdExportRenderOptionsForPdf } from "@/lib/music/osmdExportRenderOptions";
import { useScoreDisplayStore } from "@/store/useScoreDisplayStore";

export interface PrintableScoreHandle {
  printWhenReady: (xmlOverride?: string) => Promise<void>;
}

interface Props {
  xml: string | null;
}

export const PrintableScore = forwardRef<PrintableScoreHandle, Props>(
  function PrintableScore({ xml }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      printWhenReady: async (xmlOverride?: string) => {
        const xmlToLoad = xmlOverride ?? xml;
        if (!containerRef.current || !xmlToLoad) return;
        const showLetterNames = useScoreDisplayStore.getState().showNoteNameLabels;
        await renderOsmdExportScore(
          containerRef.current,
          xmlToLoad,
          osmdExportRenderOptionsForPdf(showLetterNames),
        );

        const printRoot = containerRef.current.closest(".hf-print-root");
        printRoot?.classList.add("hf-print-root--rendering");

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

        try {
          window.print();
        } finally {
          printRoot?.classList.remove("hf-print-root--rendering");
        }
      },
    }));

    return <div ref={containerRef} className="w-full" />;
  },
);
