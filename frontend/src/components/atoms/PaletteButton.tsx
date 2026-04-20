"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { PaletteItem } from "@/lib/palettes/paletteRegistry";

export interface PaletteButtonProps {
  item: PaletteItem;
  disabled?: boolean;
  onActivate: (item: PaletteItem) => void;
  className?: string;
}

/**
 * Compact palette button — MuseScore/Noteflight parity.
 *
 * Supports keyboard activation (Enter/Space), drag-and-drop payload so items can
 * be dragged directly onto the canvas, and a neutral hover/pressed state
 * aligned with the rest of the Sandbox chrome.
 */
export function PaletteButton({ item, disabled, onActivate, className }: PaletteButtonProps) {
  const title = item.title ?? item.label;
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={title}
      draggable={!disabled}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData(
          "application/x-hf-palette-item",
          JSON.stringify({ toolId: item.toolId, id: item.id }),
        );
        event.dataTransfer.setData("text/plain", item.label);
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        onActivate(item);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-[2px]",
        "min-h-[44px] min-w-[44px] px-[8px] py-[6px] rounded-[6px]",
        "border border-[var(--hf-detail)]",
        "bg-[var(--hf-bg)]",
        "transition-colors transition-shadow",
        "hover:border-[var(--hf-accent)] hover:bg-[color-mix(in_srgb,var(--hf-accent)_12%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {item.glyph ? (
        <span
          className="font-serif text-[16px] leading-none"
          style={{ color: "var(--hf-text-primary)" }}
          aria-hidden="true"
        >
          {item.glyph}
        </span>
      ) : null}
      <span
        className="font-mono text-[10px] leading-tight text-center"
        style={{ color: "var(--hf-text-primary)" }}
      >
        {item.label}
      </span>
    </button>
  );
}
