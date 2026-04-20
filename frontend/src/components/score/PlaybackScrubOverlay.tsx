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
import type { MusicEditorAPI } from "riffscore";
import type { EditableScore, NotePosition } from "@/lib/music/scoreTypes";
import {
  buildMeasurePlaybackSpans,
  clampContentX,
  contentXToNearestMeasureStart,
} from "@/lib/music/playbackScrub";
import { setPendingRiffScorePlayFrom } from "@/lib/music/riffscorePlaybackBridge";

/** Patched RiffScore (`patch-package`) listens for this so toolbar Play uses `MusicEditorAPI` scrub position. */
const RIFFSCORE_CLEAR_PLAYBACK_ANCHOR = "riffscore-clear-playback-anchor";

function clearRiffScoreInternalPlaybackAnchor() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RIFFSCORE_CLEAR_PLAYBACK_ANCHOR));
}

export interface PlaybackScrubOverlayProps {
  containerRef: RefObject<HTMLDivElement | null>;
  apiRef: RefObject<MusicEditorAPI | null>;
  score: EditableScore;
  notePositions: NotePosition[];
  measureCount: number;
  isReady: boolean;
  /** Top offset (px) below RiffScore toolbar / inspector chrome */
  contentTopPx?: number;
}

/**
 * Draggable vertical playhead over the score. Seeks via RiffScore API play(measure, quant).
 * Hides the built-in SVG cursor (CSS in parent); position syncs from it while audio plays.
 */
export function PlaybackScrubOverlay({
  containerRef,
  apiRef,
  score,
  notePositions,
  measureCount,
  isReady,
  contentTopPx = 52,
}: PlaybackScrubOverlayProps) {
  const draggingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const playingRef = useRef(false);
  /** Previous frame’s SVG cursor X (content coords) — motion here means real playback even if `operation` events were missed. */
  const prevDomCursorXRef = useRef<number | null>(null);
  /** While true, rAF must not copy the SVG cursor — it stays stale after seek-until-play. */
  const suppressDomSyncRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const contentXRef = useRef(0);
  /** After first placement, span changes reclamp this value (including legitimate x === 0). */
  const linePlacedRef = useRef(false);
  const [scrollW, setScrollW] = useState(800);
  /** Horizontal position in score content coordinates — state so `left` survives re-renders (refs can be null on early calls). */
  const [lineLeftPx, setLineLeftPx] = useState(0);
  /** Measure index for aria-valuenow after scrub. */
  const [ariaMeasureIndex, setAriaMeasureIndex] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !isReady) return;
    const update = () => setScrollW(Math.max(el.scrollWidth, 200));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, isReady, notePositions, measureCount]);

  const spans = useMemo(
    () => buildMeasurePlaybackSpans(notePositions, measureCount, scrollW),
    [notePositions, measureCount, scrollW],
  );

  const applyLineX = useCallback((contentX: number) => {
    const v = clampContentX(contentX, spans);
    contentXRef.current = v;
    linePlacedRef.current = true;
    setLineLeftPx(v);
  }, [spans]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !isReady) return;

    const unsub = api.on(
      "operation",
      (r: { method?: string; ok?: boolean }) => {
        if (r.ok === false) return;
        if (r.method === "play") playingRef.current = true;
        if (r.method === "pause" || r.method === "stop") {
          playingRef.current = false;
        }
        if (r.method === "rewind") {
          const wasPlaying = Boolean(
            (r as { details?: { wasPlaying?: boolean } }).details?.wasPlaying,
          );
          if (wasPlaying) playingRef.current = true;
        }
      },
    );

    return unsub;
  }, [apiRef, isReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isReady || spans.length === 0) return;

    const tick = () => {
      if (!draggingRef.current) {
        // Prefer the score SVG’s playhead — same element RiffScore animates during audio.
        const g =
          container.querySelector<SVGElement>(
            "svg.riff-ScoreCanvas__svg [data-testid=\"playback-cursor\"]",
          ) ?? container.querySelector("[data-testid=\"playback-cursor\"]");
        if (g) {
          const gRect = g.getBoundingClientRect();
          const cRect = container.getBoundingClientRect();
          // Viewport rects already reflect inner scroll; only add wrapper scrollLeft.
          const cx =
            gRect.left - cRect.left + container.scrollLeft + gRect.width / 2;

          if (!suppressDomSyncRef.current) {
            // Always mirror the SVG playhead. Programmatic `api.play()` may not emit
            // `operation: play`, and the old gate missed slow/sub-pixel motion.
            applyLineX(cx);
          }
          prevDomCursorXRef.current = cx;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, isReady, spans, applyLineX]);

  useLayoutEffect(() => {
    if (draggingRef.current || spans.length === 0) return;
    if (!linePlacedRef.current) {
      applyLineX(spans[0]!.startX);
      return;
    }
    applyLineX(clampContentX(contentXRef.current, spans));
  }, [spans, applyLineX]);

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
        await api.play(measureIndex, quant);
        if (!resume) api.pause();
      } catch {
        /* RiffScore / Tone may throw if not ready */
      } finally {
        suppressDomSyncRef.current = false;
        applyLineX(targetContentX);
        clearRiffScoreInternalPlaybackAnchor();
      }
    },
    [apiRef, applyLineX],
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
    prevDomCursorXRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);

    if (wasPlayingRef.current) api?.pause();

    const cx = clampContentX(clientToContentX(e.clientX), spans);
    applyLineX(cx);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const cx = clampContentX(clientToContentX(e.clientX), spans);
    applyLineX(cx);
  };

  const finishPointer = async (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    prevDomCursorXRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }

    if (spans.length === 0) return;

    const cx = clampContentX(clientToContentX(e.clientX), spans);
    const { measureIndex, snapContentX } = contentXToNearestMeasureStart(
      cx,
      spans,
      score,
    );
    setAriaMeasureIndex(measureIndex);
    setPendingRiffScorePlayFrom(measureIndex, 0);
    applyLineX(snapContentX);
    await seekTo(measureIndex, 0, wasPlayingRef.current, snapContentX);
  };

  if (!isReady || measureCount <= 0) return null;

  return (
    <div
      className="absolute z-[30] pointer-events-none overflow-visible"
      style={{ left: lineLeftPx, top: contentTopPx, bottom: 8, width: 0 }}
    >
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, measureCount - 1)}
        aria-valuenow={Math.min(
          Math.max(0, measureCount - 1),
          ariaMeasureIndex,
        )}
        aria-label={`Playback scrub — release to snap to a bar and set where Play starts; ${measureCount} measures`}
        className="pointer-events-auto absolute left-0 top-0 bottom-0 w-7 -translate-x-1/2 cursor-grab active:cursor-grabbing touch-none flex flex-col items-center"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <div
          className="w-[3px] h-full min-h-[100px] rounded-full shrink-0"
          style={{
            backgroundColor: "var(--hf-accent, #ffb300)",
            boxShadow:
              "0 0 0 1px rgba(0,0,0,0.2), 0 0 10px color-mix(in srgb, var(--hf-accent, #ffb300) 45%, transparent)",
          }}
        />
      </div>
    </div>
  );
}
