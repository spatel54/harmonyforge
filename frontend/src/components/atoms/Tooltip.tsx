"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  shortcut?: string;
  visible: boolean;
  className?: string;
  /**
   * Viewport position for `position: fixed` (center anchor under the trigger).
   * Rendered in a portal to `document.body` so the popover is not clipped by
   * `overflow-*` on ancestors or covered by the adjacent document column.
   */
  floatingPosition: { top: number; left: number } | null;
}

const tooltipBoxClass = cn(
  "pointer-events-none",
  "w-[min(20rem,calc(100vw-2.5rem))] text-left",
  "px-3 py-2 rounded-micro shadow-xl",
  "bg-(--hf-surface-rgb)/95 backdrop-blur-md border border-(--hf-detail)",
  "flex flex-col items-stretch gap-1.5",
);

/**
 * Tooltip Atom — when used with `floatingPosition`, renders via portal so it
 * stacks above split-pane layouts (e.g. Document score | Ensemble Builder).
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  visible,
  className,
  floatingPosition,
}) => {
  /* SSR / pre-hydration: no document.body */
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {visible && floatingPosition != null ? (
        <motion.div
          key="hf-tooltip"
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn("fixed z-[10000] -translate-x-1/2", tooltipBoxClass, className)}
          style={{
            top: floatingPosition.top,
            left: floatingPosition.left,
            backgroundColor: "rgba(var(--hf-surface-rgb, 158, 75, 62), 0.95)",
            boxShadow: "var(--hf-shadow-xl)",
          }}
        >
          <span className="font-body text-[12px] font-medium text-[#f8f8f8] leading-snug whitespace-pre-line break-words">
            {content}
          </span>
          {shortcut ? (
            <span className="font-mono text-[10px] opacity-60 text-[#f8f8f8] border-t border-white/20 pt-1">
              {shortcut}
            </span>
          ) : null}

          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-t border-l border-(--hf-detail)"
            style={{ backgroundColor: "inherit" }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
};
