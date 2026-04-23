import React from "react";
import { cn } from "@/lib/utils";
import { LogoLockup } from "@/components/atoms/LogoLockup";
import { StepBar } from "@/components/molecules/StepBar";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { CoachmarkTourButton } from "@/components/organisms/CoachmarkTourButton";
import { WelcomeGuideButton } from "@/components/organisms/WelcomeGuideButton";
import { VolumeSlider } from "@/components/molecules/VolumeSlider";
import { useDestinationVolume } from "@/hooks/useDestinationVolume";

import { Download, Keyboard, RotateCcw } from "lucide-react";
import { HoverTooltip } from "@/components/atoms/HoverTooltip";
import { useScoreDisplayStore } from "@/store/useScoreDisplayStore";

export interface SandboxHeaderProps extends React.HTMLAttributes<HTMLElement> {
  onExportClick?: () => void;
  /** Restore score to last generated harmony snapshot */
  onResetWorkspaceClick?: () => void;
  showResetWorkspace?: boolean;
  /** Open sandbox keyboard shortcuts reference */
  onHotkeysClick?: () => void;
}

/**
 * SandboxHeader Organism
 * Pencil Node: rW8YN ("Header") — 1440×64px top bar of dcf2A.
 * Logo lockup (left) · Theme toggle (right).
 * Border-bottom: 1px $sonata-detail.
 */
export const SandboxHeader = React.forwardRef<HTMLElement, SandboxHeaderProps>(
  (
    {
      className,
      onExportClick,
      onResetWorkspaceClick,
      showResetWorkspace = false,
      onHotkeysClick,
      ...props
    },
    ref,
  ) => {
    const { volumeDb, setVolumeDb } = useDestinationVolume();
    const showNoteNameLabels = useScoreDisplayStore((s) => s.showNoteNameLabels);
    const setShowNoteNameLabels = useScoreDisplayStore((s) => s.setShowNoteNameLabels);
    return (
      <header
        ref={ref}
        className={cn(
          "flex items-center justify-between w-full h-[64px] px-4 md:px-6 gap-2",
          "shrink-0 hf-print-hide",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-bg)",
          borderBottom: "1px solid var(--sonata-detail)",
        }}
        {...props}
      >
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <LogoLockup />
        </div>

        {/* Center: Progress steps — Step 3: Sandbox */}
        <StepBar
          currentStep={3}
          aria-label="Arrangement progress"
          className="shrink min-w-0 justify-center"
        />

        {/* Right controls — Node 9zJvZ */}
        <div className="flex items-center gap-2 md:gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              className="rounded border-[var(--hf-detail)]"
              checked={showNoteNameLabels}
              onChange={(e) => setShowNoteNameLabels(e.target.checked)}
              aria-label="Show letter names above each notehead"
            />
            <span className="font-mono text-[10px] md:text-[11px] font-medium hidden sm:inline" style={{ color: "var(--hf-text-primary)" }}>
              Letter Names
            </span>
            <HoverTooltip
              ariaLabel="About letter names"
              content={
                "When on, shows each pitch as letter + accidental (e.g. C, F#, Bb) just above each notehead—helpful while learning the staff. Turn off for a clean score or when you read notation confidently."
              }
            />
          </label>
          <div className="w-px h-4 shrink-0 bg-[var(--hf-detail)] opacity-50" />
          <VolumeSlider volumeDb={volumeDb} onVolumeDbChange={setVolumeDb} />
          <div className="w-px h-4 bg-[var(--hf-detail)] opacity-50" />
          <WelcomeGuideButton />
          <CoachmarkTourButton />
          {onHotkeysClick ? (
            <button
              type="button"
              onClick={onHotkeysClick}
              className="flex items-center justify-center w-8 h-8 rounded-md border transition-opacity hover:opacity-90"
              style={{
                borderColor: "var(--hf-detail)",
                color: "var(--hf-text-primary)",
                backgroundColor: "transparent",
              }}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts"
            >
              <Keyboard className="w-[14px] h-[14px] opacity-80" aria-hidden />
            </button>
          ) : null}
          {showResetWorkspace && onResetWorkspaceClick && (
            <button
              type="button"
              onClick={onResetWorkspaceClick}
              className="flex items-center gap-[6px] h-[36px] px-[12px] rounded-[6px] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--hf-surface)]"
              style={{
                backgroundColor: "color-mix(in srgb, var(--hf-surface) 55%, transparent)",
                border: "1px solid var(--hf-detail)",
              }}
              aria-label="Reset workspace to last generated score"
            >
              <RotateCcw className="w-[14px] h-[14px]" style={{ color: "var(--hf-text-primary)" }} />
              <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--hf-text-primary)" }}>
                Reset
              </span>
            </button>
          )}
          <div data-coachmark="step-5">
            <button
              type="button"
              onClick={onExportClick}
              className="flex items-center gap-[6px] h-[36px] px-[14px] rounded-[6px] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--hf-surface)]"
              style={{ backgroundColor: "var(--hf-surface)" }}
            >
              <Download className="w-[14px] h-[14px]" style={{ color: "#F8F8F8" }} />
              <span className="font-mono text-[11px] font-semibold" style={{ color: "#F8F8F8" }}>
                Export
              </span>
            </button>
          </div>
          <div className="w-px h-4 bg-[var(--hf-detail)] opacity-50 mx-0.5 md:mx-1" />
          <ThemeToggle />
        </div>
      </header>
    );
  },
);

SandboxHeader.displayName = "SandboxHeader";
