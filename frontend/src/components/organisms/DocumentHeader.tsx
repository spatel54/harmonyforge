import React from "react";
import { cn } from "@/lib/utils";
import { LogoLockup } from "@/components/atoms/LogoLockup";
import { StepBar } from "@/components/molecules/StepBar";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { CoachmarkTourButton } from "@/components/organisms/CoachmarkTourButton";
import { WelcomeGuideButton } from "@/components/organisms/WelcomeGuideButton";
import { TeamNavButton } from "@/components/atoms/TeamNavButton";
import { ActionTooltip } from "@/components/atoms/ActionTooltip";

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
        "hf-sandbox-header hf-print-hide flex items-center justify-between w-full h-[64px] shrink-0",
        "px-4 sm:px-6 md:px-10 lg:px-[40px] gap-2",
        className,
      )}
      style={{
        borderBottom: "1px solid var(--hf-detail)",
      }}
      {...props}
    >
      {/* Left: Logo */}
      <LogoLockup />

      {/* Center: Progress steps */}
      <StepBar
        currentStep={currentStep}
        aria-label="Arrangement progress"
        className="shrink min-w-0 justify-center"
      />

      {/* Right: Tour + theme */}
      <div className="flex items-center gap-2">
        <WelcomeGuideButton />
        <TeamNavButton />
        <CoachmarkTourButton />
        <ActionTooltip content="Switch between light and dark appearance.">
          <ThemeToggle />
        </ActionTooltip>
      </div>
    </header>
  );
});

DocumentHeader.displayName = "DocumentHeader";
