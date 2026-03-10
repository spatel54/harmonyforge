"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DocumentHeader } from "@/components/organisms/DocumentHeader";
import { ScorePreviewPanel } from "@/components/organisms/ScorePreviewPanel";
import { EnsembleBuilderPanel } from "@/components/organisms/EnsembleBuilderPanel";
import { TransitionOverlay } from "@/components/organisms/TransitionOverlay";
import { useUploadStore } from "@/store/useUploadStore";
import type { GenerationConfig } from "@/components/organisms/EnsembleBuilderPanel";
import { parseMusicXML, extractMusicXMLMetadata } from "@/lib/music/musicxmlParser";
import type { EditableScore } from "@/lib/music/scoreTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Document Page — /document
 * Step 2: Score preview (left) + Ensemble Builder (right).
 * Parses uploaded MusicXML to show preview; on "Generate Harmonies" → POST file + config → store MusicXML → navigate to /sandbox.
 */
export default function DocumentPage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewScore, setPreviewScore] = React.useState<EditableScore | null>(null);
  const [previewMusicXML, setPreviewMusicXML] = React.useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = React.useState<{ title: string; meta: string } | null>(null);
  const file = useUploadStore((s) => s.file);
  const setGeneratedMusicXML = useUploadStore((s) => s.setGeneratedMusicXML);

  // Redirect to upload if no file (e.g. direct nav or refresh)
  React.useEffect(() => {
    if (!file) {
      router.replace("/");
    }
  }, [file, router]);

  React.useEffect(() => {
    if (!file) {
      setPreviewScore(null);
      setPreviewMusicXML(null);
      setPreviewMeta(null);
      return;
    }
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!["xml", "musicxml"].includes(ext)) {
      setPreviewScore(null);
      setPreviewMusicXML(null);
      setPreviewMeta({ title: file.name.replace(/\.[^/.]+$/, ""), meta: "Preview after Generate" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const xml = String(reader.result);
      const meta = extractMusicXMLMetadata(xml);
      setPreviewMusicXML(xml);
      setPreviewMeta(meta);
      // Also parse for fallback (VexFlow) — OSMD takes precedence when musicXML is set
      const score = parseMusicXML(xml);
      setPreviewScore(score);
    };
    reader.readAsText(file, "utf-8");
  }, [file]);

  // Don't render document UI while redirecting (no file)
  if (!file) {
    return null;
  }

  const handleGenerate = async (config: GenerationConfig) => {
    if (!file) {
      setError("No file uploaded. Please go back and upload a score.");
      return;
    }
    setIsTransitioning(true);
    setError(null);
    try {
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
      const res = await fetch(`${API_BASE}/api/generate-from-file`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Request failed: ${res.status}`);
      }
      const musicXML = await res.text();
      setGeneratedMusicXML(musicXML);
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
            musicXML={previewMusicXML}
            scoreTitle={previewMeta?.title ?? (file ? file.name.replace(/\.[^/.]+$/, "") : "The First Noel")}
            scoreMeta={previewMeta?.meta ?? "Traditional • 4 voices • Page 1 of 4"}
            onReupload={() => router.push("/")}
          />
          <EnsembleBuilderPanel
            onGenerateHarmonies={handleGenerate}
            isGenerating={isTransitioning}
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
      </div>

      {/* Loading overlay */}
      <TransitionOverlay variant="generating" visible={isTransitioning} />
    </>
  );
}
