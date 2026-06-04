"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportFormatCard } from "../atoms/ExportFormatCard";
import {
  SANDBOX_EXPORT_FORMATS,
  type SandboxExportFormatId,
} from "@/lib/sandbox/exportFormats";

export interface ExportOptionsPaneProps {
  onClose?: () => void;
  onExport?: (format: SandboxExportFormatId) => void;
  className?: string;
}

export function ExportOptionsPane({
  onClose,
  onExport,
  className,
}: ExportOptionsPaneProps) {
  const [selectedFormat, setSelectedFormat] =
    useState<SandboxExportFormatId>("pdf");

  const selectedLabel =
    SANDBOX_EXPORT_FORMATS.find((f) => f.id === selectedFormat)?.label ?? "File";

  return (
    <div
      data-coachmark="step-6"
      className={cn(
        "flex flex-col w-full md:w-[400px] shrink-0 min-h-0 h-auto md:h-[700px] max-h-[min(48vh,440px)] md:max-h-none",
        "bg-[var(--hf-panel-bg)] rounded-b-[12px] md:rounded-b-none md:rounded-r-[12px]",
        className,
      )}
    >
      <div className="flex items-center justify-between h-[56px] px-6 border-b border-[color-mix(in_srgb,var(--hf-detail)_70%,transparent)] shrink-0">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-serif text-[20px] text-[var(--hf-text-primary)] leading-tight">
            Export as
          </h2>
          <span className="font-sans text-[11px] text-[var(--hf-text-primary)] opacity-45">
            Pick a file type
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close export"
          className="hf-pressable flex items-center justify-center w-9 h-9 rounded-lg border border-[color-mix(in_srgb,var(--hf-detail)_65%,transparent)] bg-[color-mix(in_srgb,var(--hf-panel-bg)_90%,transparent)] hover:bg-[color-mix(in_srgb,var(--hf-surface)_6%,var(--hf-panel-bg))] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
        >
          <X className="w-4 h-4 text-[var(--hf-text-primary)] opacity-70" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-2 gap-3">
          {SANDBOX_EXPORT_FORMATS.map((f) => (
            <ExportFormatCard
              key={f.id}
              icon={f.icon}
              label={f.label}
              description={f.desc}
              selected={selectedFormat === f.id}
              onClick={() => setSelectedFormat(f.id)}
            />
          ))}
        </div>
        {selectedFormat === "pdf" && (
          <p className="mt-4 font-sans text-[11px] leading-relaxed text-[var(--hf-text-primary)] opacity-50">
            PDF opens your browser print dialog — choose &quot;Save as PDF&quot; to
            download.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 h-[64px] px-6 border-t border-[color-mix(in_srgb,var(--hf-detail)_70%,transparent)] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="hf-pressable hidden sm:flex h-10 px-4 rounded-lg font-mono text-[11px] text-[var(--hf-text-primary)] opacity-70 border border-[color-mix(in_srgb,var(--hf-detail)_60%,transparent)] hover:opacity-100"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onExport?.(selectedFormat)}
          className="hf-pressable flex items-center gap-2 h-10 px-6 rounded-lg bg-[var(--hf-surface)] text-white shadow-[0_2px_12px_color-mix(in_srgb,var(--hf-surface)_35%,transparent)] hover:opacity-92 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
        >
          <span className="font-mono text-[12px] font-medium">
            Export {selectedLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
