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
 * so callers can drop an info trigger next to domain jargon (e.g. SATB).
 * Positions the tooltip with `getBoundingClientRect` + a body portal so it is
 * not clipped by overflow or hidden under the score column on Document.
 */
export const HoverTooltip: React.FC<HoverTooltipProps> = ({
  content,
  shortcut,
  ariaLabel = "More info",
}) => {
  const [visible, setVisible] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [floatingPosition, setFloatingPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  const measure = React.useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setFloatingPosition({
      top: r.bottom + 8,
      left: r.left + r.width / 2,
    });
  }, []);

  const open = React.useCallback(() => {
    measure();
    setVisible(true);
  }, [measure]);

  React.useLayoutEffect(() => {
    if (!visible) {
      setFloatingPosition(null);
      return;
    }
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [visible, measure]);

  return (
    <span
      className="relative inline-flex items-center align-middle"
      onMouseEnter={open}
      onMouseLeave={() => setVisible(false)}
      onFocus={open}
      onBlur={() => setVisible(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-describedby={visible ? "hover-tooltip-describedby" : undefined}
        className="inline-flex items-center justify-center w-[16px] h-[16px] rounded-full opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1"
        style={{ color: "var(--hf-text-secondary)" }}
        onClick={(e) => {
          e.preventDefault();
          setVisible((v) => {
            if (!v) measure();
            return !v;
          });
        }}
      >
        <Info className="w-[12px] h-[12px]" strokeWidth={2} aria-hidden="true" />
      </button>
      <Tooltip
        content={content}
        shortcut={shortcut}
        visible={visible}
        floatingPosition={floatingPosition}
      />
    </span>
  );
};
