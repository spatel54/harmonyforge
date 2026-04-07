"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DocumentHeader } from "@/components/organisms/DocumentHeader";
import { ScorePreviewPanel } from "@/components/organisms/ScorePreviewPanel";
import { EnsembleBuilderPanel } from "@/components/organisms/EnsembleBuilderPanel";
import {
  TransitionOverlay,
  TRANSITION_MIN_VISIBLE_MS,
} from "@/components/organisms/TransitionOverlay";
import { awaitMinElapsedSince } from "@/lib/ui/awaitMinElapsed";
import { useUploadStore } from "@/store/useUploadStore";
import type { GenerationConfig } from "@/components/organisms/EnsembleBuilderPanel";
import { parseMusicXML, extractMusicXMLMetadata } from "@/lib/music/musicxmlParser";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { OnboardingCoachmark } from "@/components/organisms/OnboardingCoachmark";
import { completeOnboarding, isOnboardingComplete } from "@/lib/onboarding";
import { COACHMARKS_ENABLED, useCoachmarkStore } from "@/store/useCoachmarkStore";
import { getStudyCondition } from "@/lib/study/studyConfig";
import { readMelodyXmlForReviewer } from "@/lib/study/readMelodyXml";
import { logStudyEvent } from "@/lib/study/studyEventLog";
import { isProbablyZipBytes } from "@/lib/music/isProbablyZipBytes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const GENERATE_TIMEOUT_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_GENERATE_TIMEOUT_MS;
  if (raw == null || raw === "") return 180_000;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 15_000 ? Math.min(n, 600_000) : 180_000;
})();

/**
 * Document Page — /document
 * Step 2: Score preview (left) + Ensemble Builder (right).
 * Parses uploaded MusicXML to show preview; on "Generate Harmonies" → POST file + config → store MusicXML → navigate to /sandbox.
 */
