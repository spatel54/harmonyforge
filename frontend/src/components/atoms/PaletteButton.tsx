"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { PaletteItem } from "@/lib/palettes/paletteRegistry";
import { ActionTooltip } from "@/components/atoms/ActionTooltip";

export interface PaletteButtonProps {
  item: PaletteItem;
  disabled?: boolean;
  pressed?: boolean;
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
export function PaletteButton({ item, disabled, pressed, onActivate, className }: PaletteButtonProps) {
  const tooltip = item.title ?? item.label;
  const useLabelAsIcon = !item.glyph;

  const button = (
    <button
      type="button"
      disabled={disabled}
      aria-label={tooltip}
      aria-pressed={pressed ?? false}
      data-tool-id={item.toolId}
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
        "hf-pressable flex flex-col items-center justify-center gap-[2px]",
        "min-h-[44px] min-w-[44px] px-[8px] py-[6px] rounded-[6px]",
        "border border-[var(--hf-detail)]",
        "bg-[var(--hf-bg)]",
        "shadow-sm hover:shadow-md",
        "hover:border-[var(--hf-accent)] hover:bg-[color-mix(in_srgb,var(--hf-accent)_12%,transparent)]",
        "active:border-[var(--hf-accent)] active:bg-[color-mix(in_srgb,var(--hf-accent)_18%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]",
        "disabled:shadow-none disabled:opacity-45",
        pressed &&
          "border-[var(--hf-accent)] bg-[color-mix(in_srgb,var(--hf-accent)_22%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--hf-accent)_40%,transparent)]",
        className,
      )}
    >
      {item.glyph ? (
        <span
          className="font-music text-[18px] leading-none"
          style={{ color: "var(--hf-text-primary)" }}
          aria-hidden="true"
        >
          {item.glyph}
        </span>
      ) : null}
      <span
        className={cn(
          "font-mono leading-tight text-center",
          useLabelAsIcon
            ? "text-[11px] font-semibold tracking-tight"
            : "text-[10px]",
        )}
        style={{ color: "var(--hf-text-primary)" }}
      >
        {item.label}
      </span>
    </button>
  );

  return (
    <ActionTooltip content={tooltip}>
      {button}
    </ActionTooltip>
  );
}
