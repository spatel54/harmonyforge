"use client";

import React from "react";
import { Undo2, Redo2, Trash2, Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type DisplayMode = "view" | "edit";

export interface SandboxActionBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  /** View = OSMD display; Edit = VexFlow with note tools */
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
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
  displayMode = "view",
  onDisplayModeChange,
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
      {onDisplayModeChange && (
        <>
          <button
            type="button"
            onClick={() => onDisplayModeChange("view")}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--hf-accent)]",
              displayMode === "view" && "ring-1 ring-inset"
            )}
            style={{
              color: displayMode === "view" ? "var(--hf-accent)" : "var(--hf-text-secondary)",
            }}
            aria-label="View mode"
            title="View (OSMD display)"
          >
            <Eye className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onDisplayModeChange("edit")}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--hf-accent)]",
              displayMode === "edit" && "ring-1 ring-inset"
            )}
            style={{
              color: displayMode === "edit" ? "var(--hf-accent)" : "var(--hf-text-secondary)",
            }}
            aria-label="Edit mode"
            title="Edit (VexFlow, note tools)"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <div className="w-px h-5" style={{ backgroundColor: "var(--hf-detail)" }} />
        </>
      )}
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
