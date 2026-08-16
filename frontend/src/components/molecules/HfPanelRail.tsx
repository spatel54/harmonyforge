"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HfPanelRailProps {
  side: "left" | "right";
  /** Shown when collapsed — opens the panel */
  onExpand: () => void;
  icon: React.ReactNode;
  ariaLabel: string;
  title?: string;
  className?: string;
}

/**
 * Collapsed dock rail (~40px) — keeps in-flow column width stable vs unmounting panels.
 */
export function HfPanelRail({
  side,
  onExpand,
  icon,
  ariaLabel,
  title,
  className,
}: HfPanelRailProps) {
  const Chevron = side === "left" ? ChevronRight : ChevronLeft;

  return (
    <div
      className={cn(
        "hf-panel-rail hf-print-hide flex flex-col items-center shrink-0 h-full border-[var(--hf-detail)] bg-[var(--hf-panel-bg)]",
        side === "left" ? "border-r" : "border-l",
        className,
      )}
    >
      <button
        type="button"
        onClick={onExpand}
        title={title}
        aria-label={ariaLabel}
        aria-expanded={false}
        className="hf-pressable flex flex-col items-center justify-center gap-2 w-full flex-1 min-h-[120px] px-1 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-inset"
      >
        <span className="flex items-center justify-center w-7 h-7 rounded-md border border-[color-mix(in_srgb,var(--hf-detail)_65%,transparent)] bg-[color-mix(in_srgb,var(--hf-bg)_40%,var(--hf-panel-bg))]">
          {icon}
        </span>
        <Chevron className="w-3.5 h-3.5 opacity-70" style={{ color: "var(--hf-text-secondary)" }} />
      </button>
    </div>
  );
}
