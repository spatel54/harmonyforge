import React, { useState } from "react";
import {
  FileText,
  Music2,
  Code,
  Image as ImageIcon,
  Braces,
  Headphones,
  FolderArchive,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExportFormatCard } from "../atoms/ExportFormatCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ValidationResult {
  violations: {
    parallelFifths: number;
    parallelOctaves: number;
    rangeViolations: number;
    spacingViolations: number;
    voiceOrderViolations: number;
    voiceOverlapViolations: number;
  };
  totalSlots: number;
  her: number;
  valid: boolean;
}

export interface ExportOptionsPaneProps {
  onClose?: () => void;
  onExport?: (format: string) => void;
  /** MusicXML for Score Review validation */
  musicXML?: string | null;
  className?: string;
}

export function ExportOptionsPane({
  onClose,
  onExport,
  musicXML,
  className,
}: ExportOptionsPaneProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!musicXML) {
      setValidationError("No score to validate");
      return;
    }
    setValidating(true);
    setValidation(null);
    setValidationError(null);
    try {
      const formData = new FormData();
      formData.append("file", new Blob([musicXML], { type: "application/xml" }), "score.xml");
      const res = await fetch(`${API_BASE}/api/validate-from-file`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setValidationError(data.error ?? "Validation failed");
        return;
      }
      setValidation(data);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : "Network error");
    } finally {
      setValidating(false);
    }
  };

  const formats = [
    { id: "pdf", icon: FileText, label: "PDF", desc: "Print-ready" },
    { id: "midi", icon: Music2, label: "MIDI", desc: "DAW-compatible" },
    { id: "xml", icon: Code, label: "MusicXML", desc: "Universal score" },
    { id: "chord-chart", icon: Music2, label: "Chord Chart", desc: "Lead-sheet text" },
    { id: "png", icon: ImageIcon, label: "PNG", desc: "High-res image" },
    { id: "json", icon: Braces, label: "JSON", desc: "Symbolic data" },
    { id: "wav", icon: Headphones, label: "WAV", desc: "Offline audio render" },
    { id: "zip", icon: FolderArchive, label: "ZIP", desc: "All files" },
  ];

  return (
    <div
      data-coachmark="step-6"
      className={cn(
        "flex flex-col flex-1 h-[700px] min-w-[500px]",
        "bg-[var(--hf-panel-bg)] rounded-r-[8px]",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-[60px] px-[32px] border-b border-[var(--hf-detail)] shrink-0">
        <div className="flex flex-col gap-[2px]">
          <h2 className="font-serif text-[22px] text-[var(--hf-text-primary)] leading-none">
            Export As
          </h2>
          <span className="font-sans text-[12px] text-[var(--hf-text-primary)] opacity-45 leading-none">
            Choose a format below
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-[32px] h-[32px] rounded-[6px] border border-[var(--hf-detail)] hover:bg-[rgba(var(--hf-surface-rgb),0.05)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-surface)]"
        >
          <X className="w-[14px] h-[14px] text-[var(--hf-text-primary)] opacity-70" />
        </button>
      </div>

      {/* Body - Format Grid */}
      <div className="flex-1 overflow-y-auto px-[32px] py-[24px] flex flex-col gap-[20px]">
        <span className="font-mono text-[9px] font-medium text-[var(--hf-text-primary)] opacity-40 uppercase tracking-wider">
          Format
        </span>

        <div className="grid grid-cols-3 gap-[12px]">
          {formats.slice(0, 3).map((f) => (
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

        <div className="grid grid-cols-4 gap-[12px]">
          {formats.slice(3).map((f) => (
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

        {/* Score Review — validation */}
        <div className="pt-4 border-t border-[var(--hf-detail)]">
          <span className="font-mono text-[9px] font-medium text-[var(--hf-text-primary)] opacity-40 uppercase tracking-wider">
            Score Review
          </span>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleValidate}
              disabled={!musicXML || validating}
              className="self-start flex items-center gap-2 h-[32px] px-[16px] rounded-[6px] border border-[var(--hf-detail)] hover:bg-[var(--hf-surface)]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? (
                <Loader2 className="w-[14px] h-[14px] animate-spin" />
              ) : (
                <CheckCircle2 className="w-[14px] h-[14px]" />
              )}
              <span className="font-mono text-[11px]">Validate harmony</span>
            </button>
            {validation && (
              <div
                className="rounded-[6px] px-3 py-2 text-[11px]"
                style={{
                  backgroundColor: validation.valid
                    ? "color-mix(in srgb, #22c55e 12%, transparent)"
                    : "color-mix(in srgb, #f59e0b 12%, transparent)",
                  border: `1px solid ${validation.valid ? "#22c55e40" : "#f59e0b40"}`,
                }}
              >
                <div className="flex items-center gap-2 font-medium">
                  {validation.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  )}
                  {validation.valid
                    ? "No violations"
                    : `HER: ${(validation.her * 100).toFixed(0)}% · ${validation.violations.parallelFifths + validation.violations.parallelOctaves + validation.violations.rangeViolations + validation.violations.spacingViolations + validation.violations.voiceOrderViolations + validation.violations.voiceOverlapViolations} violation(s)`}
                </div>
                {!validation.valid && (
                  <div className="mt-1 font-mono opacity-80">
                    Parallel 5ths: {validation.violations.parallelFifths} · Octaves: {validation.violations.parallelOctaves} · Range: {validation.violations.rangeViolations} · Spacing: {validation.violations.spacingViolations}
                  </div>
                )}
              </div>
            )}
            {validationError && (
              <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {validationError}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end h-[72px] px-[32px] border-t border-[var(--hf-detail)] shrink-0">
        <button
          onClick={() => onExport?.(selectedFormat)}
          className="flex items-center gap-[8px] h-[40px] px-[24px] rounded-[6px] bg-[var(--hf-surface)] text-white hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]"
        >
          <span className="font-mono text-[12px] font-medium mt-0.5">
            Export{" "}
            {formats.find((f) => f.id === selectedFormat)?.label.toUpperCase()}
          </span>
        </button>
      </div>
    </div>
  );
}
