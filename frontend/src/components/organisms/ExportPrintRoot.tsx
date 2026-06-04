"use client";

import React, { forwardRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  PrintableScore,
  type PrintableScoreHandle,
} from "@/components/score/PrintableScore";
import { HARMONYFORGE_EXPORT_ATTRIBUTION } from "@/lib/sandbox/exportBranding";

export type { PrintableScoreHandle };

export interface ExportPrintRootProps {
  xml: string | null;
  /** Reserved for future OSMD work-title metadata. */
  filename?: string | null;
}

/**
 * Hidden-by-default root dedicated to print output (OSMD engraving).
 *
 * Portaled to `document.body` so print CSS can hide every sibling while keeping
 * this root visible. When `body.hf-printing-score` is set, `window.print()`
 * yields a clean score page without palette, toolbar, or inspector chrome.
 */
export const ExportPrintRoot = forwardRef<PrintableScoreHandle, ExportPrintRootProps>(
  function ExportPrintRoot({ xml }, ref) {
    const mounted = useSyncExternalStore(
      () => () => {},
      () => true,
      () => false,
    );

    if (!xml || !mounted) return null;

    return createPortal(
      <div className="hf-print-root" aria-hidden="true">
        <div className="hf-print-root__score">
          <PrintableScore ref={ref} xml={xml} />
        </div>
        <p className="hf-export-attribution">{HARMONYFORGE_EXPORT_ATTRIBUTION}</p>
      </div>,
      document.body,
    );
  },
);
