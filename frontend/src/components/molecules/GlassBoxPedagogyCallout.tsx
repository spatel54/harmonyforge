"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type GlassBoxPedagogyVariant = "ensemble-generate" | "ensemble-reviewer" | "inspector";

export interface GlassBoxPedagogyCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: GlassBoxPedagogyVariant;
  /** When set, overrides variant default (ensemble: collapsed, inspector: expanded). */
  defaultOpen?: boolean;
}

const COPY: Record<
  GlassBoxPedagogyVariant,
  { title: string; summaryLabel: string; body: string }
> = {
  "ensemble-generate": {
    title: "How HarmonyForge uses (and doesn’t use) AI",
    summaryLabel: "How HarmonyForge uses AI",
    body:
      "Baseline harmonies come from algorithms—music-theory rules and search, not a chat model or neural net—so you can trace what the engine did, not guess at a hidden process. AI shows up only in Theory Inspector on the next screen, where it explains, flags problems, and suggests edits; it does not generate the notes underneath.",
  },
  "ensemble-reviewer": {
    title: "How HarmonyForge uses (and doesn’t use) AI",
    summaryLabel: "How HarmonyForge uses AI",
    body:
      "In this flow you add harmonies in the editor yourself—no generative AI writes your parts. Any conversational AI stays in Theory Inspector, for explanations, critique, and suggestions, separate from the notes on the staff.",
  },
  inspector: {
    title: "This panel is where conversational AI lives",
    summaryLabel: "Conversational AI in this panel",
    body:
      "Chats here use a language model for explanations, audits, and stylistic suggestions. HarmonyForge’s automatic voicings still come from the deterministic engine, not from this panel—the point is transparent coaching next to fixed rules, not chat-only generation.",
  },
};

/**
 * Short, plain-language note distinguishing deterministic harmony generation
 * from Theory Inspector LLM usage (Glass Box pedagogy).
 */
export function GlassBoxPedagogyCallout({
  variant,
  defaultOpen,
  className,
  ...props
}: GlassBoxPedagogyCalloutProps) {
  const { title, summaryLabel, body } = COPY[variant];
  const variantDefaultOpen = variant === "inspector";
  const [open, setOpen] = React.useState(defaultOpen ?? variantDefaultOpen);
  const panelId = React.useId();

  return (
    <aside
      className={cn(
        "rounded-[8px] border overflow-hidden",
        "font-body text-[11px] leading-[1.5]",
        className,
      )}
      style={{
        borderColor: "var(--hf-detail)",
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
        color: "var(--hf-text-primary)",
      }}
      {...props}
    >
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-2 text-left px-[12px] py-[10px]",
          "font-mono text-[11px] font-medium",
          "transition-colors hover:bg-[color-mix(in_srgb,var(--hf-surface)_18%,transparent)]",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--hf-surface)]",
        )}
        style={{ color: "var(--hf-text-primary)" }}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90",
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1">{summaryLabel}</span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-label={title}
        className={cn(
          "px-[12px] pb-[12px] pt-0 border-t",
          !open && "hidden",
        )}
        style={{ borderColor: "color-mix(in srgb, var(--hf-detail) 55%, transparent)" }}
      >
        <h3
          className="font-mono text-[10px] font-semibold uppercase tracking-wide mb-[8px] mt-[10px]"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          {title}
        </h3>
        <p className="m-0 text-[11px]" style={{ color: "var(--hf-text-primary)" }}>
          {body}
        </p>
      </div>
    </aside>
  );
}
