"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VolumeSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  volumeDb: number;
  onVolumeDbChange: (value: number) => void;
  /** Display width (px) of the range input. Defaults to 80. */
  width?: number;
}

/**
 * Inline playback volume slider (Iter2 §4). Shared Tone.getDestination() gain
 * affects both RiffScore's sampler and HarmonyForge's Tone.js fallback, so a
 * single slider controls every audible output in the sandbox.
 */
export const VolumeSlider = React.forwardRef<HTMLDivElement, VolumeSliderProps>(
  ({ volumeDb, onVolumeDbChange, width = 80, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-[6px] shrink-0", className)}
        role="group"
        aria-label="Playback volume"
        title="Playback volume (persists across sessions)"
        {...props}
      >
        {volumeDb <= -40 ? (
          <VolumeX
            className="w-[14px] h-[14px]"
            strokeWidth={1.75}
            aria-hidden="true"
            style={{ color: "var(--hf-text-secondary)" }}
          />
        ) : (
          <Volume2
            className="w-[14px] h-[14px]"
            strokeWidth={1.75}
            aria-hidden="true"
            style={{ color: "var(--hf-text-secondary)" }}
          />
        )}
        <input
          type="range"
          min={-40}
          max={6}
          step={1}
          value={volumeDb}
          onChange={(e) => onVolumeDbChange(Number.parseFloat(e.target.value))}
          className="h-1.5 rounded-full accent-[var(--hf-accent)] cursor-pointer transition-[box-shadow,opacity] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
          style={{ width }}
          aria-label="Playback volume (decibels)"
          aria-valuemin={-40}
          aria-valuemax={6}
          aria-valuenow={volumeDb}
        />
        <span
          className="font-mono text-[10px] tabular-nums min-w-[32px] text-right"
          style={{ color: "var(--hf-text-secondary)" }}
        >
          {volumeDb > 0 ? `+${Math.round(volumeDb)}` : Math.round(volumeDb)} dB
        </span>
      </div>
    );
  },
);

VolumeSlider.displayName = "VolumeSlider";
