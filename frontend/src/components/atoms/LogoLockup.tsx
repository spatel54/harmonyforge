import React from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/atoms/LogoMark";

export type LogoLockupProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * LogoLockup Atom
 * HF monogram mark (24px SVG) + "HarmonyForge" wordmark.
 * Used in DocumentHeader, SandboxHeader, and Team page header.
 */
export const LogoLockup = React.forwardRef<HTMLDivElement, LogoLockupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-[8px]", className)}
        {...props}
      >
        <LogoMark size={24} />

        <span className="hf-logo-wordmark font-brand text-[22px] font-normal leading-none">
          HarmonyForge
        </span>
      </div>
    );
  },
);

LogoLockup.displayName = "LogoLockup";
