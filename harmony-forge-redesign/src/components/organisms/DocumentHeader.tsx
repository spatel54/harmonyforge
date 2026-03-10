import React from "react";
import { cn } from "@/lib/utils";
import { LogoLockup } from "@/components/atoms/LogoLockup";
import { StepBar } from "@/components/molecules/StepBar";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";

export interface DocumentHeaderProps extends React.HTMLAttributes<HTMLElement> {
  currentStep?: 1 | 2 | 3;
}

/**
 * DocumentHeader Organism
 * Extracted from Pencil Node ID: tHpLP ("Header")
 * 64px top bar: Logo (left) · StepBar (center) · ThemeToggle (right).
 * Bottom border uses --hf-detail (light) / --nocturne-surface-40 (dark).
 */
export const DocumentHeader = React.forwardRef<
  HTMLElement,
  DocumentHeaderProps
>(({ currentStep = 2, className, ...props }, ref) => {
  return (
    <header
      ref={ref}
      className={cn(
        "flex items-center justify-between w-full h-[64px] shrink-0",
        "px-[40px]",
        className,
      )}
      style={{
        backgroundColor: "var(--hf-bg)",
        borderBottom: "1px solid var(--hf-detail)",
      }}
      {...props}
    >
      {/* Left: Logo */}
      <LogoLockup />

      {/* Center: Progress steps */}
      <StepBar currentStep={currentStep} aria-label="Arrangement progress" />

      {/* Right: Theme toggle */}
      <ThemeToggle />
    </header>
  );
});

DocumentHeader.displayName = "DocumentHeader";
