import React from "react";
import { cn } from "@/lib/utils";
import { LogoLockup } from "@/components/atoms/LogoLockup";
import { StepBar } from "@/components/molecules/StepBar";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { CoachmarkTourButton } from "@/components/organisms/CoachmarkTourButton";
import { WelcomeGuideButton } from "@/components/organisms/WelcomeGuideButton";
import { VolumeSlider } from "@/components/molecules/VolumeSlider";
import { useDestinationVolume } from "@/hooks/useDestinationVolume";

import { Download } from "lucide-react";
import { HoverTooltip } from "@/components/atoms/HoverTooltip";
import { useScoreDisplayStore } from "@/store/useScoreDisplayStore";

export interface SandboxHeaderProps extends React.HTMLAttributes<HTMLElement> {
  onExportClick?: () => void;
}

/**
 * SandboxHeader Organism
 * Pencil Node: rW8YN ("Header") — 1440×64px top bar of dcf2A.
 * Logo lockup (left) · Theme toggle (right).
 * Border-bottom: 1px $sonata-detail.
 */
export const SandboxHeader = React.forwardRef<HTMLElement, SandboxHeaderProps>(
  ({ className, onExportClick, ...props }, ref) => {
    const { volumeDb, setVolumeDb } = useDestinationVolume();
    const showNoteNameLabels = useScoreDisplayStore((s) => s.showNoteNameLabels);
    const setShowNoteNameLabels = useScoreDisplayStore((s) => s.setShowNoteNameLabels);
    return (
      <header
        ref={ref}
        className={cn(
          "flex items-center justify-between w-full h-[64px] px-[40px]",
          "shrink-0 hf-print-hide",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-bg)",
          borderBottom: "1px solid var(--sonata-detail)",
        }}
        {...props}
      >
        {/* Logo — Node ipFi5 */}
        <LogoLockup />

        {/* Center: Progress steps — Step 3: Sandbox */}
        <StepBar currentStep={3} aria-label="Arrangement progress" />

        {/* Right controls — Node 9zJvZ */}
        <div className="flex items-center gap-[12px]">
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              className="rounded border-[var(--hf-detail)]"
              checked={showNoteNameLabels}
              onChange={(e) => setShowNoteNameLabels(e.target.checked)}
              aria-label="Show note names above each notehead"
            />
            <span className="font-mono text-[11px] font-medium" style={{ color: "var(--hf-text-primary)" }}>
              Note names
            </span>
            <HoverTooltip
              ariaLabel="About note names"
              content={
                "When on, shows each pitch as letter + accidental (e.g. C, F#, Bb) just above each notehead—helpful while learning the staff. Turn off for a clean score or when you read notation confidently."
              }
            />
          </label>
          <div className="w-[1px] h-[16px] bg-[var(--hf-detail)] opacity-50" />
          <VolumeSlider volumeDb={volumeDb} onVolumeDbChange={setVolumeDb} />
          <div className="w-[1px] h-[16px] bg-[var(--hf-detail)] opacity-50" />
          <WelcomeGuideButton />
          <CoachmarkTourButton />
          <div data-coachmark="step-5">
            <button
              type="button"
              onClick={onExportClick}
              className="flex items-center gap-[6px] h-[32px] px-[12px] rounded-[6px] border border-[var(--hf-detail)] text-[var(--hf-text-primary)] hover:bg-[rgba(var(--hf-surface-rgb),0.05)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-surface)]"
            >
              <Download className="w-[14px] h-[14px] opacity-70" />
              <span className="font-mono text-[11px] font-medium mt-0.5">
                Export
              </span>
            </button>
          </div>
          <div className="w-[1px] h-[16px] bg-[var(--hf-detail)] opacity-50 mx-[4px]" />
          <ThemeToggle />
        </div>
      </header>
    );
  },
);

SandboxHeader.displayName = "SandboxHeader";
