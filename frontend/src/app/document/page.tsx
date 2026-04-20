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
import { useGenerationConfigStore } from "@/store/useGenerationConfigStore";
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
import { useClientPdfPreview } from "@/hooks/useClientPdfPreview";

const GENERATE_TIMEOUT_MS = (() => {
  const raw = process.env.NEXT_PUBLIC_GENERATE_TIMEOUT_MS;
  if (raw == null || raw === "") return 180_000;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 15_000 ? Math.min(n, 600_000) : 180_000;
})();

function uploadedFileStem(file: File | null): string | null {
  if (!file) return null;
  const stem = file.name.replace(/\.[^/.]+$/, "").trim();
  return stem.length > 0 ? stem : null;
}

function deriveDisplayScoreTitle(
  file: File | null,
  previewMeta: { title: string; meta: string } | null,
  previewScore: EditableScore | null,
): string | null {
  const fileTitle = uploadedFileStem(file);
  const rawMetaTitle = previewMeta?.title?.trim() ?? "";

  if (!rawMetaTitle || rawMetaTitle.toLowerCase() === "score") {
    return fileTitle;
  }

  const normalizedMetaTitle = rawMetaTitle.toLowerCase();
  const partNames = (previewScore?.parts ?? [])
    .map((p) => p.name.trim().toLowerCase())
    .filter((name) => name.length > 0);

  // Some sources place the instrument/part name in movement-title.
  // If that happens, prefer the uploaded filename as the score title.
  if (partNames.includes(normalizedMetaTitle)) {
    return fileTitle ?? rawMetaTitle;
  }

  const normalizedMetaLine = (previewMeta?.meta ?? "").trim().toLowerCase();
  if (
    normalizedMetaLine.startsWith(`${normalizedMetaTitle} •`) ||
    normalizedMetaLine.startsWith(`${normalizedMetaTitle}·`)
  ) {
    return fileTitle ?? rawMetaTitle;
  }

  return rawMetaTitle;
}

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
  const restoreGenerationConfig = useGenerationConfigStore((s) => s.restoreFromStorage);
  const setDetectedKey = useGenerationConfigStore((s) => s.setDetectedKey);

  // Client-side PDF rasterization — always renders a visible first page, even
  // when the server OMR pipeline is degraded (Vercel without pdfalto/oemer).
  const pdfPreview = useClientPdfPreview(file);
  const pdfPreviewCaption = pdfPreview.isRendering
    ? "Rendering PDF…"
    : pdfPreview.pages.length > 1
      ? `Page 1 of ${pdfPreview.pages.length}`
      : pdfPreview.pages.length === 1
        ? "Page 1"
        : undefined;

  React.useEffect(() => {
    restoreFromStorage();
    restoreGenerationConfig();
  }, [restoreFromStorage, restoreGenerationConfig]);

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

    const detectTonicFromXml = (xml: string): { tonic: string | null; mode: "major" | "minor" | null } => {
      try {
        if (typeof window === "undefined") return { tonic: null, mode: null };
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        if (doc.querySelector("parsererror")) return { tonic: null, mode: null };
        const keyEl = doc.querySelector("key");
        if (!keyEl) return { tonic: null, mode: null };
        const fifthsRaw = keyEl.querySelector("fifths")?.textContent ?? "";
        const modeRaw = keyEl.querySelector("mode")?.textContent?.trim().toLowerCase() ?? "";
        const fifths = parseInt(fifthsRaw, 10);
        if (!Number.isFinite(fifths)) return { tonic: null, mode: null };
        const majors = ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F"];
        const minors = ["A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F", "C", "G", "D"];
        const idx = ((fifths % 12) + 12) % 12;
        const mode: "major" | "minor" = modeRaw === "minor" ? "minor" : "major";
        const tonic = mode === "minor" ? minors[idx] ?? null : majors[idx] ?? null;
        return { tonic, mode };
      } catch {
        return { tonic: null, mode: null };
      }
    };

    const applyXml = (xml: string) => {
      const meta = extractMusicXMLMetadata(xml);
      setPreviewMeta(meta);
      setPreviewScore(parseMusicXML(xml));
      const detected = detectTonicFromXml(xml);
      setDetectedKey(detected.tonic, detected.mode);
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
  }, [file, storePreviewXml, setPreviewMusicXML, setDetectedKey]);

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
      const normalizedSource =
        storePreviewXml && storePreviewXml.trim().length > 0
          ? new File(
              [storePreviewXml],
              `${file.name.replace(/\.[^/.]+$/, "") || "score"}.musicxml`,
              { type: "application/xml" },
            )
          : file;
      formData.append("file", normalizedSource);
      // Attach browser-rasterized PDF pages (when any) so servers without
      // `pdftoppm` can still run oemer directly — and multi-page PDFs get a
      // continuous melody via mergeParsedScores on the engine.
      if (
        pdfPreview.pages.length > 0 &&
        (!storePreviewXml || storePreviewXml.trim().length === 0)
      ) {
        for (const page of pdfPreview.pages) {
          formData.append(
            "pages",
            new File([page.png], `page-${page.index}.png`, { type: "image/png" }),
          );
        }
      }
      formData.append(
        "config",
        JSON.stringify({
          mood: config.mood,
          genre: config.genre,
          rhythmDensity: config.rhythmDensity,
          instruments: config.instruments,
        })
      );
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(`/api/generate-from-file`, {
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
              deriveDisplayScoreTitle(file, previewMeta, previewScore) ??
              (coachmarkTourActive ? "Preview" : "The First Noel")
            }
            scoreMeta={
              previewMeta?.meta ??
              (coachmarkTourActive && !file
                ? "Upload a file in a real session to see your score here."
                : "Traditional • 4 voices • Page 1 of 4")
            }
            onReupload={() => router.push("/")}
            pdfPreviewUrl={pdfPreview.previewUrl}
            pdfPreviewCaption={pdfPreviewCaption}
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
