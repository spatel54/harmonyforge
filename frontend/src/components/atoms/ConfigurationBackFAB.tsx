"use client";

import Link from "next/link";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfigurationBackFABProps = Omit<
  React.ComponentProps<typeof Link>,
  "href" | "children"
> & {
  className?: string;
};

/**
 * Compact floating link back to step 2 — outline / mono treatment so it stays visually
 * separate from the Theory Inspector FAB (no gradient orb, smaller footprint).
 */
export const ConfigurationBackFAB = React.forwardRef<HTMLAnchorElement, ConfigurationBackFABProps>(
  ({ className, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href="/document"
        className={cn(
          "hf-pressable inline-flex items-center gap-1.5 h-9 max-w-[min(100%,18rem)] rounded-md px-2.5 py-1",
          "font-mono text-[11px] font-semibold leading-none tracking-tight",
          "border transition-colors duration-150 shadow-sm hover:shadow-md",
          "hover:border-[var(--hf-accent)] hover:bg-[color-mix(in_srgb,var(--hf-accent)_12%,transparent)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]",
          className,
        )}
        style={{
          color: "var(--hf-text-primary)",
          backgroundColor: "color-mix(in srgb, var(--hf-panel-bg) 88%, transparent)",
          borderColor: "var(--hf-detail)",
          boxShadow: "0 1px 3px rgba(45,24,23,0.08)",
        }}
        title="Return to step 2 to change mood, instruments, or regenerate harmonies. Sandbox edits stay until you leave or reset the score."
        aria-label="Back to configuration — edit mood, instruments, or regenerate harmonies"
        {...props}
      >
        <span
          className="flex items-center justify-center shrink-0 rounded-[4px] w-6 h-6"
          style={{
            backgroundColor: "color-mix(in srgb, var(--hf-surface) 18%, transparent)",
            color: "var(--hf-text-primary)",
          }}
          aria-hidden="true"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
        </span>
        <span className="truncate">Back to configuration</span>
      </Link>
    );
  },
);

ConfigurationBackFAB.displayName = "ConfigurationBackFAB";
