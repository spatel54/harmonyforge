"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type GlassBoxPedagogyVariant = "ensemble-generate" | "ensemble-reviewer" | "inspector";

export interface GlassBoxPedagogyCalloutProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: GlassBoxPedagogyVariant;
}

const COPY: Record<GlassBoxPedagogyVariant, { title: string; body: string }> = {
  "ensemble-generate": {
    title: "How HarmonyForge uses (and doesn’t use) AI",
    body:
      "Baseline harmonies come from algorithms—music-theory rules and search, not a chat model or neural net—so you can trace what the engine did, not guess at a hidden process. AI shows up only in Theory Inspector on the next screen, where it explains, flags problems, and suggests edits; it does not generate the notes underneath.",
  },
  "ensemble-reviewer": {
    title: "How HarmonyForge uses (and doesn’t use) AI",
    body:
      "In this flow you add harmonies in the editor yourself—no generative AI writes your parts. Any conversational AI stays in Theory Inspector, for explanations, critique, and suggestions, separate from the notes on the staff.",
  },
  inspector: {
    title: "This panel is where conversational AI lives",
    body:
      "Chats here use a language model to discuss your score—explanations, audits, and stylistic suggestions. Automatic harmony generation in HarmonyForge is separate: it follows fixed algorithms, not this chat. The design is to shift AI from anonymous generation to transparent coaching alongside deterministic harmony.",
  },
};

/**
 * Short, plain-language note distinguishing deterministic harmony generation
 * from Theory Inspector LLM usage (Glass Box pedagogy).
 */
export function GlassBoxPedagogyCallout({
  variant,
  className,
  ...props
}: GlassBoxPedagogyCalloutProps) {
  const { title, body } = COPY[variant];
  return (
    <aside
      className={cn(
        "rounded-[6px] border px-[12px] py-[10px]",
        "font-body text-[11px] leading-[1.45]",
        className,
      )}
      style={{
        borderColor: "var(--hf-detail)",
        backgroundColor: "color-mix(in srgb, var(--hf-surface) 12%, transparent)",
        color: "var(--hf-text-primary)",
      }}
      {...props}
    >
      <h3
        className="font-mono text-[10px] font-semibold uppercase tracking-wide mb-[6px]"
        style={{ color: "var(--hf-text-secondary)" }}
      >
        {title}
      </h3>
      <p className="m-0">{body}</p>
    </aside>
  );
}
