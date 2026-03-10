import React from "react";
import { cn } from "@/lib/utils";

export type VoiceType = "soprano" | "alto" | "tenor" | "bass";

/** Semantic colors per voice — fixed, cross-theme (MASTER.md §1) */
const VOICE_COLORS: Record<VoiceType, { text: string; bg: string }> = {
  soprano: { text: "#D32F2F", bg: "#D32F2F1A" },
  alto:    { text: "#1976D2", bg: "#1976D21A" },
  tenor:   { text: "#FFB300", bg: "#FFB3001A" },
  bass:    { text: "#7B1FA2", bg: "#7B1FA21A" },
};

export interface PartChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  voice: VoiceType;
  onRemove?: () => void;
}

/**
 * PartChip Atom
 * Extracted from Pencil Node ID: 9c48S ("ChipRow") children
 * Dismissible voice/instrument chip — color keyed by voice semantic token.
 */
export const PartChip = React.forwardRef<HTMLSpanElement, PartChipProps>(
  ({ label, voice, onRemove, className, ...props }, ref) => {
    const { text, bg } = VOICE_COLORS[voice];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-mono text-[10px] font-normal leading-none",
          "px-[10px] py-[4px]",
          className,
        )}
        style={{ color: text, backgroundColor: bg }}
        {...props}
      >
        {label}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 leading-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current rounded-full"
            aria-label={`Remove ${label}`}
          >
            ×
          </button>
        )}
      </span>
    );
  },
);

PartChip.displayName = "PartChip";
