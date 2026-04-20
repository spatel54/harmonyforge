"use client";

import React from "react";
import { Play, Pause, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { RiffScoreEditor } from "@/components/score/RiffScoreEditor";
import type { EditableScore } from "@/lib/music/scoreTypes";
import type { MusicEditorAPI } from "riffscore";
import { getPlaybackDestinationDb } from "@/hooks/usePlayback";

function getRiffRegistry():
  | { get: (id: string) => MusicEditorAPI | undefined }
  | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { riffScore?: { get: (id: string) => MusicEditorAPI | undefined } })
    .riffScore;
}

export interface ScorePreviewPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Parsed score for rendering */
  score?: EditableScore | null;
  scoreTitle?: string;
  scoreMeta?: string;
  onReupload?: () => void;
  /** Object URL for page 1 of an uploaded PDF (client-side rasterization). Shown when `score` is null. */
  pdfPreviewUrl?: string | null;
  /** Copy shown on top of the PDF preview (e.g. "Page 1 of 4"). */
  pdfPreviewCaption?: string;
}

function buildPreviewTags(score: EditableScore): string[] {
  const tags: string[] = [];
  const n = score.parts.length;
  tags.push(n === 1 ? "1 part" : `${n} parts`);
  const m0 = score.parts[0]?.measures[0];
  if (m0?.timeSignature) tags.push(m0.timeSignature);
  if (m0?.keySignature !== undefined && Number.isFinite(m0.keySignature)) {
    const k = m0.keySignature;
    tags.push(k === 0 ? "Key: C" : `Key ${k > 0 ? "+" : ""}${k}`);
  }
  return tags.slice(0, 5);
}

/**
 * ScorePreviewPanel — Document step: read-only preview (no editing toolbar) plus optional audio.
 */
