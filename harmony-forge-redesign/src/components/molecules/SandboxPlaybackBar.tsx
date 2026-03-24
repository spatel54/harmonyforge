"use client";

import React from "react";
import {
  SkipBack,
  Rewind,
  Play,
  Pause,
  FastForward,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SandboxPlaybackBarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  isPlaying?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPlayPause?: () => void;
  onSkipBack?: () => void;
  onRewind?: () => void;
  onFastForward?: () => void;
  onSkipForward?: () => void;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  canPlay?: boolean;
}

/**
 * SandboxPlaybackBar Molecule
 * Pencil Node: PMS9U ("PlaybackBar") inside MainArea of dcf2A.
 *
 * Spec:
 *   h:60  gap:16  pad:[0,32]  jc:space_between  ai:center  fill:$sonata-bg
 *   stroke top:1 $sonata-detail
 *
 *   Metadata:  layout:vertical gap:4 jc:center
 *     Title:    IBM Plex Mono fs:14 fw:600  fill:$text-on-light
 *     Subtitle: Inter fs:12               fill:$sonata-detail
 *
 *   TransportCtrls: gap:16 ai:center
 *     PlayBtn: 40×36 r:20 (pill)  fill:$text-on-light
 *     PlayIco: 18×18              fill:$sonata-bg
 *
 *   Pagination: gap:12 ai:center
 *     Prev/NextBtn: 28×28 r:16 (circle) fill:none
 *     PageCounter:  IBM Plex Mono fs:13 fw:500 fill:$text-on-light
 */
export const SandboxPlaybackBar = React.forwardRef<
  HTMLDivElement,
  SandboxPlaybackBarProps
>(
  (
    {
      title = "Sonata in C Major",
      subtitle = "W.A. Mozart • K. 545",
      isPlaying = false,
      currentPage = 1,
      totalPages = 4,
      onPlayPause,
      onSkipBack,
      onRewind,
      onFastForward,
      onSkipForward,
      onPrevPage,
      onNextPage,
      canPlay = true,
      className,
      ...props
    },
    ref,
  ) => {
    const iconBtn =
      "flex items-center justify-center transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hf-accent)";

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between w-full h-[60px] px-[32px] gap-[16px] shrink-0",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-bg)",
          borderTop: "1px solid var(--hf-detail)",
        }}
        role="toolbar"
        aria-label="Playback controls"
        {...props}
      >
        {/* ── Left: Piece Metadata ── Node al845 ──────────── */}
        <div className="flex flex-col gap-[4px] justify-center min-w-0">
          <span
            className="font-mono text-[14px] font-semibold leading-tight truncate"
            style={{ color: "var(--hf-text-primary)" }}
          >
            {title}
          </span>
          <span
            className="font-body text-[12px] font-normal leading-tight truncate"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            {subtitle}
          </span>
        </div>

        {/* ── Center: Transport Controls ── Node 7emlR ─────── */}
        <div
          className="flex items-center gap-[16px]"
          role="group"
          aria-label="Transport"
        >
          {/* skip-back — 16×16 */}
          <button
            type="button"
            onClick={onSkipBack}
            aria-label="Skip to beginning"
            className={cn(iconBtn, "w-[32px] h-[32px] rounded-[4px]")}
            style={{ color: "var(--hf-text-primary)" }}
          >
            <SkipBack
              className="w-[16px] h-[16px]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>

          {/* rewind — 15×15 */}
          <button
            type="button"
            onClick={onRewind}
            aria-label="Rewind"
            className={cn(iconBtn, "w-[32px] h-[32px] rounded-[4px]")}
            style={{ color: "var(--hf-text-primary)" }}
          >
            <Rewind
              className="w-[15px] h-[15px]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>

          {/* Play / Pause — 40×36 r:20 (pill) */}
          <button
            type="button"
            onClick={onPlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={!canPlay}
            className={cn(
              iconBtn,
              "w-[40px] h-[36px] rounded-[20px]",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            style={{
              backgroundColor: "var(--hf-text-primary)",
              color: "var(--hf-bg)",
            }}
          >
            {isPlaying ? (
              <Pause
                className="w-[18px] h-[18px]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            ) : (
              <Play
                className="w-[18px] h-[18px]"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            )}
          </button>

          {/* fast-forward — 15×15 */}
          <button
            type="button"
            onClick={onFastForward}
            aria-label="Fast forward"
            className={cn(iconBtn, "w-[32px] h-[32px] rounded-[4px]")}
            style={{ color: "var(--hf-text-primary)" }}
          >
            <FastForward
              className="w-[15px] h-[15px]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>

          {/* skip-forward — 16×16 */}
          <button
            type="button"
            onClick={onSkipForward}
            aria-label="Skip to end"
            className={cn(iconBtn, "w-[32px] h-[32px] rounded-[4px]")}
            style={{ color: "var(--hf-text-primary)" }}
          >
            <SkipForward
              className="w-[16px] h-[16px]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* ── Right: Pagination ── Node Rfau3 ──────────────── */}
        <div
          className="flex items-center gap-[12px]"
          role="group"
          aria-label="Page navigation"
        >
          {/* PrevBtn: 28×28 r:16 */}
          <button
            type="button"
            onClick={onPrevPage}
            aria-label="Previous page"
            disabled={currentPage <= 1}
            className={cn(
              iconBtn,
              "flex items-center justify-center w-[28px] h-[28px] rounded-[16px]",
              "disabled:opacity-30 disabled:cursor-not-allowed",
            )}
            style={{ color: "var(--text-on-light)" }}
          >
            <ChevronLeft
              className="w-[16px] h-[16px]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>

          {/* PageCounter: IBM Plex Mono fs:13 fw:500 */}
          <span
            className="font-mono text-[13px] font-medium tabular-nums whitespace-nowrap"
            style={{ color: "var(--text-on-light)" }}
            aria-live="polite"
            aria-label={`Page ${currentPage} of ${totalPages}`}
          >
            Page {currentPage} / {totalPages}
          </span>

          {/* NextBtn: 28×28 r:16 */}
          <button
            type="button"
            onClick={onNextPage}
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            className={cn(
              iconBtn,
              "flex items-center justify-center w-[28px] h-[28px] rounded-[16px]",
              "disabled:opacity-30 disabled:cursor-not-allowed",
            )}
            style={{ color: "var(--text-on-light)" }}
          >
            <ChevronRight
              className="w-[16px] h-[16px]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    );
  },
);

SandboxPlaybackBar.displayName = "SandboxPlaybackBar";
