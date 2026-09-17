"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Pause, Play } from "lucide-react";
import type { MusicEditorAPI } from "riffscore";
import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  absQuantToMeasureQuant,
  advancePlaybackTick,
  fractionToMeasureQuant,
  measureQuantToAbsQuant,
  measureQuantToFraction,
  quantToBeatLabel,
  riffQuantsForMeasure,
} from "@/lib/music/playbackScrub";
import {
  getLivePlaybackBpm,
  getPlaybackScheduleGeneration,
} from "@/lib/music/playbackExpressionBridge";
import { isHfPlaybackTickActive } from "@/lib/music/playbackPositionBridge";
import {
  clearHfPlaybackPosition,
  getHfPlaybackPositionTick,
  HF_PLAYBACK_PARK_EVENT,
  parkPlaybackStart,
  pauseRiffScoreTransport,
} from "@/lib/music/riffscorePlaybackBridge";

function nativePlayButton(root: HTMLElement | null | undefined): HTMLButtonElement | null {
  return (root ?? (typeof document === "undefined" ? null : document.body))?.querySelector(
    ".riff-PlaybackControls__play-button",
  ) ?? null;
}

function isNativeRiffScorePlaying(root: HTMLElement | null | undefined): boolean {
  const btn = nativePlayButton(root);
  const label = `${btn?.getAttribute("aria-label") ?? ""} ${btn?.getAttribute("title") ?? ""}`;
  return /pause/i.test(label);
}

const RIFFSCORE_CLEAR_PLAYBACK_ANCHOR = "riffscore-clear-playback-anchor";

function clearRiffScoreInternalPlaybackAnchor() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RIFFSCORE_CLEAR_PLAYBACK_ANCHOR));
}

