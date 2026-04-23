"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatFABProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Called when the FAB is clicked to reopen the Theory Inspector */
  onClick?: () => void;
}

const ON_ACCENT = "#1a0f0c";

/**
 * ChatFAB Atom — high-contrast “special feature” entry (gold pill + sparkles), not another surface chip.
 */
export const ChatFAB = React.forwardRef<HTMLButtonElement, ChatFABProps>(
  (
    {
      className,
      onClick,
      title = "Open Theory Inspector — note explanations, harmony audit, and tutor chat",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        title={title}
        aria-label="Open Theory Inspector"
        data-hf-theory-inspector-cta="true"
        className={cn(
          "flex items-center gap-3 min-h-[52px] pl-3 pr-6 rounded-full",
          "transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]",
          "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-[3px] focus-visible:ring-offset-[var(--hf-bg)]",
          className,
        )}
        style={{
          background:
            "linear-gradient(165deg, color-mix(in srgb, var(--hf-accent) 100%, #fff 18%) 0%, var(--hf-accent) 42%, color-mix(in srgb, var(--hf-accent) 72%, var(--hf-surface)) 100%)",
          border: `2px solid color-mix(in srgb, var(--hf-accent) 55%, ${ON_ACCENT})`,
          boxShadow:
            "0 2px 0 color-mix(in srgb, var(--hf-accent) 40%, #000), 0 10px 32px color-mix(in srgb, var(--hf-accent) 45%, transparent), 0 0 0 1px color-mix(in srgb, #fff 35%, transparent)",
        }}
        {...props}
      >
        <span
          className="flex shrink-0 items-center justify-center rounded-full w-10 h-10"
          style={{
            backgroundColor: ON_ACCENT,
            boxShadow: "inset 0 1px 0 color-mix(in srgb, #fff 12%, transparent)",
          }}
          aria-hidden="true"
        >
          <Sparkles
            className="w-[22px] h-[22px]"
            strokeWidth={2}
            style={{ color: "var(--hf-accent)" }}
          />
        </span>

        <span
          className="font-sans text-[17px] font-bold leading-none tracking-tight whitespace-nowrap pr-1"
          style={{ color: ON_ACCENT }}
        >
          Theory Inspector
        </span>
      </button>
    );
  },
);

ChatFAB.displayName = "ChatFAB";
