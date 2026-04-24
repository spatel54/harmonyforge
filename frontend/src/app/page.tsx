"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DocumentHeader } from "@/components/organisms/DocumentHeader";
import { PlaygroundBackground } from "@/components/organisms/PlaygroundBackground";
import { DropzoneCopy } from "@/components/organisms/DropzoneCopy";
import {
  TransitionOverlay,
  TRANSITION_MIN_VISIBLE_MS,
} from "@/components/organisms/TransitionOverlay";
import { awaitMinElapsedSince } from "@/lib/ui/awaitMinElapsed";
import { BrandTitle } from "@/components/atoms/BrandTitle";
import { useUploadStore } from "@/store/useUploadStore";
import { OnboardingModal } from "@/components/organisms/OnboardingModal";
import { completeOnboarding, isOnboardingComplete } from "@/lib/onboarding";
import { COACHMARKS_ENABLED } from "@/store/useCoachmarkStore";
import { enrichIntakePreviewError } from "@/lib/ui/intakeErrorHints";
import { needsEnginePreviewForExtension } from "@/lib/ui/needsEnginePreviewForExtension";
import { AppFooterStrip } from "@/components/organisms/AppFooterStrip";
import { AlertTriangle } from "lucide-react";

/**
 * Playground Screen (Step 1: Upload)
 * Implements the entry point for HarmonyForge.
 * Design Spec: Node YY3jo / vXAsZ / 2kinX
 */
export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const setFile = useUploadStore((s) => s.setFile);
  const setPreviewMusicXML = useUploadStore((s) => s.setPreviewMusicXML);

  React.useEffect(() => {
    setShowOnboarding(!isOnboardingComplete());
  }, []);

  const handleFileUpload = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    setUploadError(null);
    setFile(file);
    setIsTransitioning(true);
    const t0 = Date.now();
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const needsServerPreview = needsEnginePreviewForExtension(ext);
    try {
      if (needsServerPreview) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/to-preview-musicxml`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            typeof err.error === "string" ? err.error : `Preview failed: ${res.status}`,
          );
        }
        const xml = await res.text();
        setPreviewMusicXML(xml);
      }
      await awaitMinElapsedSince(t0, TRANSITION_MIN_VISIBLE_MS.parsing);
      router.push("/document");
    } catch (e) {
      setFile(null);
      setPreviewMusicXML(null);
      const raw = e instanceof Error ? e.message : "We couldn’t prepare a preview.";
      setUploadError(
        needsServerPreview ? enrichIntakePreviewError(raw, ext) : raw,
      );
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <>
      <PlaygroundBackground className="flex flex-col min-h-full">
        {/* Header with StepBar set to Step 1 (Playground) */}
        <DocumentHeader currentStep={1} />

        {/* Main Content: Brand Title and scaled-down Dropzone */}
        <main className="flex-1 flex flex-col items-center justify-between pb-0 overflow-y-auto hf-scroll-smooth px-4 sm:px-6">
          {/* Title takes up the top empty space and centers vertically before the stand */}
          <div className="flex-1 flex items-center justify-center pt-6 sm:pt-10 pb-4 w-full">
            <div className="hf-playground-title-wrap">
              <BrandTitle className="hf-playground-title-prestige text-center text-[clamp(2.25rem,8vw,3.56rem)] leading-[1.12] tracking-[-0.02em]" />
            </div>
          </div>

          {/* Scaled down music stand (max 1000px) flush with the bottom */}
          <div
            className="hf-playground-stand w-full max-w-[1000px] shrink-0 mt-4 sm:mt-8 flex flex-col gap-4 pb-6"
            data-coachmark="step-1"
          >
            {uploadError && (
              <div
                className="hf-playground-error rounded-xl border px-4 py-3.5 text-left shadow-md"
                role="alert"
                style={{
                  backgroundColor: "var(--semantic-violation-10)",
                  borderColor: "color-mix(in srgb, var(--semantic-violation) 45%, var(--hf-detail))",
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    className="shrink-0 w-[18px] h-[18px] mt-0.5"
                    style={{ color: "var(--semantic-violation)" }}
                    aria-hidden
                  />
                  <pre
                    className="font-mono text-[11px] sm:text-[12px] leading-relaxed whitespace-pre-wrap break-words flex-1 max-h-[min(40vh,320px)] overflow-y-auto hf-scroll-smooth"
                    style={{ color: "var(--hf-text-primary)" }}
                  >
                    {uploadError}
                  </pre>
                  <button
                    type="button"
                    className="hf-pressable shrink-0 font-mono text-[11px] font-medium rounded-md px-2 py-1 -mr-1 -mt-0.5"
                    style={{
                      color: "var(--semantic-violation)",
                      border: "1px solid color-mix(in srgb, var(--semantic-violation) 35%, transparent)",
                    }}
                    onClick={() => setUploadError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            <DropzoneCopy
              onFileDrop={handleFileUpload}
              onFileSelect={handleFileUpload}
              className="w-full"
            />
          </div>
        </main>
        <AppFooterStrip />
        {showOnboarding && !COACHMARKS_ENABLED && (
          <OnboardingModal
            onDismiss={() => {
              completeOnboarding();
              setShowOnboarding(false);
            }}
          />
        )}
      </PlaygroundBackground>

      {/* Loading overlay — mounts over everything */}
      <TransitionOverlay variant="parsing" visible={isTransitioning} />
    </>
  );
}
