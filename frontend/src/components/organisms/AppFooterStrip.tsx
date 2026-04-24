"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SiteCopyright } from "@/components/atoms/SiteCopyright";
import { OpenSourceCreditsDialog } from "@/components/molecules/OpenSourceCreditsDialog";

export interface AppFooterStripProps extends React.HTMLAttributes<HTMLElement> {
  /** Left side before copyright (e.g. sandbox back link) */
  lead?: React.ReactNode;
  /** Right side (e.g. study log controls) */
  end?: React.ReactNode;
}

/**
 * Bottom strip: Salt Family copyright + Credits dialog; optional trailing slot (sandbox research bar).
 */
export function AppFooterStrip({ className, lead, end, ...props }: AppFooterStripProps) {
  const [creditsOpen, setCreditsOpen] = React.useState(false);

  return (
    <>
      <footer
        className={cn(
          "hf-print-hide shrink-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2",
          "px-4 py-2 border-t font-mono text-[10px]",
          "border-[var(--hf-detail)]",
          "bg-[color-mix(in_srgb,var(--hf-bg)_96%,transparent)]",
          className,
        )}
        {...props}
      >
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {lead != null ? <div className="shrink-0">{lead}</div> : null}
          <SiteCopyright />
          <Link
            href="/team"
            className="font-mono text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100 shrink-0 transition-opacity hf-pressable rounded-sm px-0.5 -mx-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            Team
          </Link>
          <button
            type="button"
            onClick={() => setCreditsOpen(true)}
            className="font-mono text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100 shrink-0"
            style={{ color: "var(--hf-accent)" }}
            aria-label="Open source credits"
          >
            Credits
          </button>
        </div>
        {end != null ? (
          <div className="flex flex-wrap items-center gap-2 justify-end min-w-0">{end}</div>
        ) : null}
      </footer>
      <OpenSourceCreditsDialog
        isOpen={creditsOpen}
        onClose={() => setCreditsOpen(false)}
      />
    </>
  );
}
