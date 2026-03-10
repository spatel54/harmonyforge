import React from "react";
import { cn } from "@/lib/utils";
import { PartChip, type VoiceType } from "@/components/atoms/PartChip";

export interface SelectedPart {
  label: string;
  voice: VoiceType;
}

export interface EnsemblePreviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedParts: SelectedPart[];
  totalParts?: number;
  onRemovePart?: (label: string) => void;
}

/**
 * EnsemblePreviewCard Molecule
 * Extracted from Pencil Node ID: LtBtZ ("Ensemble Preview Card")
 * Summary card showing selected voice/instrument chips below the voice dropdowns.
 */
export const EnsemblePreviewCard = React.forwardRef<
  HTMLDivElement,
  EnsemblePreviewCardProps
>(
  (
    { selectedParts, totalParts = 12, onRemovePart, className, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-[16px] w-full rounded-[6px] p-[20px]",
          "border border-[var(--hf-detail)]",
          className,
        )}
        {...props}
      >
        {/* Header row — Node 7bP8H */}
        <div className="flex items-center justify-between w-full flex-wrap gap-[8px]">
          <div className="flex items-center gap-[8px]">
            <span
              className="font-mono text-[12px] font-bold leading-none"
              style={{ color: "var(--hf-text-primary)" }}
            >
              Ensemble Preview
            </span>
            {/* "Traditional" style tag — unified treatment */}
            <span
              className="inline-flex items-center rounded-full font-mono text-[10px] font-normal leading-none px-[10px] py-[4px] border"
              style={{
                color: "var(--hf-text-primary)",
                backgroundColor:
                  "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
                borderColor: "var(--hf-detail)",
              }}
            >
              Traditional
            </span>
          </div>
          <span
            className="font-mono text-[11px] font-normal leading-none"
            style={{ color: "var(--hf-text-sub)" }}
          >
            {selectedParts.length} / {totalParts} parts
          </span>
        </div>

        {/* Chip row — Node 9c48S */}
        <div
          className="flex flex-wrap gap-[8px]"
          role="list"
          aria-label="Selected ensemble parts"
        >
          {selectedParts.length === 0 ? (
            <span
              className="font-mono text-[11px] font-normal leading-none"
              style={{ color: "var(--hf-text-sub)" }}
            >
              No parts selected
            </span>
          ) : (
            selectedParts.map((part) => (
              <div key={`${part.voice}-${part.label}`} role="listitem">
                <PartChip
                  label={part.label}
                  voice={part.voice}
                  onRemove={
                    onRemovePart ? () => onRemovePart(part.label) : undefined
                  }
                />
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
);

EnsemblePreviewCard.displayName = "EnsemblePreviewCard";