export default function DocumentPage() {
  const router = useRouter();
  const coachmarkTourActive = useCoachmarkStore((s) => s.isActive);
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewScore, setPreviewScore] = React.useState<EditableScore | null>(null);
  const [previewMeta, setPreviewMeta] = React.useState<{ title: string; meta: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const file = useUploadStore((s) => s.file);
  const storePreviewXml = useUploadStore((s) => s.previewMusicXML);
  const generatedMusicXML = useUploadStore((s) => s.generatedMusicXML);
  const setGeneratedMusicXML = useUploadStore((s) => s.setGeneratedMusicXML);
  const setPreviewMusicXML = useUploadStore((s) => s.setPreviewMusicXML);
  const restoreFromStorage = useUploadStore((s) => s.restoreFromStorage);

  React.useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  // Redirect to upload if no file (e.g. direct nav or refresh) — coachmark tour may visit without a file
  React.useEffect(() => {
    if (coachmarkTourActive) return;
    if (!file) {
      if (generatedMusicXML) {
        router.replace("/sandbox");
      } else {
        router.replace("/");
      }
    }
  }, [file, generatedMusicXML, router, coachmarkTourActive]);

  React.useEffect(() => {
    setShowOnboarding(!isOnboardingComplete());
  }, []);

  React.useEffect(() => {
    if (!file) {
      setPreviewScore(null);
      setPreviewMeta(null);
      return;
    }

    const applyXml = (xml: string) => {
      const meta = extractMusicXMLMetadata(xml);
      setPreviewMeta(meta);
      setPreviewScore(parseMusicXML(xml));
    };

    if (storePreviewXml && storePreviewXml.trim().length > 0) {
      applyXml(storePreviewXml);
      return;
    }

    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!["xml", "musicxml"].includes(ext)) {
      setPreviewScore(null);
      setPreviewMeta({
        title: file.name.replace(/\.[^/.]+$/, ""),
        meta: "No preview — go back and upload again",
      });
      return;
    }

    setPreviewScore(null);
    setPreviewMeta(null);

    let cancelled = false;
    void (async () => {
      try {
        const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
        if (cancelled) return;
        if (isProbablyZipBytes(head)) {
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
          if (cancelled) return;
          setPreviewMusicXML(xml);
          return;
        }
      } catch {
        if (!cancelled) {
          setPreviewScore(null);
          setPreviewMeta({
            title: file.name.replace(/\.[^/.]+$/, ""),
            meta: "Could not load preview (MXL/ZIP mislabeled as .xml, or engine unreachable)",
          });
        }
        return;
      }

      if (cancelled) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (cancelled) return;
        applyXml(String(reader.result));
      };
      reader.onerror = () => {
        if (!cancelled) {
          setPreviewScore(null);
          setPreviewMeta({
            title: file.name.replace(/\.[^/.]+$/, ""),
            meta: "Could not read score file",
          });
        }
      };
      reader.readAsText(file, "utf-8");
    })();

    return () => {
      cancelled = true;
    };
  }, [file, storePreviewXml, setPreviewMusicXML]);

  // Don't render document UI while redirecting (no file), unless product tour is active
  if (!file && !coachmarkTourActive) {
    return null;
  }

  const studyCondition = getStudyCondition();
  const reviewerArm = studyCondition === "reviewer_primary";

  const handleGenerate = async (config: GenerationConfig) => {
    if (!file) {
      setError("No file uploaded. Please go back and upload a score.");
      return;
    }
    setIsTransitioning(true);
    setError(null);
    const t0 = Date.now();
    const minMs = reviewerArm
      ? TRANSITION_MIN_VISIBLE_MS.melody_only
      : TRANSITION_MIN_VISIBLE_MS.generating;
    try {
      if (reviewerArm) {
        logStudyEvent("skipped_generation_reviewer_arm", {
          mood: config.mood,
          genre: config.genre,
        });
        const musicXML = await readMelodyXmlForReviewer(file, storePreviewXml);
        setGeneratedMusicXML(musicXML);
        await awaitMinElapsedSince(t0, minMs);
        router.push("/sandbox");
        return;
      }

      logStudyEvent("generate_harmonies_clicked", {
        mood: config.mood,
        genre: config.genre,
      });
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "config",
        JSON.stringify({
          mood: config.mood,
          genre: config.genre,
          instruments: config.instruments,
        })
      );
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(`${API_BASE}/api/generate-from-file`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          throw new Error(
            `Generation timed out after ${GENERATE_TIMEOUT_MS / 1000}s. PDF uploads can spend most of that in OMR; MusicXML/MXL/MIDI is usually faster. Try a shorter score, export MXL from your notation app, or raise NEXT_PUBLIC_GENERATE_TIMEOUT_MS. On the engine, set HF_SOLVER_MAX_MS=0 for no solver wall clock on file routes (default is ~108s when unset).`,
          );
        }
        throw e;
      } finally {
        window.clearTimeout(timeoutId);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed: ${res.status}`);
      }
      const musicXML = await res.text();
      setGeneratedMusicXML(musicXML);
      await awaitMinElapsedSince(t0, minMs);
      router.push("/sandbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <>
      <div className="relative flex flex-col w-screen h-screen overflow-hidden bg-(--hf-bg)">
        {/* Top navigation bar */}
        <DocumentHeader currentStep={2} />

        {/* Two-panel body */}
        <div className="flex flex-row flex-1 min-h-0">
          <ScorePreviewPanel
            score={previewScore}
            scoreTitle={
              previewMeta?.title ??
              (file
                ? file.name.replace(/\.[^/.]+$/, "")
                : coachmarkTourActive
                  ? "Preview"
                  : "The First Noel")
            }
            scoreMeta={
              previewMeta?.meta ??
              (coachmarkTourActive && !file
                ? "Upload a file in a real session to see your score here."
                : "Traditional • 4 voices • Page 1 of 4")
            }
            onReupload={() => router.push("/")}
          />
          <EnsembleBuilderPanel
            onGenerateHarmonies={handleGenerate}
            isGenerating={isTransitioning}
            studyPrimaryVariant={
              reviewerArm ? "reviewer_melody" : "generate"
            }
            studyPanelSubtitle={
              reviewerArm
                ? "You will build or adjust harmonies in the editor; the assistant flags issues and suggests fixes."
                : undefined
            }
          />
        </div>
        {error && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg font-mono text-sm bg-red-500/20 text-red-200 border border-red-500/50"
            role="alert"
          >
            {error}
          </div>
        )}
        {showOnboarding && !COACHMARKS_ENABLED && (
          <OnboardingCoachmark
            stepLabel="Step 2 of 3"
            title="Set mood and instrumentation"
            description={
              reviewerArm
                ? "Preview your score and set mood and genre for context. Continue with your melody only—you will add harmonies in the sandbox."
                : "Preview your uploaded score, choose mood and genre, then select instruments before generating harmonies."
            }
            primaryCta="Continue"
            onPrimary={() => setShowOnboarding(false)}
            onSecondary={() => {
              completeOnboarding();
              setShowOnboarding(false);
            }}
            secondaryCta="Skip tour"
          />
        )}
      </div>

      {/* Loading overlay */}
      <TransitionOverlay
        variant={reviewerArm ? "melody_only" : "generating"}
        visible={isTransitioning}
      />
    </>
  );
}
