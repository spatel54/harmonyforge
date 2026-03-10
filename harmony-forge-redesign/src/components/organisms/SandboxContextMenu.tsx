"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  MagnifyingGlass,
  Copy,
  Scissors,
  ClipboardText,
  SelectionAll,
  PencilSimple,
  Eraser,
  Sparkle,
  ArrowCounterClockwise,
  Trash,
  MusicNotes,
} from "@phosphor-icons/react";
import { useSandboxStore } from "@/store/useSandboxStore";

export const SandboxContextMenu = () => {
  const { contextMenu, closeContextMenu } = useSandboxStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");

  // Close when clicking outside
  useEffect(() => {
    if (!contextMenu.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeContextMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen) return null;

  // Prevent menu from clipping off-screen
  // We assume max width ~ 240px, max height ~ 350px
  const menuWidth = 240;
  const menuHeight = 350;

  // Calculate bounds, default to 0 to prevent NaN if window isn't defined during SSR
  const boundedX =
    typeof window !== "undefined"
      ? Math.min(contextMenu.x, window.innerWidth - menuWidth - 16)
      : contextMenu.x;

  const boundedY =
    typeof window !== "undefined"
      ? Math.min(contextMenu.y, window.innerHeight - menuHeight - 16)
      : contextMenu.y;

  const style: React.CSSProperties = {
    top: boundedY,
    left: boundedX,
  };

  // Functional search filtering
  const searchLower = searchValue.toLowerCase();

  const clipboardActions = [
    { name: "Copy", shortcut: "⌘C", icon: Copy },
    { name: "Cut", shortcut: "⌘X", icon: Scissors },
    { name: "Paste", shortcut: "⌘V", icon: ClipboardText },
  ].filter((action) => action.name.toLowerCase().includes(searchLower));

  const recentTools = [
    { name: "Select", shortcut: "V", icon: SelectionAll },
    { name: "Draw Notes", shortcut: "N", icon: PencilSimple },
    { name: "Eraser", shortcut: "E", icon: Eraser },
    { name: "Undo", shortcut: "⌘Z", icon: ArrowCounterClockwise },
    { name: "Delete", shortcut: "⌫", icon: Trash },
  ].filter((tool) => tool.name.toLowerCase().includes(searchLower));

  const menu = (
    <div
      ref={menuRef}
      style={style}
      className={cn(
        "fixed z-[9999] w-[240px] flex flex-col gap-1 p-2",
        "bg-[var(--hf-toolbar-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--hf-toolbar-border)]",
        "animate-in fade-in zoom-in-95 duration-150 origin-top-left text-sm",
      )}
      onContextMenu={(e) => {
        // Prevent default context menu INSIDE our custom context menu
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Search Bar */}
      <div className="relative mb-1">
        <MagnifyingGlass
          weight="bold"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hf-text-secondary)]"
        />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={cn(
            "w-full h-8 pl-8 pr-3 rounded-lg bg-(--hf-bg) border border-(--hf-detail)",
            "text-(--hf-text-primary) placeholder:text-(--hf-text-secondary)",
            "focus:outline-none focus:ring-1 focus:ring-(--hf-accent) transition-all",
            "text-xs font-medium",
          )}
          autoFocus
        />
      </div>

      {/* Clipboard Actions */}
      {clipboardActions.length > 0 && (
        <div className="flex flex-col gap-0.5 border-b border-[var(--hf-detail)] pb-1.5 mb-0.5">
          {clipboardActions.map((action) => (
            <button
              key={action.name}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors",
                "text-(--hf-text-primary) hover:bg-(--hf-surface)/20 w-full text-left font-medium",
              )}
            >
              <action.icon
                weight="bold"
                className="w-4 h-4 text-[var(--hf-text-secondary)]"
              />
              <span>{action.name}</span>
              <span className="ml-auto text-[10px] text-[var(--hf-text-secondary)] opacity-80">
                {action.shortcut}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Recent Tools */}
      {recentTools.length > 0 && (
        <div className="flex flex-col gap-0.5 border-b border-[var(--hf-detail)] pb-1.5 mb-0.5">
          {searchLower === "" && (
            <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--hf-text-secondary)] uppercase tracking-wider">
              Recent Tools
            </div>
          )}
          {recentTools.map((tool) => (
            <button
              key={tool.name}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors",
                "text-(--hf-text-primary) hover:bg-(--hf-surface)/20 w-full text-left font-medium",
              )}
            >
              <tool.icon
                weight="bold"
                className="w-4 h-4 text-[var(--hf-text-secondary)]"
              />
              <span>{tool.name}</span>
              <span className="ml-auto text-[10px] text-[var(--hf-text-secondary)] opacity-80">
                {tool.shortcut}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Ask Theory Inspector */}
      {("ask theory inspector".includes(searchLower) || searchLower === "") && (
        <div className="flex flex-col gap-0.5 pt-0.5">
          <button
            className={cn(
              "flex items-center gap-3 px-2.5 py-2.5 rounded-md transition-all group w-full text-left relative overflow-hidden",
              "bg-[#1a1110] text-[#fdf5e6] hover:bg-black/90 dark:bg-[#fdf5e6] dark:text-[#1a1110] dark:hover:bg-white",
              "shadow-md",
            )}
            onClick={() => {
              console.log("Asking Theory Inspector...");
              closeContextMenu();
            }}
          >
            {/* Branded Circular Logo */}
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 shadow-sm transition-transform group-hover:scale-105"
              style={{
                background:
                  "linear-gradient(135deg, var(--hf-accent) 0%, var(--hf-surface) 100%)",
              }}
            >
              <MusicNotes
                weight="bold"
                className="w-4 h-4"
                style={{ color: "var(--hf-text-primary)" }}
              />
            </div>
            <div className="flex flex-col gap-0">
              <span className="font-semibold text-[13px] leading-tight">
                Ask Theory Inspector
              </span>
              <span className="text-[10px] opacity-60 font-mono uppercase tracking-[0.05em]">
                Ante-hoc Explainability
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(menu, document.body);
};
