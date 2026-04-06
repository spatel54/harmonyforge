import React from "react";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LogoLockupProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * LogoLockup Atom
 * Extracted from Pencil Node ID: 86KW2 ("Logo")
 * LogoMark (32×32 gradient frame, music icon) + "HarmonyForge" brand text.
 * Used in DocumentHeader. Separate from BrandTitle (which is the large 57px hero variant).
 */
export const LogoLockup = React.forwardRef<HTMLDivElement, LogoLockupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-[10px]", className)}
        {...props}
      >
        {/* Node bMIr7: LogoMark — 32×32, gradient bg, music icon */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-[8px] shrink-0"
          style={{
            background:
              "linear-gradient(135deg, var(--hf-surface) 0%, color-mix(in srgb, var(--hf-surface) 90%, transparent) 100%)",
          }}
          aria-hidden="true"
        >
          <Music
            className="w-4 h-4"
            style={{ color: "var(--hf-text-primary)" }}
            strokeWidth={2}
          />
        </div>

        {/* Node TDV8d: Brand wordmark */}
        <span
          className="font-brand text-[22px] font-normal leading-none"
          style={{ color: "var(--hf-text-primary)" }}
        >
          HarmonyForge
        </span>
      </div>
    );
  },
);

LogoLockup.displayName = "LogoLockup";
