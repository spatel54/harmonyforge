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
  className?: string;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  musicXML = null,
  className,
}: ExportModalProps) {
  if (!isOpen) return null;

  return (
    /* Outer scroll container */
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Fixed dim backdrop */}
      <div
        className="fixed inset-0 bg-[#2D1817] opacity-15 dark:opacity-30 transition-opacity"
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
            "pointer-events-auto relative flex flex-row w-[1200px] h-[700px] max-w-[95vw] max-h-[90vh]",
            "bg-[var(--hf-panel-bg)] rounded-[8px] shadow-[0_24px_80px_rgba(45,24,23,0.31)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]",
            "border border-[var(--hf-detail)]",
            className,
          )}
        >
          <ScorePreviewPane musicXML={musicXML} />
          <ExportOptionsPane
          onClose={onClose}
          onExport={onExport}
          musicXML={musicXML}
        />
        </div>
      </div>
    </div>
  );
}
