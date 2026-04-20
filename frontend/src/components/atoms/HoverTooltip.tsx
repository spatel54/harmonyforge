"use client";

import React from "react";
import { Info } from "lucide-react";
import { Tooltip } from "./Tooltip";

interface HoverTooltipProps {
  /** Plain-language tooltip copy (e.g. an acronym expansion). */
  content: string;
  /** Optional keyboard shortcut line. */
  shortcut?: string;
  /** Optional aria-label for the info trigger; defaults to "More info". */
  ariaLabel?: string;
}

/**
 * Thin wrapper around the Tooltip atom that manages hover/focus state itself,
 * so callers can drop a "?" info trigger next to domain jargon (e.g. SATB).
 * Addresses Iter2 §1: "plain-language tooltips for domain-specific terminology".
 */
export const HoverTooltip: React.FC<HoverTooltipProps> = ({
  content,
  shortcut,
  ariaLabel = "More info",
}) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <span
      className="relative inline-flex items-center align-middle"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-describedby={visible ? "hover-tooltip-describedby" : undefined}
        className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1"
        style={{ color: "var(--hf-text-secondary)" }}
        onClick={(e) => {
          e.preventDefault();
          setVisible((v) => !v);
        }}
      >
        <Info className="w-[12px] h-[12px]" strokeWidth={2} aria-hidden="true" />
      </button>
      <Tooltip content={content} shortcut={shortcut} visible={visible} />
    </span>
  );
};
