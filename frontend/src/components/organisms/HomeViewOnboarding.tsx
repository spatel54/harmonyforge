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
import { OnboardingModal } from "@/components/organisms/OnboardingModal";
import { useUploadStore } from "@/store/useUploadStore";
import { enrichIntakePreviewError } from "@/lib/ui/intakeErrorHints";
import { needsEnginePreviewForExtension } from "@/lib/ui/needsEnginePreviewForExtension";

/**
 * Standalone playground + onboarding modal for `/onboarding`.
 * Modal shows on every visit; upload flow matches production `/`.
 */
export function HomeViewOnboarding() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [showModal, setShowModal] = React.useState(false);
  const setFile = useUploadStore((s) => s.setFile);
  const setPreviewMusicXML = useUploadStore((s) => s.setPreviewMusicXML);

  React.useEffect(() => {
    setShowModal(true);
  }, []);

  const handleDismiss = React.useCallback(() => {
    setShowModal(false);
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
      const raw = e instanceof Error ? e.message : "Could not prepare preview";
      setUploadError(
        needsServerPreview ? enrichIntakePreviewError(raw, ext) : raw,
      );
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <>
      <PlaygroundBackground className="flex flex-col">
        <DocumentHeader currentStep={1} />

        <main className="flex-1 flex flex-col items-center justify-between pb-0 overflow-y-auto">
          <div className="flex-1 flex items-center justify-center pt-8">
            <BrandTitle className="text-center" />
          </div>

          <div
            className="w-full max-w-[1000px] shrink-0 mt-8 flex flex-col gap-3"
            data-coachmark="step-1"
          >
            {uploadError && (
              <div
                className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-left"
                role="alert"
              >
                <pre className="font-mono text-[11px] text-red-100/95 whitespace-pre-wrap break-words">
                  {uploadError}
                </pre>
              </div>
            )}
            <DropzoneCopy
              onFileDrop={handleFileUpload}
              onFileSelect={handleFileUpload}
              className="w-full"
            />
          </div>
        </main>
      </PlaygroundBackground>

      <TransitionOverlay variant="parsing" visible={isTransitioning} />

      {showModal && <OnboardingModal onDismiss={handleDismiss} />}
    </>
  );
}
