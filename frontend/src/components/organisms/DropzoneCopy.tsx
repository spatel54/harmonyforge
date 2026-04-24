"use client";

import React from "react";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { UploadPromptContent } from "@/components/molecules/UploadPromptContent";
import { cn } from "@/lib/utils";

export interface DropzoneCopyProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileDrop?: (files: FileList) => void;
  /** Called when user clicks the dropzone to open a file picker */
  onFileSelect?: (files: FileList) => void;
}

/**
 * Exact layout replication of Node 80t2V central content.
 * Combines the Canvas (ktaiB) and Stand (n4ubU) into a single scalable ratio wrapper.
 * Theme-aware: applies dark mode SVG colors from design system Nocturne tokens (Node PnDXj).
 */
export const DropzoneCopy = React.forwardRef<HTMLDivElement, DropzoneCopyProps>(
  ({ className, onFileDrop, onFileSelect, style: propStyle, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isFocusVisible, setIsFocusVisible] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { resolvedTheme } = useTheme();
    // Render light-mode defaults on SSR and the first client paint to prevent hydration mismatch.
    // After mount, resolvedTheme is read from localStorage and drives dark colors.
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
      setMounted(true);
    }, []);
    const isDark = mounted && resolvedTheme === "dark";
    const prefersReducedMotion = useReducedMotion() === true;

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsHovered(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsHovered(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsHovered(false);
      if (e.dataTransfer.files && onFileDrop) {
        onFileDrop(e.dataTransfer.files);
      }
    };

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        if (onFileSelect) {
          onFileSelect(e.target.files);
        } else {
          onFileDrop?.(e.target.files);
        }
      }
    };

    // Nocturne (Dark) — from globals.css & Node PnDXj
    // Light: ktaiB_grad -> #fdf5e6 to #d2b48c; base #dec7a7; stem #d2b48c
    // Dark:  ktaiB_grad -> #2d1817 to #3e2723; base #492c26; stem #3e2723
    const gradStart = isDark ? "#2d1817" : "#fdf5e6";
    const gradEnd = isDark ? "#3e2723" : "#d2b48c";
    const baseColor = isDark ? "#492c26" : "#dec7a7";
    const stemColor = isDark ? "#3e2723" : "#d2b48c";
    const strokeColor = isDark
      ? isHovered
        ? "#f8f8f8"
        : "#c8b8b6"
      : isHovered
        ? "#2d1817"
        : "#7a6b69";

    const glowActive = isHovered || isFocusVisible;

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept=".xml,.musicxml,.mxml,.mxl,.mid,.midi,.pdf,.txt"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleInputChange}
        />
        <div
          ref={ref}
          className={cn(
            "hf-dropzone-interactive relative aspect-1513/880 mx-auto shrink-0 cursor-pointer overflow-visible",
            "transition-[transform] duration-700 ease-[cubic-bezier(0.33,0,0.25,1)]",
            "hover:-translate-y-0.5 hover:scale-[1.002]",
            "active:translate-y-0 active:scale-[1]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--hf-bg-grad-end)]",
            glowActive && "hf-dropzone-interactive--hot",
            className,
          )}
          style={propStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsFocusVisible(true)}
          onBlur={() => setIsFocusVisible(false)}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Choose or drop a score file: MusicXML, MXL, MIDI, or PDF"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          {...props}
        >
          {/* Soft musical aureole (beamed eighth notes) — replaces rectangular hover shadow */}
          <div
            className={cn(
              "hf-dropzone-note-aureole pointer-events-none absolute left-1/2 top-[46%] z-0 w-[min(92vw,480px)] max-w-full -translate-x-1/2 -translate-y-1/2",
              "opacity-0 transition-opacity duration-500 ease-out",
              glowActive && "opacity-100",
              glowActive && !prefersReducedMotion && "hf-dropzone-note-aureole--pulse",
            )}
            aria-hidden
          >
            <div
              className="hf-dropzone-note-aureole-blur w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[min(52vh,420px)]"
              style={{
                color: "var(--hf-accent)",
                filter: prefersReducedMotion ? undefined : "blur(22px)",
              }}
            >
              <svg
                viewBox="0 0 240 260"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
                aria-hidden
              >
                <text
                  x="120"
                  y="195"
                  textAnchor="middle"
                  fill="currentColor"
                  fillOpacity={0.55}
                  style={{
                    fontSize: 200,
                    fontFamily:
                      'ui-serif, Georgia, Cambria, "Times New Roman", Times, "Noto Music", serif',
                  }}
                >
                  {"\u266b"}
                </text>
              </svg>
            </div>
          </div>

          {/* ─── Unified SVG ─── viewBox maps exactly to design proportions ─── */}
          <svg
            className="hf-dropzone-stand-svg absolute inset-0 z-[1] h-full w-full pointer-events-none"
            viewBox="0 0 1513 1010"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              {/* Gradient for the canvas panel (ktaiB / Rectangle 1) */}
              <linearGradient
                id="ktaiB_grad"
                x1="719.5"
                y1="0"
                x2="719.5"
                y2="648"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor={gradStart} />
                <stop offset="1" stopColor={gradEnd} />
              </linearGradient>
            </defs>

            {/* ── 1. Wooden post / stem (1ZRgJ) — behind everything ───────────── */}
            {/* Design: x:715.5 y:69 (in n4ubU), w:82 h:288. n4ubU starts at y:648. */}
            {/* SVG y = 648 + 69 = 717. Visible to bottom of viewBox (1010 - 717 = 293px) */}
            <rect x="715.5" y="717" width="82" height="293" fill={stemColor} />

            {/* ── 2. Canvas panel (ktaiB / Frame 22) — main music stand body ─── */}
            {/* Node ktaiB: Canvas trapezoid (1439px wide, 37px offset inside 1513px) */}
            <g transform="translate(37, 0)">
              {/* Backing plate trapezoid */}
              <path
                d="M122 0l1195 0c12 0 24.2 7 25.1 19.8l96.9 628.2-1439 0 98.9-628.2c0.9-12.8 11.1-19.8 23.1-19.8z"
                fill="url(#ktaiB_grad)"
              />

              {/* ── 3. Dashed drop-zone rect (SQz0K) ─────────────────────────── */}
              {/* Design: x:482.5 y:41 w:474 h:566 */}
              <rect
                x="482.5"
                y="41"
                width="474"
                height="566"
                rx="20"
                stroke={strokeColor}
                strokeOpacity={isHovered ? "0.92" : "0.5"}
                strokeWidth={isHovered ? 2.15 : 2}
                strokeDasharray="10 5"
                className={cn(
                  "transition-[stroke-opacity,stroke-width] duration-500 ease-[cubic-bezier(0.33,0,0.25,1)]",
                  isHovered && "hf-dropzone-dash-glow",
                )}
              />

              {/* ── 4. Upload prompt (zuzV6) ─────────────────────────────────── */}
              {/* Design: Frame 4 at x:560 y:214, we position the foreignObject exactly over the drop-zone rect */}
              <foreignObject x="482.5" y="41" width="474" height="566">
                <div className="w-full h-full min-h-0 flex flex-col items-center justify-center pointer-events-auto gap-2 sm:gap-3 px-4 sm:px-6 py-3 overflow-y-auto hf-scroll-smooth">
                  <UploadPromptContent isDark={isDark} className="max-h-full min-h-0 justify-center" />
                </div>
              </foreignObject>
            </g>

            {/* ── 5. Shelf base (fqxzb) ────────────────────────────────────── */}
            {/* Design: fill:#dec7a7, h:70, w:1513, cornerRadius:20 (all corners) */}
            <rect
              x="0"
              y="648"
              width="1513"
              height="70"
              rx="20"
              fill={baseColor}
            />
          </svg>
        </div>
      </>
    );
  },
);

DropzoneCopy.displayName = "DropzoneCopy";
