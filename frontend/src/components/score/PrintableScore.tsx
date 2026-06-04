"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { applyOsmdPrintEngravingRules } from "@/lib/music/osmdPrintLayout";

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
        containerRef.current.innerHTML = "";
        const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
        const osmd = new OpenSheetMusicDisplay(containerRef.current, {
          backend: "svg",
          drawTitle: true,
          drawingParameters: "default",
        });
        applyOsmdPrintEngravingRules(osmd.EngravingRules);
        await osmd.load(xmlToLoad);
        osmd.render();

        const printRoot = containerRef.current.closest(".hf-print-root");
        printRoot?.classList.add("hf-print-root--rendering");

        // Let OSMD SVG layout settle before the print preview captures the DOM.
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });

        // Remove OSMD's built-in "Page N" labels — we render our own via CSS counter.
        containerRef.current.querySelectorAll("svg text").forEach((el) => {
          if (/^Page\s+\d+/i.test(el.textContent?.trim() ?? "")) el.remove();
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
