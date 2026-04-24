import React from "react";
import { cn } from "@/lib/utils";
import { UploadIcon } from "@/components/atoms/UploadIcon";

export interface UploadPromptContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isDark?: boolean;
}

/**
 * UploadPromptContent Molecule
 * Extracted from Pencil Node ID: zuzV6
 * Combines the isolated UploadIcon Atom with the IBM Plex Mono typographic instructional headers (`H6BGR`, `R3OO2`).
 */
export const UploadPromptContent = React.forwardRef<
  HTMLDivElement,
  UploadPromptContentProps
>(({ className, isDark = false, ...props }, ref) => {
  // Explicit tokens — Tailwind dark: doesn't cascade inside SVG <foreignObject>
  const primaryColor = isDark ? "#f8f8f8" : "#2D1817";
  const secondaryColor = isDark ? "#b0a090" : "#7A6B69";
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 sm:gap-4 w-full min-h-0",
        className,
      )}
      {...props}
    >
      {/* Sized to fit SVG foreignObject: wrap allowed, no nowrap (prevents horizontal clip). */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 w-full min-w-0">
        <UploadIcon
          className="w-12 h-12 sm:w-16 sm:h-16 shrink-0"
          style={{ color: primaryColor }}
        />
        <h2
          className="font-mono text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-center text-balance max-w-full px-1 break-words"
          style={{ color: primaryColor }}
        >
          Bring your score
        </h2>
      </div>

      <p
        className="font-mono text-base sm:text-lg md:text-xl lg:text-2xl font-normal leading-snug text-center text-balance max-w-full px-1 break-words"
        style={{ color: secondaryColor }}
      >
        MusicXML, MXL, MIDI, or PDF. Click or drop.
      </p>
    </div>
  );
});

UploadPromptContent.displayName = "UploadPromptContent";
