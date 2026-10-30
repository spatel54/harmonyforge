import React from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/atoms/LogoMark";

export type LogoLockupProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * LogoLockup Atom
 * HF monogram mark (32px) + "HarmonyForge" wordmark.
 * Used in DocumentHeader, SandboxHeader, and Team page header.
 */
export const LogoLockup = React.forwardRef<HTMLDivElement, LogoLockupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-[10px]", className)}
        {...props}
      >
        <LogoMark size={32} className="rounded-[8px]" />

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
