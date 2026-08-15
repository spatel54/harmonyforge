"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

/**
 * Sonner toaster styled to HarmonyForge tokens — bottom center, symmetric enter/exit.
 */
export function HfToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-center"
      closeButton={false}
      richColors={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "hf-toast-surface hf-print-hide flex w-[min(24rem,calc(100vw-2rem))] items-center justify-center px-4 py-2.5 rounded-xl font-mono text-xs text-center shadow-[0_8px_30px_rgba(45,24,23,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] border backdrop-blur-sm",
        },
        style: {
          background: "color-mix(in srgb, var(--hf-panel-bg) 92%, transparent)",
          color: "var(--hf-text-primary)",
          borderColor: "color-mix(in srgb, var(--hf-detail) 55%, transparent)",
        },
        duration: 4000,
      }}
    />
  );
}
