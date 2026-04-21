import React from "react";
import { cn } from "@/lib/utils";
import { getCopyrightNotice } from "@/lib/siteMeta";

export type SiteCopyrightProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * In-app copyright line (Salt Family, current year). Uses full text as title for assistive clarity.
 */
export function SiteCopyright({ className, ...props }: SiteCopyrightProps) {
  const text = getCopyrightNotice();
  return (
    <p
      className={cn(
        "font-mono text-[10px] opacity-70 m-0 shrink-0",
        "text-[var(--hf-text-secondary)]",
        className,
      )}
      title={text}
      {...props}
    >
      {text}
    </p>
  );
}
