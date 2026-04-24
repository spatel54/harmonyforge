import React from "react";
import { cn } from "@/lib/utils";
import { ScorePreviewPane } from "../molecules/ScorePreviewPane";
import { ExportOptionsPane } from "../molecules/ExportOptionsPane";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string) => void;
  /** Raw MusicXML for Score Preview — when provided, renders actual score */
  musicXML?: string | null;
  /** Scrollable preview root — used for PNG capture */
  previewContainerRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  musicXML = null,
  previewContainerRef,
  className,
}: ExportModalProps) {
  if (!isOpen) return null;

  return (
    /* Outer scroll container */
    <div className="fixed inset-0 z-[10130] overflow-y-auto hf-print-hide hf-export-modal">
      {/* Fixed dim backdrop */}
      <div
        className="hf-backdrop-animate hf-overlay-backdrop fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centering wrapper — sits above the backdrop */}
      <div className="relative flex min-h-full items-center justify-center p-4 pointer-events-none">
        {/* Modal Container */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-modal-title"
          className={cn(
            "hf-modal-animate pointer-events-auto relative flex flex-col md:flex-row w-full max-w-[95vw] max-h-[90vh] md:w-[1200px] md:h-[700px] min-h-0 overflow-hidden",
            "bg-[var(--hf-panel-bg)] rounded-[12px] shadow-[0_20px_60px_rgba(45,24,23,0.18)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.45)]",
            "border border-[color-mix(in_srgb,var(--hf-detail)_75%,transparent)]",
            className,
          )}
        >
          <ScorePreviewPane musicXML={musicXML} previewRootRef={previewContainerRef} />
          <ExportOptionsPane onClose={onClose} onExport={onExport} musicXML={musicXML} />
        </div>
      </div>
    </div>
  );
}
