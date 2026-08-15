"use client";

import React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const MODAL_EASE = [0.23, 1, 0.32, 1] as const;

export interface HfModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Wrapper around dialog panel */
  className?: string;
  panelClassName?: string;
  zIndex?: number;
  closeOnBackdrop?: boolean;
  labelledBy?: string;
  describedBy?: string;
  role?: "dialog" | "presentation";
  scrollable?: boolean;
  /** Center panel (default) or pass custom layout via children only */
  centered?: boolean;
}

/**
 * Shared modal shell — enter/exit with framer-motion, Escape + backdrop dismiss.
 */
export function HfModal({
  isOpen,
  onClose,
  children,
  className,
  panelClassName,
  zIndex = 10200,
  closeOnBackdrop = true,
  labelledBy,
  describedBy,
  role = "dialog",
  scrollable = true,
  centered = true,
}: HfModalProps) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0.12 : 0.25;

  const backdropPointerRef = React.useRef(false);
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const dismissFromBackdrop = React.useCallback(() => {
    // Only close when the gesture started on the backdrop — not when a palette
    // click opens the modal and the leftover click lands on the new overlay.
    if (!backdropPointerRef.current) return;
    backdropPointerRef.current = false;
    onClose();
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div
          className={cn(
            "fixed inset-0 hf-print-hide",
            scrollable ? "overflow-y-auto" : "overflow-hidden",
            className,
          )}
          style={{ zIndex }}
          role={role}
        >
          <motion.div
            aria-hidden="true"
            tabIndex={-1}
            className="hf-overlay-backdrop fixed inset-0 cursor-default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: MODAL_EASE }}
            onPointerDown={() => {
              backdropPointerRef.current = true;
            }}
            onClick={closeOnBackdrop ? dismissFromBackdrop : undefined}
          />
          <div
            className={cn(
              "relative flex min-h-full pointer-events-none",
              centered ? "items-center justify-center p-4 sm:p-6" : "",
            )}
          >
            <motion.div
              role={role === "presentation" ? undefined : "dialog"}
              aria-modal={role === "presentation" ? undefined : true}
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              className={cn("hf-modal-surface pointer-events-auto", panelClassName)}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: "translateY(10px) scale(0.96)" }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, transform: "translateY(0) scale(1)" }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, transform: "translateY(10px) scale(0.96)" }
              }
              transition={{ duration, ease: MODAL_EASE }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