export interface PlaybackTimelinePlayControl {
  playing: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export interface PlaybackTimelineRailProps {
  apiRef: RefObject<MusicEditorAPI | null>;
  rootRef?: RefObject<HTMLElement | null>;
  score: EditableScore;
  measureCount: number;
  isReady: boolean;
  /** Extra right inset so an overlay Play control does not cover the thumb. */
  endInsetClassName?: string;
  /** Document preview: Play lives on the rail because the native toolbar button is hidden. */
  playControl?: PlaybackTimelinePlayControl;
}

/**
 * Transport timeline in the editor chrome. Dragging parks Play-from;
 * it never starts audio. Toolbar Play / Space / P consume the parked quant.
 */
export function PlaybackTimelineRail({
  apiRef,
  rootRef,
  score,
  measureCount,
  isReady,
  endInsetClassName = "pr-3",
  playControl,
}: PlaybackTimelineRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const playingRef = useRef(false);
  const parkedUntilPlayRef = useRef(false);
  const seenScheduleGenRef = useRef(getPlaybackScheduleGeneration());
  const rafRef = useRef<number | null>(null);
  const measureRef = useRef(0);
  const quantRef = useRef(0);
  const [measureIndex, setMeasureIndex] = useState(0);
  const [quant, setQuant] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const applyPark = useCallback(
    (nextMeasure: number, nextQuant: number, pauseAudio: boolean) => {
      const n = score.parts[0]?.measures.length ?? 0;
      if (n <= 0) return;
      const m = Math.max(0, Math.min(nextMeasure, n - 1));
      const maxQ = riffQuantsForMeasure(score, m);
      const q = Math.max(0, Math.min(nextQuant, Math.max(0, maxQ - 1)));
      measureRef.current = m;
      quantRef.current = q;
      setMeasureIndex(m);
      setQuant(q);
      parkedUntilPlayRef.current = true;
      playingRef.current = false;
      setIsPlaying(false);
      clearHfPlaybackPosition();
      parkPlaybackStart(m, q);
      if (pauseAudio) pauseRiffScoreTransport();
      clearRiffScoreInternalPlaybackAnchor();
    },
    [score],
  );

  const parkFromClientX = useCallback(
    (clientX: number, pauseAudio: boolean) => {
      const rail = railRef.current;
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      const t = rect.width <= 0 ? 0 : (clientX - rect.left) / rect.width;
      const next = fractionToMeasureQuant(score, Math.min(1, Math.max(0, t)));
      applyPark(next.measureIndex, next.quant, pauseAudio);
    },
    [applyPark, score],
  );

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !isReady) return;
    const unsub = api.on("operation", (r: { method?: string; ok?: boolean }) => {
      if (r.ok === false) return;
      if (r.method === "play") {
        parkedUntilPlayRef.current = false;
        playingRef.current = true;
        setIsPlaying(true);
      }
      if (r.method === "pause" || r.method === "stop") {
        playingRef.current = false;
        setIsPlaying(false);
        if (r.method === "stop") {
          measureRef.current = 0;
          quantRef.current = 0;
          setMeasureIndex(0);
          setQuant(0);
        }
        clearHfPlaybackPosition();
      }
    });
    return unsub;
  }, [apiRef, isReady]);

  useEffect(() => {
    if (!isReady) return;
    const onPark = (e: Event) => {
      const detail = (e as CustomEvent<{ measureIndex?: number; quant?: number }>).detail;
      if (!detail || draggingRef.current) return;
      if (playingRef.current && !parkedUntilPlayRef.current) return;
      const m = typeof detail.measureIndex === "number" ? detail.measureIndex : 0;
      const q = typeof detail.quant === "number" ? detail.quant : 0;
      if (m === measureRef.current && q === quantRef.current) return;
      measureRef.current = m;
      quantRef.current = q;
      setMeasureIndex(m);
      setQuant(q);
    };
    window.addEventListener(HF_PLAYBACK_PARK_EVENT, onPark);
    return () => window.removeEventListener(HF_PLAYBACK_PARK_EVENT, onPark);
  }, [isReady]);

  useEffect(() => {
    if (!isReady || measureCount <= 0) return;
    const tick = () => {
      const scheduleGen = getPlaybackScheduleGeneration();
      if (scheduleGen > seenScheduleGenRef.current) {
        seenScheduleGenRef.current = scheduleGen;
        parkedUntilPlayRef.current = false;
        playingRef.current = true;
        setIsPlaying(true);
      }
      const nativePlaying = isNativeRiffScorePlaying(rootRef?.current);
      if (nativePlaying) {
        parkedUntilPlayRef.current = false;
        if (!playingRef.current) {
          playingRef.current = true;
          setIsPlaying(true);
        }
      } else if (!draggingRef.current && !isHfPlaybackTickActive()) {
        if (playingRef.current) {
          playingRef.current = false;
          setIsPlaying(false);
          const n = score.parts[0]?.measures.length ?? 0;
          if (n > 0) {
            const last = n - 1;
            const maxQ = riffQuantsForMeasure(score, last);
            const nearEnd =
              measureRef.current >= last && quantRef.current >= Math.max(0, maxQ - 8);
            if (nearEnd) {
              measureRef.current = 0;
              quantRef.current = 0;
              setMeasureIndex(0);
              setQuant(0);
              parkPlaybackStart(0, 0);
            }
          }
        }
      }
      if (!draggingRef.current && playingRef.current && !parkedUntilPlayRef.current) {
        const hfTick = getHfPlaybackPositionTick();
        if (hfTick) {
          const elapsed =
            (typeof performance !== "undefined" ? performance.now() : Date.now()) -
            hfTick.at;
          const liveBpm = getLivePlaybackBpm(hfTick.measureIndex, hfTick.quant);
          const next = advancePlaybackTick(
            score,
            hfTick.measureIndex,
            hfTick.quant,
            hfTick.durationSec,
            elapsed / 1000,
            liveBpm,
          );
          if (next.measureIndex !== measureRef.current || next.quant !== quantRef.current) {
            measureRef.current = next.measureIndex;
            quantRef.current = next.quant;
            setMeasureIndex(next.measureIndex);
            setQuant(next.quant);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isReady, measureCount, score, rootRef]);

  useEffect(() => {
    if (!isReady) return;
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      parkFromClientX(e.clientX, false);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [isReady, parkFromClientX]);

  const startOrTogglePlay = useCallback(() => {
    if (!playingRef.current && !isNativeRiffScorePlaying(rootRef?.current)) {
      const n = score.parts[0]?.measures.length ?? 0;
      if (n > 0) {
        const last = n - 1;
        const maxQ = riffQuantsForMeasure(score, last);
        if (measureRef.current >= last && quantRef.current >= Math.max(0, maxQ - 8)) {
          applyPark(0, 0, false);
        }
      }
    }
    if (playControl && !playControl.disabled) playControl.onToggle();
    else nativePlayButton(rootRef?.current)?.click();
  }, [applyPark, playControl, rootRef, score]);

  const fraction = measureQuantToFraction(score, measureIndex, quant);
  const label = quantToBeatLabel(quant, score, measureIndex);
  const ticks = useMemo(() => {
    if (measureCount <= 0) return [];
    const step = measureCount > 48 ? 4 : measureCount > 24 ? 2 : 1;
    const out: number[] = [];
    for (let i = 0; i < measureCount; i += step) out.push(i);
    if (out[out.length - 1] !== measureCount - 1) out.push(measureCount - 1);
    return out;
  }, [measureCount]);

  if (!isReady || measureCount <= 0) return null;

  return (
    <div
      className={`hf-playback-timeline flex items-center gap-3 shrink-0 pl-3 py-1.5 ${endInsetClassName}`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--hf-bg) 92%, transparent)",
        borderBottom: "1px solid var(--hf-detail)",
      }}
    >
      {playControl ? (
        <button
          type="button"
          data-testid="score-preview-play"
          aria-label={playControl.playing ? "Pause score preview" : "Play score preview"}
          title={playControl.playing ? "Pause" : "Play"}
          disabled={playControl.disabled}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (!playControl.disabled) startOrTogglePlay();
          }}
          className="inline-flex items-center justify-center rounded-full w-8 h-8 shrink-0 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hf-accent)]"
          style={{
            backgroundColor: "var(--hf-text-primary)",
            color: "var(--hf-bg)",
          }}
        >
          {playControl.playing ? (
            <Pause className="w-3.5 h-3.5" fill="currentColor" aria-hidden />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" aria-hidden />
          )}
        </button>
      ) : null}
      <span
        className="font-mono text-[11px] leading-none whitespace-nowrap tabular-nums"
        style={{ color: "var(--hf-text-secondary)", minWidth: "7.5rem" }}
        aria-live="polite"
      >
        {label}
      </span>
      <div
        ref={railRef}
        role="slider"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, measureCount - 1)}
        aria-valuenow={measureIndex}
        aria-valuetext={label}
        aria-label="Playback position — drag to set where Play starts"
        data-testid="playback-timeline"
        className="relative flex-1 h-7 cursor-ew-resize touch-none"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          draggingRef.current = true;
          setIsDragging(true);
          parkFromClientX(e.clientX, true);
          rootRef?.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.code === "Space" || e.key === "p" || e.key === "P") {
            e.preventDefault();
            startOrTogglePlay();
            return;
          }
          if (
            e.key !== "ArrowLeft" &&
            e.key !== "ArrowRight" &&
            e.key !== "Home" &&
            e.key !== "End"
          ) {
            return;
          }
          e.preventDefault();
          const n = score.parts[0]?.measures.length ?? 0;
          if (n <= 0) return;
          if (e.key === "Home") {
            applyPark(0, 0, true);
            return;
          }
          if (e.key === "End") {
            const last = n - 1;
            applyPark(last, Math.max(0, riffQuantsForMeasure(score, last) - 1), true);
            return;
          }
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const abs = measureQuantToAbsQuant(score, measureIndex, quant) + dir * 16;
          const next = absQuantToMeasureQuant(score, Math.max(0, abs));
          applyPark(next.measureIndex, next.quant, true);
        }}
      >
        <div
          className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, var(--hf-detail) 80%, transparent)" }}
        />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            left: 0,
            width: `${fraction * 100}%`,
            backgroundColor: "var(--hf-accent, #ffb300)",
          }}
        />
        {ticks.map((m) => (
          <div
            key={m}
            className="absolute top-1/2 w-px h-2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${measureQuantToFraction(score, m, 0) * 100}%`,
              backgroundColor: "color-mix(in srgb, var(--hf-text-secondary) 45%, transparent)",
            }}
          />
        ))}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          data-dragging={isDragging ? "true" : "false"}
          data-playing={isPlaying ? "true" : "false"}
          style={{
            left: `${fraction * 100}%`,
            backgroundColor: "var(--hf-accent, #ffb300)",
            boxShadow: "0 0 0 2px var(--hf-bg), 0 1px 4px rgba(0,0,0,0.25)",
          }}
        />
      </div>
    </div>
  );
}
