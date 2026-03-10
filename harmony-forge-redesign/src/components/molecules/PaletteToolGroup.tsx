import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/atoms/Tooltip";

export interface PaletteToolItem {
  /** Icon component or render function */
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }> | (() => React.ReactNode);
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface PaletteToolGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Group label — e.g. "SCORE", "EDIT", "DURATION" */
  label: string;
  tools: PaletteToolItem[];
  /** Whether this group has a right-side divider border */
  separator?: boolean;
}

/**
 * PaletteToolGroup Molecule
 * Pencil: grpScore, grpEdit, grpDuration, grpPitch, grpText, grpMeasure,
 *         grpDynamics, grpArticulation (all inside r1–r3 of ScorePalette)
 */
export const PaletteToolGroup = React.forwardRef<
  HTMLDivElement,
  PaletteToolGroupProps
>(({ label, tools, separator = true, className, ...props }, ref) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center h-full gap-[12px] px-[12px]",
        separator && "border-r border-[var(--hf-detail)]",
        className,
      )}
      role="group"
      aria-label={label}
      {...props}
    >
      {/* Group label */}
      <span
        className="font-mono text-[10px] font-semibold tracking-[0.06em] uppercase select-none whitespace-nowrap"
        style={{ color: "var(--hf-surface)" }}
        aria-hidden="true"
      >
        {label}
      </span>

      {/* Tool buttons */}
      {tools.map((tool, i) => (
        <div
          key={i}
          className="relative flex items-center justify-center p-0.5"
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <button
            type="button"
            onClick={tool.onClick}
            disabled={tool.disabled}
            aria-label={tool.label}
            className={cn(
              "flex items-center justify-center w-[24px] h-[24px] rounded-[4px]",
              "transition-colors duration-100",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-(--hf-accent)",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              tool.active
                ? "bg-(--hf-surface) text-(--neutral-50)"
                : "text-(--hf-text) hover:bg-(--hf-surface)/10",
            )}
          >
            {typeof tool.icon === "function" && tool.icon.length === 0 ? (
              (tool.icon as () => React.ReactNode)()
            ) : (
              React.createElement(tool.icon as React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>, {
                className: "w-[20px] h-[20px] shrink-0",
                strokeWidth: 1.5,
                "aria-hidden": true,
              })
            )}
          </button>

          <Tooltip
            content={tool.label}
            shortcut={tool.shortcut}
            visible={hoveredIndex === i}
          />
        </div>
      ))}
    </div>
  );
});

PaletteToolGroup.displayName = "PaletteToolGroup";
