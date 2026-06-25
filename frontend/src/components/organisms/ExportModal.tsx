"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ScorePreviewPane } from "../molecules/ScorePreviewPane";
import { ExportOptionsPane } from "../molecules/ExportOptionsPane";
import type { SandboxExportFormatId } from "@/lib/sandbox/exportFormats";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: SandboxExportFormatId) => void;
  /** Partwise MusicXML — OSMD PDF preview + exports. */
  musicXML?: string | null;
  /** Show chord-symbol toggle when melody + harmony are present. */
  showChordSymbolsToggle?: boolean;
  className?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  musicXML = null,
  showChordSymbolsToggle = false,
  className,
}: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10130] overflow-y-auto hf-print-hide hf-export-modal">
      <div
        className="hf-backdrop-animate hf-overlay-backdrop fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          className={cn(
            "hf-modal-animate pointer-events-auto relative flex flex-col md:flex-row w-full max-w-[96vw] max-h-[92vh] md:max-w-[1100px] md:h-[700px] min-h-0 overflow-hidden",
            "bg-[var(--hf-panel-bg)] rounded-[14px] shadow-[0_24px_64px_rgba(45,24,23,0.16)] dark:shadow-[0_28px_72px_rgba(0,0,0,0.42)]",
            "border border-[color-mix(in_srgb,var(--hf-detail)_70%,transparent)]",
            className,
          )}
        >
          <ScorePreviewPane
            musicXML={musicXML}
            showChordSymbolsToggle={showChordSymbolsToggle}
          />
          <ExportOptionsPane onClose={onClose} onExport={onExport} />
        </div>
      </div>
    </div>
  );
}
