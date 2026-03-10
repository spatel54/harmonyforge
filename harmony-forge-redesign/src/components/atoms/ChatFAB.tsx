"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ChatFABProps extends React.HTMLAttributes<HTMLButtonElement> {
  /** Called when the FAB is clicked to reopen the Theory Inspector */
  onClick?: () => void;
}

/**
 * ChatFAB Atom
 * Pencil Node: t4vY4 ("ChatFAB")
 * Floating action button shown on the ScoreCanvas when the Theory Inspector is closed.
 * Spec: h:48, cornerRadius:6, padding:[4,20,4,8], gap:12
 *   Left sphere: 32×32 gradient ellipse (warning→accent→surface, 45°) with glow
 *   Label: Inter 16 500 "$text-on-light"
 *   Fill: $neutral-50 (light) / deep cognac (dark)
 *   Shadow: blur:16 color:#2D18171A y:4
 */
export const ChatFAB = React.forwardRef<HTMLButtonElement, ChatFABProps>(
  ({ className, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label="Open Theory Inspector"
        className={cn(
          "flex items-center gap-[12px] h-[48px] rounded-[6px]",
          "transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-surface)]",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-canvas-bg)",
          border: "1px solid var(--hf-detail)",
          padding: "4px 20px 4px 8px",
          boxShadow: "0 4px 16px rgba(45,24,23,0.10)",
        }}
        {...props}
      >
        {/* Gradient sphere */}
        <span
          className="shrink-0 rounded-full"
          style={{
            width: 32,
            height: 32,
            background:
              "linear-gradient(45deg, var(--hf-accent) 0%, var(--hf-surface) 50%, var(--hf-surface) 100%)",
            boxShadow: "0 0 12px rgba(25,118,210,0.30)",
          }}
          aria-hidden="true"
        />

        {/* Label */}
        <span
          className="font-sans text-[16px] font-medium leading-none whitespace-nowrap"
          style={{ color: "var(--hf-text-primary)" }}
        >
          Ask Theory Inspector
        </span>
      </button>
    );
  },
);

ChatFAB.displayName = "ChatFAB";
