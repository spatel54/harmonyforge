"use client";

import { useCallback, useRef } from "react";
import type { MusicEditorAPI, Score as RsScore } from "riffscore";
import type { EditableScore } from "@/lib/music/scoreTypes";
import { useScoreStore } from "@/store/useScoreStore";
import {
  editableScoreToRsScore,
  riffScoreToEditableScore,
  buildIdMap,
  type IdMap,
} from "@/lib/music/riffscoreAdapter";

interface UseRiffScoreSyncReturn {
  /** Push current Zustand score to RiffScore. Call after load or Zustand-driven mutations. */
  pushToRiffScore: () => void;
  /** Pull editor state into Zustand via `replaceScoreFromEditor` (no HF history growth). */
  pullFromRiffScore: () => void;
  /** Same as pullFromRiffScore — call before inspector, export, or navigation. */
  flushToZustand: () => void;
  /** Current HF->RS ID map */
  hfToRs: IdMap;
  /** Current RS->HF ID map */
  rsToHf: IdMap;
}

/**
 * Bidirectional state sync between useScoreStore (Zustand) and RiffScore.
 *
 * Uses a syncDirection flag to prevent infinite update loops:
 * - When we push to RiffScore, we set flag to ignore the resulting 'score' event
 * - Lazy sync: no automatic pull on `score` events — call `flushToZustand` when the app needs Zustand.
 */
export function useRiffScoreSync(
  apiRef: React.RefObject<MusicEditorAPI | null>,
  score: EditableScore | null,
): UseRiffScoreSyncReturn {
  const isPushingRef = useRef(false);
  const hfToRsRef = useRef<IdMap>(new Map());
  const rsToHfRef = useRef<IdMap>(new Map());

  const pushToRiffScore = useCallback(() => {
    const api = apiRef.current;
    if (!api || !score) return;

    isPushingRef.current = true;
    try {
      const rsScore = editableScoreToRsScore(score);
      api.loadScore(rsScore);

      // Rebuild ID map after load
      const loaded = api.getScore();
      const maps = buildIdMap(score, loaded);
      hfToRsRef.current = maps.hfToRs;
      rsToHfRef.current = maps.rsToHf;
    } finally {
      // Delay clearing the flag so the resulting 'score' event is skipped
      requestAnimationFrame(() => {
        isPushingRef.current = false;
      });
    }
  }, [apiRef, score]);

  const pullFromRiffScore = useCallback(() => {
    const api = apiRef.current;
    if (!api || isPushingRef.current) return;

    const rsScore: RsScore = api.getScore();
    const currentScore = useScoreStore.getState().score;
    const hfScore = riffScoreToEditableScore(
      rsScore,
      rsToHfRef.current,
      currentScore?.parts,
      currentScore,
    );

    useScoreStore.getState().replaceScoreFromEditor(hfScore);

    const maps = buildIdMap(hfScore, rsScore);
    hfToRsRef.current = maps.hfToRs;
    rsToHfRef.current = maps.rsToHf;
  }, [apiRef]);

  return {
    pushToRiffScore,
    pullFromRiffScore,
    flushToZustand: pullFromRiffScore,
    hfToRs: hfToRsRef.current,
    rsToHf: rsToHfRef.current,
  };
}
