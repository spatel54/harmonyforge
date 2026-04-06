"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  shortcut?: string;
  visible: boolean;
  className?: string;
}

/**
 * Tooltip Atom
 * Follows HarmonyForge Glass Box aesthetic:
 * - radius.micro (2px)
 * - Labels (UI) typography (13pxInter)
 * - Elevated shadow (shadow.xl for floating)
 * - Semi-transparent background with backdrop blur
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  visible,
  className,
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap",
            "px-2 py-1 rounded-micro shadow-xl",
            "bg-(--hf-surface-rgb)/95 backdrop-blur-md border border-(--hf-detail)",
            "flex items-center gap-2",
            className,
          )}
          style={{
            backgroundColor: "rgba(var(--hf-surface-rgb, 158, 75, 62), 0.95)",
            boxShadow: "var(--hf-shadow-xl)",
          }}
        >
          <span className="font-body text-[12px] font-medium text-[#f8f8f8]">
            {content}
          </span>
          {shortcut && (
            <span className="font-mono text-[10px] opacity-60 text-[#f8f8f8] border-l border-white/20 pl-2">
              {shortcut}
            </span>
          )}

          {/* Subtle pointer arrow */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-t border-l border-(--hf-detail)"
            style={{ backgroundColor: "inherit" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
