"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/atoms/ActionTooltip";

/**
 * Global link to the /team page — icon-only, matches other header icon buttons.
 * Opens in a new tab so arrangement work in the current tab is not interrupted.
 */
export function TeamNavButton({ className }: { className?: string }) {
  const pathname = usePathname();
  if (pathname === "/team") return null;

  return (
    <ActionTooltip content="Meet the team and credits. Opens in a new tab so your current score or document stays open.">
      <Link
        href="/team"
        prefetch={false}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "hf-pressable flex items-center justify-center w-8 h-8 rounded-md border shadow-sm hover:shadow-md hover:bg-[color-mix(in_srgb,var(--hf-surface)_10%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]",
          className,
        )}
        style={{
          borderColor: "var(--hf-detail)",
          color: "var(--hf-text-primary)",
          backgroundColor: "transparent",
        }}
        aria-label="Meet the team (opens in new tab)"
      >
        <Users className="w-[14px] h-[14px] opacity-80" aria-hidden />
      </Link>
    </ActionTooltip>
  );
}
