"use client";

import React from "react";
import { RiffScoreEditor } from "@/components/score/RiffScoreEditor";
import type { EditableScore } from "@/lib/music/scoreTypes";

export interface ExportPrintRootProps {
  score: EditableScore | null;
}

/**
 * Hidden-by-default root dedicated to print output.
 *
 * When `document.body` has the class `hf-printing-score`, global CSS hides
 * every child of <body> except this root — so `window.print()` yields a clean
 * score page without palette, toolbar, bars strip, or inspector chrome.
 *
 * In non-print viewports this container is visually hidden via
 * `@media not print { display: none }` in `globals.css`.
 */
export function ExportPrintRoot({ score }: ExportPrintRootProps) {
  if (!score) return null;
  return (
    <div className="hf-print-root" aria-hidden="true">
      <div className="hf-print-root__score">
        <RiffScoreEditor score={score} className="w-full" presentation />
      </div>
    </div>
  );
}
