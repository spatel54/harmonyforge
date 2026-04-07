import React from "react";
import { cn } from "@/lib/utils";

export type BrandTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

/**
 * BrandTitle Atom
 * Extracted from Pencil Node ID: O0Kpx ("PLAYGROUND - LIGHT" > "HarmonyForge")
 * Maps to font-brand (Fraunces) and text-on-light scale.
 */
export const BrandTitle = React.forwardRef<HTMLHeadingElement, BrandTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <h1
        ref={ref}
        {...props}
        className={cn(
          // Text defaults matching Node O0Kpx
          "font-brand text-[57px] leading-[1.122] tracking-[-0.25px] font-normal",
          // Color based on theme context (extracted as #2D1817 which maps to text-on-light)
          "text-[var(--text-on-light, #2d1817)] dark:text-[var(--text-on-dark, #f8f8f8)]",
          className,
        )}
      >
        HarmonyForge
      </h1>
    );
  },
);

BrandTitle.displayName = "BrandTitle";
