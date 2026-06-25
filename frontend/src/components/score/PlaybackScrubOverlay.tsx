"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import type { MusicEditorAPI } from "riffscore";
import type { EditableScore, NotePosition } from "@/lib/music/scoreTypes";
import {
  buildMeasurePlaybackSpans,
  clampContentX,
  contentXForMeasureQuant,
  contentXForPlaybackTick,
  contentXToMeasureQuant,
  quantToBeatLabel,
  type MeasurePlaybackSpan,
} from "@/lib/music/playbackScrub";
import { hfLogPlayback } from "@/lib/music/playbackDebugLog";
import {
  clearHfPlaybackPosition,
  getHfPlaybackPositionTick,
  setPendingRiffScorePlayFrom,
} from "@/lib/music/riffscorePlaybackBridge";
import { showSandboxToast } from "@/lib/sandbox/sandboxToast";

/** Patched RiffScore (`patch-package`) listens for this so toolbar Play uses `MusicEditorAPI` scrub position. */
const RIFFSCORE_CLEAR_PLAYBACK_ANCHOR = "riffscore-clear-playback-anchor";

function clearRiffScoreInternalPlaybackAnchor() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RIFFSCORE_CLEAR_PLAYBACK_ANCHOR));
}

export interface PlaybackScrubOverlayProps {
  containerRef: RefObject<HTMLDivElement | null>;
  /** RiffScore `.riff-ScoreEditor__content` — scrub is portaled here so it stacks above the staff but never over the toolbar (a sibling above this node). */
  portalHost: HTMLElement | null;
  apiRef: RefObject<MusicEditorAPI | null>;
  score: EditableScore;
  notePositions: NotePosition[];
  measureCount: number;
  isReady: boolean;
}

/**
 * Draggable vertical playhead over the score. Seeks via RiffScore API play(measure, quant).
 * Hides the built-in SVG cursor (CSS in parent); position syncs from it while audio plays.
 */
