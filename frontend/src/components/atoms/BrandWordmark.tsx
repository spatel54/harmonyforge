import React from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/atoms/LogoMark";
import { PRODUCT_NAME } from "@/lib/siteMeta";

const WORDMARK_TAIL = PRODUCT_NAME.slice(1); // "armonyForge"

export type BrandWordmarkProps = React.HTMLAttributes<HTMLElement> & {
  /** Root element — `span` for lockups, `h1` for the playground hero. */
  as?: "span" | "h1";
  /** Pixel width for the mark when not fitting to surrounding type. */
  markSize?: number;
  /** Scale the monogram to the current font size (use as the leading “H”). */
  fitToText?: boolean;
};

/**
 * HarmonyForge wordmark with the HF monogram standing in for the leading “H”.
 * Accessible name remains the full product name.
 */
export const BrandWordmark = React.forwardRef<HTMLElement, BrandWordmarkProps>(
  (
    {
      as: Comp = "span",
      markSize = 24,
      fitToText = true,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Comp
        ref={ref as React.Ref<HTMLHeadingElement & HTMLSpanElement>}
        aria-label={PRODUCT_NAME}
        className={cn(
          "hf-logo-wordmark inline-flex items-center gap-[0.01em] font-brand font-normal leading-none",
          className,
        )}
        {...props}
      >
        <LogoMark
          size={markSize}
          fitToText={fitToText}
          className="hf-logo-wordmark-mark translate-y-[0.04em]"
        />
        <span aria-hidden="true">{WORDMARK_TAIL}</span>
      </Comp>
    );
  },
);

BrandWordmark.displayName = "BrandWordmark";
