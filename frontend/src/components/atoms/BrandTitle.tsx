import React from "react";
import { cn } from "@/lib/utils";
import { BrandWordmark } from "@/components/atoms/BrandWordmark";

export type BrandTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

/**
 * BrandTitle Atom
 * Playground hero wordmark — monogram as the leading “H” + “armonyForge”.
 * Maps to font-brand (Fraunces) and text-on-light / text-on-dark scale.
 */
export const BrandTitle = React.forwardRef<HTMLHeadingElement, BrandTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <BrandWordmark
        as="h1"
        ref={ref}
        {...props}
        className={cn(
          "text-[57px] leading-[1.122] tracking-[-0.25px]",
          "text-[var(--text-on-light, #2d1817)] dark:text-[var(--text-on-dark, #f8f8f8)]",
          className,
        )}
      />
    );
  },
);

BrandTitle.displayName = "BrandTitle";
