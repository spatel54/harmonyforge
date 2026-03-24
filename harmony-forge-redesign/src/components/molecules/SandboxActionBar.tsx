"use client";

import React from "react";
import { Undo2, Redo2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SandboxActionBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  mode: "view" | "edit";
  onModeChange: (mode: "view" | "edit") => void;
  className?: string;
}

/**
 * Compact action bar (Noteflight pattern): Undo, Redo, Delete always visible in edit mode.
 * 2g.4: Action bar for direct note manipulation.
 */
export function SandboxActionBar({
  onUndo,
  onRedo,
  onDelete,
  canUndo,
  canRedo,
  hasSelection,
  mode,
  onModeChange,
  className,
}: SandboxActionBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg shrink-0",
        "border border-[var(--hf-detail)]",
        className
      )}
      style={{ backgroundColor: "var(--hf-bg)" }}
      role="toolbar"
      aria-label="Edit actions"
    >
      <div
        className="flex items-center rounded-md border border-[var(--hf-detail)] overflow-hidden mr-1"
        aria-label="Notation mode"
      >
        <button
          type="button"
          onClick={() => onModeChange("view")}
          className="px-2 py-1 text-[11px] font-mono"
          style={{
            backgroundColor: mode === "view" ? "var(--hf-surface)" : "transparent",
            color: mode === "view" ? "#fff" : "var(--hf-text-primary)",
          }}
          aria-pressed={mode === "view"}
          title="Reliable display mode"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => onModeChange("edit")}
          className="px-2 py-1 text-[11px] font-mono"
          style={{
            backgroundColor: mode === "edit" ? "var(--hf-surface)" : "transparent",
            color: mode === "edit" ? "#fff" : "var(--hf-text-primary)",
          }}
          aria-pressed={mode === "edit"}
          title="Direct note editing mode"
        >
          Edit
        </button>
      </div>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center justify-center w-8 h-8 rounded transition-opacity hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--hf-accent)]"
        aria-label="Undo"
        title="Undo (⌘Z)"
      >
        <Undo2 className="w-4 h-4" style={{ color: "var(--hf-text-primary)" }} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex items-center justify-center w-8 h-8 rounded transition-opacity hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--hf-accent)]"
        aria-label="Redo"
        title="Redo (⇧⌘Z)"
      >
        <Redo2 className="w-4 h-4" style={{ color: "var(--hf-text-primary)" }} strokeWidth={1.75} />
      </button>
      <div className="w-px h-5" style={{ backgroundColor: "var(--hf-detail)" }} />
      <button
        type="button"
        onClick={onDelete}
        disabled={!hasSelection}
        className="flex items-center justify-center w-8 h-8 rounded transition-opacity hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--hf-accent)]"
        aria-label="Delete"
        title="Delete (Delete)"
      >
        <Trash2 className="w-4 h-4" style={{ color: "var(--hf-text-primary)" }} strokeWidth={1.75} />
      </button>
    </div>
  );
}
