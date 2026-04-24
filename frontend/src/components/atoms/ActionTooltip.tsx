"use client";

import React from "react";
import { Tooltip } from "./Tooltip";

export interface ActionTooltipProps {
  content: string;
  shortcut?: string;
  /** Delay before show on hover (ms). Focus opens immediately. Default 160. */
  showDelayMs?: number;
  className?: string;
  children: React.ReactElement;
}

/**
 * Portaled tooltip for header actions and icon buttons. Hover uses a short delay;
 * keyboard focus shows immediately. Uses focus/blur with relatedTarget so focus
 * can move within the wrapper (e.g. Link, button) without closing.
 */
export function ActionTooltip({
  content,
  shortcut,
  showDelayMs = 160,
  className,
  children,
}: ActionTooltipProps) {
  const tooltipId = React.useId();
  const wrapRef = React.useRef<HTMLSpanElement>(null);
  const showTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [floatingPosition, setFloatingPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const clearShowTimer = React.useCallback(() => {
    if (showTimerRef.current != null) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const measure = React.useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setFloatingPosition({
      top: r.bottom + 8,
      left: r.left + r.width / 2,
    });
  }, []);

  const openNow = React.useCallback(() => {
    clearShowTimer();
    measure();
    setVisible(true);
  }, [clearShowTimer, measure]);

  const scheduleOpenHover = React.useCallback(() => {
    clearShowTimer();
    const delay = reducedMotion ? 0 : showDelayMs;
    showTimerRef.current = setTimeout(() => {
      showTimerRef.current = null;
      measure();
      setVisible(true);
    }, delay);
  }, [clearShowTimer, measure, reducedMotion, showDelayMs]);

  const close = React.useCallback(() => {
    clearShowTimer();
    setVisible(false);
  }, [clearShowTimer]);

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

  React.useEffect(() => () => clearShowTimer(), [clearShowTimer]);

  const onFocus = React.useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      if (wrapRef.current?.contains(e.target as Node)) {
        openNow();
      }
    },
    [openNow],
  );

  const onBlur = React.useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      const next = e.relatedTarget as Node | null;
      if (!next || !wrapRef.current?.contains(next)) {
        close();
      }
    },
    [close],
  );

  if (!React.isValidElement(children)) {
    throw new Error("ActionTooltip expects a single React element child");
  }

  const childProps = children.props as Record<string, unknown>;
  const existingDescribedBy =
    typeof children.props === "object" &&
    children.props !== null &&
    "aria-describedby" in children.props &&
    typeof childProps["aria-describedby"] === "string"
      ? (childProps["aria-describedby"] as string)
      : undefined;

  const describedBy = visible
    ? [existingDescribedBy, tooltipId].filter(Boolean).join(" ")
    : existingDescribedBy;

  const trigger = React.cloneElement(children, {
    "aria-describedby": describedBy,
  } as React.HTMLAttributes<HTMLElement>);

  return (
    <span
      ref={wrapRef}
      className="inline-flex"
      onMouseEnter={scheduleOpenHover}
      onMouseLeave={close}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {trigger}
      <Tooltip
        content={content}
        shortcut={shortcut}
        visible={visible}
        floatingPosition={floatingPosition}
        className={className}
        contentId={tooltipId}
        instantTransition={reducedMotion}
      />
    </span>
  );
}
