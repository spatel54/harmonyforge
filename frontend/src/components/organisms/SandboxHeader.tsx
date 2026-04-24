import React from "react";
import { cn } from "@/lib/utils";
import { LogoLockup } from "@/components/atoms/LogoLockup";
import { StepBar } from "@/components/molecules/StepBar";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { CoachmarkTourButton } from "@/components/organisms/CoachmarkTourButton";
import { WelcomeGuideButton } from "@/components/organisms/WelcomeGuideButton";
import { TeamNavButton } from "@/components/atoms/TeamNavButton";
import { VolumeSlider } from "@/components/molecules/VolumeSlider";
import { useDestinationVolume } from "@/hooks/useDestinationVolume";

import { Download, Keyboard, RotateCcw } from "lucide-react";
import { HoverTooltip } from "@/components/atoms/HoverTooltip";
import { ActionTooltip } from "@/components/atoms/ActionTooltip";
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
          "hf-sandbox-header flex items-center justify-between w-full h-[64px] px-4 md:px-6 gap-2",
          "shrink-0 hf-print-hide",
          className,
        )}
        style={{
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
          <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0 rounded-md px-1.5 py-0.5 -mx-1.5 -my-0.5 transition-colors hover:bg-[color-mix(in_srgb,var(--hf-surface)_10%,transparent)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--hf-accent)] has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-[var(--hf-bg)]">
            <input
              type="checkbox"
              className="rounded border-[var(--hf-detail)] size-3.5 accent-[var(--hf-surface)] transition-transform active:scale-90"
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
                "When on, each pitch shows as letter and accidental (C, F#, Bb) just above the notehead. Useful while learning the staff. Turn off for a clean score or when you read fluently."
              }
            />
          </label>
          <div className="w-px h-4 shrink-0 bg-[var(--hf-detail)] opacity-50" />
          <VolumeSlider volumeDb={volumeDb} onVolumeDbChange={setVolumeDb} />
          <div className="w-px h-4 bg-[var(--hf-detail)] opacity-50" />
          <WelcomeGuideButton />
          <TeamNavButton />
          <CoachmarkTourButton />
          {onHotkeysClick ? (
            <ActionTooltip content="Open the sandbox keyboard shortcuts reference.">
              <button
                type="button"
                onClick={onHotkeysClick}
                className="hf-pressable flex items-center justify-center w-8 h-8 rounded-md border shadow-sm hover:shadow-md hover:bg-[color-mix(in_srgb,var(--hf-surface)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--hf-surface)_16%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
                style={{
                  borderColor: "var(--hf-detail)",
                  color: "var(--hf-text-primary)",
                  backgroundColor: "transparent",
                }}
                aria-label="Keyboard shortcuts"
              >
                <Keyboard className="w-[14px] h-[14px] opacity-80" aria-hidden />
              </button>
            </ActionTooltip>
          ) : null}
          {showResetWorkspace && onResetWorkspaceClick && (
            <ActionTooltip content="Restore the workspace to the last generated harmony snapshot.">
              <button
                type="button"
                onClick={onResetWorkspaceClick}
                className="hf-pressable flex items-center gap-[6px] h-[36px] px-[12px] rounded-[6px] border shadow-sm hover:shadow-md hover:brightness-[1.03] active:brightness-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-[var(--hf-bg)]"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--hf-surface) 55%, transparent)",
                  borderColor: "var(--hf-detail)",
                }}
                aria-label="Reset workspace to last generated score"
              >
                <RotateCcw className="w-[14px] h-[14px]" style={{ color: "var(--hf-text-primary)" }} />
                <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--hf-text-primary)" }}>
                  Reset
                </span>
              </button>
            </ActionTooltip>
          )}
          <div data-coachmark="step-5">
            <ActionTooltip content="Export your score—MusicXML, MIDI, audio, images, and more from the export dialog.">
              <button
                type="button"
                onClick={onExportClick}
                className="hf-pressable flex items-center gap-[6px] h-[36px] px-[14px] rounded-[6px] shadow-md hover:shadow-lg hover:brightness-[1.06] active:brightness-[0.94] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-[var(--hf-bg)]"
                style={{ backgroundColor: "var(--hf-surface)" }}
                aria-label="Export score"
              >
                <Download className="w-[14px] h-[14px]" style={{ color: "#F8F8F8" }} />
                <span className="font-mono text-[11px] font-semibold" style={{ color: "#F8F8F8" }}>
                  Export
                </span>
              </button>
            </ActionTooltip>
          </div>
          <div className="w-px h-4 bg-[var(--hf-detail)] opacity-50 mx-0.5 md:mx-1" />
          <ActionTooltip content="Switch between light and dark appearance.">
            <ThemeToggle />
          </ActionTooltip>
        </div>
      </header>
    );
  },
);

SandboxHeader.displayName = "SandboxHeader";
