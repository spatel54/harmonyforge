import React from "react";
import { cn } from "@/lib/utils";
import { BrandWordmark } from "@/components/atoms/BrandWordmark";

export type LogoLockupProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * LogoLockup Atom
 * Integrated wordmark: HF monogram as the leading “H” + “armonyForge”.
 * Used in DocumentHeader, SandboxHeader, and Team page header.
 */
export const LogoLockup = React.forwardRef<HTMLDivElement, LogoLockupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center", className)} {...props}>
        <BrandWordmark className="text-[22px]" markSize={24} />
      </div>
    );
  },
);

LogoLockup.displayName = "LogoLockup";
