"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";

export interface PrintableScoreHandle {
  printWhenReady: (xmlOverride?: string) => Promise<void>;
}

interface Props {
  xml: string | null;
  bpm?: number | null;
}

export const PrintableScore = forwardRef<PrintableScoreHandle, Props>(
  function PrintableScore({ xml, bpm }, ref) {
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
        osmd.EngravingRules.PageLeftMargin = 1;
        osmd.EngravingRules.PageRightMargin = 10;
        osmd.EngravingRules.SystemLeftMargin = 0;
        await osmd.load(xmlToLoad);
        osmd.render();

        // Remove OSMD's built-in "Page N" labels — we render our own via CSS counter.
        containerRef.current.querySelectorAll("svg text").forEach((el) => {
          if (/^Page\s+\d+/i.test(el.textContent?.trim() ?? "")) el.remove();
        });

        // Inject tempo overlay positioned just above the first staff system,
        // left-aligned with the first staff line's left edge.
        if (bpm != null) {
          const container = containerRef.current;
          const svg = container.querySelector("svg");
          const containerRect = container.getBoundingClientRect();

          // Find the first horizontal staff line — it has negligible vertical
          // delta and a large horizontal span. Stems/barlines are excluded
          // because they are nearly vertical (large y delta, tiny x delta).
          let firstStaffLine: Element | null = null;
          for (const line of Array.from(svg?.querySelectorAll("line") ?? [])) {
            const x1 = parseFloat(line.getAttribute("x1") ?? "0");
            const x2 = parseFloat(line.getAttribute("x2") ?? "0");
            const y1 = parseFloat(line.getAttribute("y1") ?? "0");
            const y2 = parseFloat(line.getAttribute("y2") ?? "0");
            if (Math.abs(y2 - y1) < 2 && Math.abs(x2 - x1) > 50) {
              firstStaffLine = line;
              break;
            }
          }
          const firstLineRect = firstStaffLine?.getBoundingClientRect();

          // First staff group for vertical positioning.
          const firstStaff = svg?.querySelector("g");
          const firstStaffRect = firstStaff?.getBoundingClientRect();
          const svgRect = svg?.getBoundingClientRect();

          const tempoEl = document.createElement("div");
          tempoEl.className = "hf-print-tempo-overlay";
          tempoEl.innerHTML = `<span class="hf-print-tempo-note">♩</span><span class="hf-print-tempo-eq"> = </span><span class="hf-print-tempo-value">${bpm}</span>`;

          // Vertical: just above the first staff group (or SVG top as fallback).
          const topRef = firstStaffRect ?? svgRect;
          if (topRef && containerRect) {
            const topPx = topRef.top - containerRect.top - 20;
            tempoEl.style.top = `${Math.max(topPx, 4)}px`;
          } else {
            tempoEl.style.top = "0";
          }

          // Horizontal: align with the left edge of the first staff line.
          if (firstLineRect && containerRect) {
            tempoEl.style.left = `${firstLineRect.left - containerRect.left}px`;
          } else {
            tempoEl.style.left = "0";
          }

          container.style.position = "relative";
          container.appendChild(tempoEl);
        }

        window.print();
      },
    }));

    return <div ref={containerRef} className="w-full" />;
  },
);
