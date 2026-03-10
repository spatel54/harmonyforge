import React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlaybackBarProps extends React.HTMLAttributes<HTMLDivElement> {
  measure?: string;
  totalMeasures?: number;
  bpm?: number;
  onReupload?: () => void;
}

/**
 * PlaybackBar Molecule
 * Extracted from Pencil Node ID: RctEd ("PlaybackBar")
 * Bottom bar of ScorePreviewPanel: playhead position + BPM on the left,
 * Re-upload Score button on the right.
 */
export const PlaybackBar = React.forwardRef<HTMLDivElement, PlaybackBarProps>(
  (
    {
      measure = "1",
      totalMeasures = 24,
      bpm = 96,
      onReupload,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between w-full",
          "rounded-[6px] px-[16px] py-[10px]",
          "border border-[var(--hf-detail)]",
          className,
        )}
        style={{ backgroundColor: "color-mix(in srgb, var(--hf-surface) 10%, transparent)" }}
        {...props}
      >
        {/* Left: playhead info — Node lTRYw */}
        <div className="flex items-center gap-[8px]">
          <span
            className="font-mono text-[11px] font-normal leading-none"
            style={{ color: "var(--hf-text-sub)" }}
          >
            m. {measure} / {totalMeasures}
          </span>
          <span
            className="font-mono text-[11px] font-normal leading-none"
            style={{ color: "var(--hf-text-sub)" }}
          >
            {bpm} BPM
          </span>
        </div>

        {/* Right: Re-upload button — Node SnayI */}
        <button
          type="button"
          onClick={onReupload}
          className={cn(
            "flex items-center gap-[8px]",
            "rounded-[6px] px-[12px] py-[6px]",
            "border border-[var(--hf-detail)]",
            "font-mono text-[11px] font-normal leading-none",
            "transition-opacity duration-150 hover:opacity-80",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]",
          )}
          style={{
            color: "var(--hf-text-primary)",
            backgroundColor: "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
          }}
          aria-label="Re-upload score"
        >
          <Upload className="w-[13px] h-[13px] shrink-0" aria-hidden="true" />
          Re-upload Score
        </button>
      </div>
    );
  },
);

PlaybackBar.displayName = "PlaybackBar";
