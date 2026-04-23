import React from "react";
import { cn } from "@/lib/utils";

export interface QuickReplyChipsProps extends React.HTMLAttributes<HTMLDivElement> {
  chips?: string[];
  onChipClick?: (chip: string) => void;
  disabled?: boolean;
}

const DEFAULT_CHIPS = [
  "Does this sound good together?",
  "Why did you pick this note?",
  "What would sound better here?",
  "Check my voice leading",
];

/**
 * QuickReplyChips Molecule
 * Pencil Node: chipsRow (seFUb) — 2×2 grid of suggestion chips.
 *
 * Spec:
 *   chipsRow: layout:vertical gap:6 pad:[4,0]
 *   sRow1/sRow2: gap:6
 *   chip: fill_container  pad:[4,10]  ai:center
 *         fill:$sonata-surface/10  stroke:$sonata-detail @1  r:12
 *         text: IBM Plex Mono fs:10  fill:$text-on-light
 */
export const QuickReplyChips = React.forwardRef<
  HTMLDivElement,
  QuickReplyChipsProps
>(({ chips = DEFAULT_CHIPS, onChipClick, disabled = false, className, ...props }, ref) => {
  const rows: string[][] = [];
  for (let i = 0; i < chips.length; i += 2) {
    rows.push(chips.slice(i, i + 2));
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-[6px] w-full py-[4px]", className)}
      role="group"
      aria-label="Quick reply suggestions"
      {...props}
    >
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-[6px]">
          {row.map((chip, ci) => (
            <button
              key={ci}
              type="button"
              disabled={disabled}
              onClick={() => onChipClick?.(chip)}
              className={cn(
                "flex-1 text-left px-[10px] py-[4px]",
                "rounded-[12px]" /* r:12 — pill-shaped */,
                "font-mono text-[10px] font-normal leading-tight",
                "transition-opacity hover:opacity-80",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hf-accent)",
                disabled && "opacity-40 cursor-not-allowed hover:opacity-40",
              )}
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
                border: "1px solid var(--hf-detail)",
                color: "var(--hf-text-primary)",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
});

QuickReplyChips.displayName = "QuickReplyChips";
