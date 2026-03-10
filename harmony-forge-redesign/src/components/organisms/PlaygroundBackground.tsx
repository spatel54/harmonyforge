import React from "react";
import { cn } from "@/lib/utils";

export interface PlaygroundBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * PlaygroundBackground Organism
 * Extracted from Node 80t2V (Light) and PnDXj (Dark).
 * Uses inline CSS gradient referencing design system CSS vars so dark mode switch
 * is driven by globals.css .dark token re-assignments, not Tailwind class scanning.
 */
export const PlaygroundBackground = React.forwardRef<
  HTMLDivElement,
  PlaygroundBackgroundProps
>(({ children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full min-h-screen overflow-hidden transition-[background] duration-500",
        className,
      )}
      style={{
        // Light: #fdf5e6 → #e8dcda  (Node 80t2V)
        // Dark:  #3e2723 → #2d1817  (Node PnDXj)
        // hf-bg maps to var(--sonata-bg) in light and var(--nocturne-bg) in dark.
        // We define the two gradient stops directly via CSS vars set in globals.css
        background:
          "linear-gradient(to bottom, var(--hf-bg-grad-start), var(--hf-bg-grad-end))",
      }}
      {...props}
    >
      {children}
    </div>
  );
});

PlaygroundBackground.displayName = "PlaygroundBackground";