export function PlaybackScrubOverlay({
  containerRef,
  portalHost,
  apiRef,
  score,
  notePositions,
  measureCount,
  isReady,
}: PlaybackScrubOverlayProps) {
  const draggingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const playingRef = useRef(false);
  /** While true, rAF must not copy the SVG cursor — it stays stale after seek-until-play. */
  const suppressDomSyncRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const contentXRef = useRef(0);
  /** After first placement, span changes reclamp this value (including legitimate x === 0). */
  const linePlacedRef = useRef(false);
  const [scrollW, setScrollW] = useState(800);
  /** Horizontal position in score content coordinates — state so `left` survives re-renders (refs can be null on early calls). */
  const [lineLeftPx, setLineLeftPx] = useState(0);
  const [scrubMeasureIndex, setScrubMeasureIndex] = useState(0);
  const [scrubQuant, setScrubQuant] = useState(0);
  const [dragLabel, setDragLabel] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  /** Maps wrapper-horizontal `lineLeftPx` to `left` inside `portalHost`: left_portal = lineLeftPx - portalXOffset. */
  const [portalXOffset, setPortalXOffset] = useState(0);

  useLayoutEffect(() => {
    const scrollEl = portalHost ?? containerRef.current;
    if (!scrollEl || !isReady) return;
    const update = () => setScrollW(Math.max(scrollEl.scrollWidth, 200));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [containerRef, portalHost, isReady, notePositions, measureCount]);

  useLayoutEffect(() => {
    const wrap = containerRef.current;
    const scroll = portalHost;
    if (!wrap || !scroll || !isReady) return;
    const update = () => {
      const wr = wrap.getBoundingClientRect();
      const cr = scroll.getBoundingClientRect();
      setPortalXOffset(cr.left - wr.left - scroll.scrollLeft);
    };
    update();
    scroll.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(scroll);
    return () => {
      scroll.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [containerRef, portalHost, isReady]);

  const spans = useMemo(
    () => buildMeasurePlaybackSpans(notePositions, measureCount, scrollW),
    [notePositions, measureCount, scrollW],
  );

  const activeMeasureSpan = useMemo((): MeasurePlaybackSpan | undefined => {
    return spans.find((s) => s.measureIndex === scrubMeasureIndex);
  }, [spans, scrubMeasureIndex]);

  const applyScrubPosition = useCallback(
    (contentX: number) => {
      const v = clampContentX(contentX, spans);
      contentXRef.current = v;
      linePlacedRef.current = true;
      setLineLeftPx(v);
      const { measureIndex, quant } = contentXToMeasureQuant(v, spans, score);
      setScrubMeasureIndex(measureIndex);
      setScrubQuant(quant);
      if (draggingRef.current) {
        setDragLabel(quantToBeatLabel(quant, score, measureIndex));
      }
    },
    [spans, score],
  );

  const scrollPlayheadIntoView = useCallback(
    (contentX: number) => {
      const scroll = portalHost ?? containerRef.current;
      if (!scroll) return;
      const rect = scroll.getBoundingClientRect();
      const lineInView = contentX - scroll.scrollLeft;
      const margin = 48;
      if (lineInView < margin) {
        scroll.scrollLeft = Math.max(0, contentX - margin);
      } else if (lineInView > rect.width - margin) {
        scroll.scrollLeft = contentX - rect.width + margin;
      }
    },
    [containerRef, portalHost],
  );

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !isReady) return;

    const unsub = api.on(
      "operation",
      (r: { method?: string; ok?: boolean }) => {
        if (r.ok === false) return;
        if (r.method === "play") {
          playingRef.current = true;
          setIsPlaying(true);
        }
        if (r.method === "pause" || r.method === "stop") {
          playingRef.current = false;
          setIsPlaying(false);
          clearHfPlaybackPosition();
        }
        if (r.method === "rewind") {
          const wasPlaying = Boolean(
            (r as { details?: { wasPlaying?: boolean } }).details?.wasPlaying,
          );
          if (wasPlaying) {
            playingRef.current = true;
            setIsPlaying(true);
          }
        }
      },
    );

    return unsub;
  }, [apiRef, isReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isReady || spans.length === 0) return;

    const tick = () => {
      if (!draggingRef.current && !suppressDomSyncRef.current) {
        const hfTick = playingRef.current
          ? getHfPlaybackPositionTick()
          : null;

        if (hfTick) {
          const elapsed =
            (typeof performance !== "undefined"
              ? performance.now()
              : Date.now()) - hfTick.at;
          const cx = contentXForPlaybackTick(
            score,
            spans,
            hfTick.measureIndex,
            hfTick.quant,
            hfTick.durationSec,
            elapsed / 1000,
          );
          applyScrubPosition(cx);
          if (scrollRafRef.current == null) {
            scrollRafRef.current = requestAnimationFrame(() => {
              scrollRafRef.current = null;
              scrollPlayheadIntoView(contentXRef.current);
            });
          }
        } else {
          const g =
            container.querySelector<SVGElement>(
              "svg.riff-ScoreCanvas__svg [data-testid=\"playback-cursor\"]",
            ) ?? container.querySelector("[data-testid=\"playback-cursor\"]");
          if (g) {
            const gRect = g.getBoundingClientRect();
            const cRect = container.getBoundingClientRect();
            const cx =
              gRect.left - cRect.left + container.scrollLeft + gRect.width / 2;
            applyScrubPosition(cx);
            if (playingRef.current) {
              if (scrollRafRef.current == null) {
                scrollRafRef.current = requestAnimationFrame(() => {
                  scrollRafRef.current = null;
                  scrollPlayheadIntoView(contentXRef.current);
                });
              }
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [containerRef, isReady, spans, score, applyScrubPosition, scrollPlayheadIntoView]);

  useLayoutEffect(() => {
    if (draggingRef.current || spans.length === 0) return;
    if (!linePlacedRef.current) {
      applyScrubPosition(spans[0]!.startX);
      return;
    }
    applyScrubPosition(clampContentX(contentXRef.current, spans));
  }, [spans, applyScrubPosition]);

  const seekTo = useCallback(
    async (
      measureIndex: number,
      quant: number,
      resume: boolean,
      targetContentX: number,
    ) => {
      const api = apiRef.current;
      if (!api) return;
      suppressDomSyncRef.current = true;
      try {
        hfLogPlayback({
          hypothesisId: "B",
          location: "PlaybackScrubOverlay.tsx:seekTo",
          message: "scrub seek play",
          data: { measureIndex, quant, resume },
        });
        await api.play(measureIndex, quant);
        if (!resume) api.pause();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Playback failed";
        hfLogPlayback({
          hypothesisId: "B",
          location: "PlaybackScrubOverlay.tsx:seekTo",
          message: "scrub seek failed",
          data: {
            measureIndex,
            quant,
            resume,
            error: msg,
          },
        });
        showSandboxToast(`Playback could not start: ${msg}`);
      } finally {
        suppressDomSyncRef.current = false;
        applyScrubPosition(targetContentX);
        clearRiffScoreInternalPlaybackAnchor();
      }
    },
    [apiRef, applyScrubPosition],
  );

  const clientToContentX = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return 0;
    return (
      clientX - container.getBoundingClientRect().left + container.scrollLeft
    );
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const api = apiRef.current;
    const container = containerRef.current;
    if (!container || spans.length === 0) return;

    wasPlayingRef.current = playingRef.current;
    draggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (wasPlayingRef.current) api?.pause();

    const cx = clampContentX(clientToContentX(e.clientX), spans);
    applyScrubPosition(cx);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const cx = clampContentX(clientToContentX(e.clientX), spans);
    applyScrubPosition(cx);
  };

  const finishPointer = async (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    setDragLabel(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    if (spans.length === 0) return;

    const cx = clampContentX(clientToContentX(e.clientX), spans);
    const { measureIndex, quant } = contentXToMeasureQuant(cx, spans, score);
    const snapContentX = contentXForMeasureQuant(
      measureIndex,
      quant,
      spans,
      score,
    );
    setPendingRiffScorePlayFrom(measureIndex, quant);
    applyScrubPosition(snapContentX);
    await seekTo(measureIndex, quant, wasPlayingRef.current, snapContentX);
  };

  if (!isReady || measureCount <= 0 || !portalHost) return null;

  const lineLeftInHost = lineLeftPx - portalXOffset;
  const ariaText = quantToBeatLabel(scrubQuant, score, scrubMeasureIndex);
  const measureBandLeft =
    activeMeasureSpan != null ? activeMeasureSpan.startX - portalXOffset : lineLeftInHost;
  const measureBandWidth =
    activeMeasureSpan != null
      ? Math.max(activeMeasureSpan.endX - activeMeasureSpan.startX, 1)
      : 0;

  const scrub = (
    <div
      className="pointer-events-none overflow-visible hf-playback-scrub-root"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 8,
        zIndex: 10,
      }}
    >
      {(isDragging || isPlaying) && activeMeasureSpan != null && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none hf-playback-measure-band"
          style={{
            left: measureBandLeft,
            width: measureBandWidth,
          }}
        />
      )}
      <div
        className="pointer-events-none overflow-visible"
        style={{
          position: "absolute",
          left: lineLeftInHost,
          top: 0,
          bottom: 0,
          width: 0,
        }}
      >
        <div
          role="slider"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, measureCount - 1)}
          aria-valuenow={Math.min(
            Math.max(0, measureCount - 1),
            scrubMeasureIndex,
          )}
          aria-valuetext={ariaText}
          aria-label={`Playback scrub — drag to set start position; ${measureCount} measures`}
          className="pointer-events-auto absolute left-0 top-0 bottom-0 w-8 -translate-x-1/2 cursor-grab active:cursor-grabbing touch-none flex flex-col items-center"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
        >
          <div
            className="hf-playback-scrub-cap shrink-0"
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "8px solid var(--hf-accent, #ffb300)",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
            }}
          />
          <div
            className="w-[3px] flex-1 min-h-[80px] rounded-full shrink-0"
            style={{
              backgroundColor: "var(--hf-accent, #ffb300)",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.2), 0 0 10px color-mix(in srgb, var(--hf-accent, #ffb300) 45%, transparent)",
            }}
          />
        </div>
        {dragLabel != null && (
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-full mb-1 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap pointer-events-none hf-playback-scrub-pill"
            style={{
              backgroundColor: "var(--hf-bg)",
              color: "var(--hf-text-primary)",
              border: "1px solid color-mix(in srgb, var(--hf-accent, #ffb300) 55%, transparent)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            {dragLabel}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(scrub, portalHost);
}
