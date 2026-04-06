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
      className={cn("flex flex-col items-center gap-[20px]", className)}
      {...props}
    >
      {/* Inner Frame (Node: YGm78) combining Icon + Primary Header grouped with gap-[15px] */}
      <div className="flex flex-col items-center gap-[15px] w-full">
        {/* Target exact fill context from 'Upload Score' parent text group */}
        <UploadIcon
          className="w-12 h-12 lg:w-16 lg:h-16"
          style={{ color: primaryColor }}
        />
        <h2
          className="font-mono text-3xl lg:text-5xl font-medium leading-none text-center whitespace-nowrap"
          style={{ color: primaryColor }}
        >
          Upload Score
        </h2>
      </div>

      {/* Secondary helper text (Node: R3OO2) */}
      <p
        className="font-mono text-xl lg:text-3xl font-normal leading-none text-center whitespace-nowrap"
        style={{ color: secondaryColor }}
      >
        MusicXML / MXL / MIDI / PDF
      </p>
    </div>
  );
});

UploadPromptContent.displayName = "UploadPromptContent";
