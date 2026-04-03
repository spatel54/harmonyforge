"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DocumentHeader } from "@/components/organisms/DocumentHeader";
import { PlaygroundBackground } from "@/components/organisms/PlaygroundBackground";
import { DropzoneCopy } from "@/components/organisms/DropzoneCopy";
import { TransitionOverlay } from "@/components/organisms/TransitionOverlay";
import { BrandTitle } from "@/components/atoms/BrandTitle";
import { useUploadStore } from "@/store/useUploadStore";
import { OnboardingCoachmark } from "@/components/organisms/OnboardingCoachmark";
import { completeOnboarding, isOnboardingComplete } from "@/lib/onboarding";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const needsServerPreview = ["pdf", "mxl", "mid", "midi"].includes(ext);
    try {
      if (needsServerPreview) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE}/api/to-preview-musicxml`, {
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
      router.push("/document");
    } catch (e) {
      setFile(null);
      setPreviewMusicXML(null);
      setUploadError(e instanceof Error ? e.message : "Could not prepare preview");
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <>
      <PlaygroundBackground className="flex flex-col">
        {/* Header with StepBar set to Step 1 (Playground) */}
        <DocumentHeader currentStep={1} />

        {/* Main Content: Brand Title and scaled-down Dropzone */}
        <main className="flex-1 flex flex-col items-center justify-between pb-0 overflow-y-auto">
          {/* Title takes up the top empty space and centers vertically before the stand */}
          <div className="flex-1 flex items-center justify-center pt-8">
            <BrandTitle className="text-center" />
          </div>

          {/* Scaled down music stand (max 1000px) flush with the bottom */}
          <div className="w-full max-w-[1000px] shrink-0 mt-8 flex flex-col gap-3">
            {uploadError && (
              <div
                className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-left"
                role="alert"
              >
                <div className="flex items-start justify-between gap-3">
                  <pre className="font-mono text-[11px] leading-relaxed text-red-100/95 whitespace-pre-wrap break-words flex-1 max-h-[min(40vh,320px)] overflow-y-auto">
                    {uploadError}
                  </pre>
                  <button
                    type="button"
                    className="shrink-0 font-mono text-[11px] text-red-200 underline"
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
        {showOnboarding && (
          <OnboardingCoachmark
            stepLabel="Step 1 of 3"
            title="Start by uploading a score"
            description="Drop MusicXML, MXL, MIDI, or PDF to begin. PDF harmony generation needs pdfalto, Poppler (pdftoppm), and oemer on the engine host. You will configure mood and instruments on the next screen."
            primaryCta="Got it"
            onPrimary={() => setShowOnboarding(false)}
            onSecondary={() => {
              completeOnboarding();
              setShowOnboarding(false);
            }}
            secondaryCta="Skip tour"
          />
        )}
      </PlaygroundBackground>

      {/* Loading overlay — mounts over everything */}
      <TransitionOverlay variant="parsing" visible={isTransitioning} />
    </>
  );
}