export const ScorePreviewPanel = React.forwardRef<HTMLDivElement, ScorePreviewPanelProps>(
  (
    {
      score,
      scoreTitle = "The First Noel",
      scoreMeta = "Traditional • 4 voices • Page 1 of 4",
      onReupload,
      pdfPreviewUrl,
      pdfPreviewCaption,
      className,
      ...props
    },
    ref,
  ) => {
    const [editorApi, setEditorApi] = React.useState<MusicEditorAPI | null>(null);
    const [riffInstanceId, setRiffInstanceId] = React.useState<string | null>(null);
    const [playing, setPlaying] = React.useState(false);
    const editorApiRef = React.useRef<MusicEditorAPI | null>(null);

    const handleApiReady = React.useCallback((api: MusicEditorAPI) => {
      setEditorApi(api);
    }, []);

    React.useEffect(() => {
      editorApiRef.current = editorApi;
    }, [editorApi]);

    React.useEffect(() => {
      setEditorApi(null);
      setPlaying(false);
      if (!score) setRiffInstanceId(null);
    }, [score]);

    React.useEffect(() => {
      if (!editorApi) return;
      const unsub = editorApi.on("operation", (r: { method?: string }) => {
        if (r.method === "play") setPlaying(true);
        if (r.method === "pause" || r.method === "stop") setPlaying(false);
      });
      return unsub;
    }, [editorApi]);

    const measureCount = score?.parts[0]?.measures.length ?? 0;

    const resolveRiffApi = React.useCallback((): MusicEditorAPI | null => {
      const fromState = editorApiRef.current;
      if (fromState) return fromState;
      const id = riffInstanceId;
      if (!id) return null;
      return getRiffRegistry()?.get(id) ?? null;
    }, [riffInstanceId]);

    const togglePlayback = React.useCallback(async () => {
      if (measureCount <= 0) return;
      let api = resolveRiffApi();
      if (!api && riffInstanceId) {
        for (let i = 0; i < 40; i++) {
          api = getRiffRegistry()?.get(riffInstanceId) ?? null;
          if (api) break;
          await new Promise((r) => setTimeout(r, 50));
        }
      }
      if (!api) return;
      try {
        if (playing) {
          api.pause();
          setPlaying(false);
        } else {
          const Tone = await import("tone");
          await Tone.start();
          Tone.getDestination().volume.rampTo(getPlaybackDestinationDb(), 0.05);
          await api.play();
          setPlaying(true);
        }
      } catch {
        setPlaying(false);
      }
    }, [measureCount, playing, resolveRiffApi, riffInstanceId]);

    const canUseTransport = Boolean(riffInstanceId) && measureCount > 0;

    const previewTags = score ? buildPreviewTags(score) : [];

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-[20px] w-[897px] shrink-0 h-full",
          "px-[24px] pt-[24px] pb-[20px]",
          className,
        )}
        style={{
          backgroundColor: "var(--hf-bg)",
          borderRight: "1px solid var(--hf-detail)",
        }}
        {...props}
      >
        <div className="flex flex-col gap-[4px] w-full">
          <h2
            className="font-brand text-[22px] font-normal leading-none text-center"
            style={{ color: "var(--hf-text-primary)" }}
          >
            {scoreTitle}
          </h2>

          <p
            className="font-mono text-[11px] font-normal leading-snug text-center px-2"
            style={{ color: "var(--hf-text-secondary)" }}
          >
            {scoreMeta}
          </p>

          {previewTags.length > 0 ? (
            <div
              className="flex flex-wrap items-center justify-center gap-[6px] mt-[8px]"
              role="list"
              aria-label="Score metadata"
            >
              {previewTags.map((tag) => (
                <span
                  key={tag}
                  role="listitem"
                  className="font-mono text-[10px] font-normal leading-none rounded-full px-[10px] py-[4px] border max-w-full truncate"
                  style={{
                    color: "var(--hf-text-primary)",
                    backgroundColor: "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
                    borderColor: "var(--hf-detail)",
                  }}
                  title={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {onReupload ? (
            <div className="flex justify-end w-full mt-2">
              <button
                type="button"
                onClick={onReupload}
                className={cn(
                  "flex items-center gap-[8px]",
                  "rounded-[6px] px-[12px] py-[6px]",
                  "border border-[var(--hf-detail)]",
                  "font-mono text-[11px] font-normal leading-none",
                  "transition-opacity duration-150 hover:opacity-80",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]",
                )}
                style={{
                  color: "var(--hf-text-primary)",
                  backgroundColor: "color-mix(in srgb, var(--hf-surface) 10%, transparent)",
                }}
                aria-label="Re-upload score"
              >
                <Upload className="w-[13px] h-[13px] shrink-0" aria-hidden="true" />
                Re-upload
              </button>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "flex-1 min-h-[280px] w-full rounded-[8px] overflow-hidden relative isolate",
            "border border-[var(--hf-detail)] score-canvas-container",
          )}
          aria-label="Score preview — read only"
          role="img"
        >
          {score ? (
            <>
              {/* z-0 keeps the editor under the transport overlay so the canvas cannot steal hits from the play button. */}
              <RiffScoreEditor
                score={score}
                className="relative z-0 w-full h-full min-h-[280px]"
                presentation
                onEditorApiReady={handleApiReady}
                onRiffInstanceId={setRiffInstanceId}
              />
              {measureCount > 0 ? (
                <div className="pointer-events-none absolute inset-0 z-[100] flex items-start justify-end p-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void togglePlayback();
                    }}
                    disabled={!canUseTransport}
                    title={
                      !canUseTransport
                        ? "Loading…"
                        : resolveRiffApi()
                          ? playing
                            ? "Pause"
                            : "Play"
                          : "Loading…"
                    }
                    className={cn(
                      "pointer-events-auto inline-flex items-center justify-center rounded-full w-11 h-11 shrink-0 transition-opacity shadow-md",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      "hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]",
                    )}
                    style={{
                      backgroundColor: "var(--hf-text-primary)",
                      color: "var(--hf-bg)",
                    }}
                    aria-label={playing ? "Pause score preview" : "Play score preview"}
                  >
                    {playing ? (
                      <Pause className="w-[20px] h-[20px]" fill="currentColor" aria-hidden />
                    ) : (
                      <Play className="w-[20px] h-[20px] ml-0.5" fill="currentColor" aria-hidden />
                    )}
                  </button>
                </div>
              ) : null}
            </>
          ) : pdfPreviewUrl ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pdfPreviewUrl}
                alt="PDF page preview"
                className="max-w-full max-h-full object-contain"
              />
              {pdfPreviewCaption ? (
                <div
                  className="absolute bottom-2 left-2 right-2 text-center font-mono text-[11px] leading-none rounded px-2 py-1"
                  style={{
                    color: "var(--hf-text-secondary)",
                    backgroundColor: "color-mix(in srgb, var(--hf-bg) 80%, transparent)",
                  }}
                >
                  {pdfPreviewCaption}
                </div>
              ) : null}
            </div>
          ) : (
            <StaffLinePlaceholder />
          )}
        </div>
      </div>
    );
  },
);

ScorePreviewPanel.displayName = "ScorePreviewPanel";

function StaffLinePlaceholder() {
  const staffColor = "var(--hf-staff-line)";
  const systemOffsets = [120, 220, 320];

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {systemOffsets.map((baseY) =>
        [0, 10, 20, 30, 40].map((dy, i) => (
          <line
            key={`${baseY}-${i}`}
            x1="0"
            y1={baseY + dy}
            x2="800"
            y2={baseY + dy}
            stroke={staffColor}
            strokeWidth={1}
          />
        )),
      )}

      {systemOffsets.map((baseY) =>
        [60, 170, 280, 390, 500, 610, 720].map((x) => (
          <line
            key={`bar-${baseY}-${x}`}
            x1={x}
            y1={baseY}
            x2={x}
            y2={baseY + 40}
            stroke={staffColor}
            strokeWidth={1}
          />
        )),
      )}

      <text
        x="80"
        y="108"
        fill={staffColor}
        fontFamily="IBM Plex Mono, monospace"
        fontSize="11"
        fontWeight="normal"
        opacity="0.6"
      >
        Upload a score to preview
      </text>
    </svg>
  );
}
