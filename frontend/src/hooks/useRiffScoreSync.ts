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
import {
  noteSetPitchFingerprint,
  propagateMultiSelectPitchDelta,
} from "@/lib/music/scoreUtils";
import { mapRiffSelectedNotesToHFSelections } from "@/lib/music/riffscorePositions";
import { useToolStore } from "@/store/useToolStore";

interface UseRiffScoreSyncReturn {
  /** Push current Zustand score to RiffScore. Call after load or Zustand-driven mutations. */
  pushToRiffScore: () => void;
  /** Pull editor state into Zustand via `replaceScoreFromEditor` (no HF history growth). */
  pullFromRiffScore: () => void;
  /** Same as pullFromRiffScore — call before inspector, export, or navigation. */
  flushToZustand: () => void;
  /**
   * While dragging with a frozen baseline score, merge RiffScore’s live score and propagate
   * chromatic deltas to every note in `groupIds` so all selected notes move together.
   */
  syncMultiPitchFromBaseline: (baseline: EditableScore, groupIds: Set<string>) => void;
  /** Call on pointerdown when starting a multi-note pitch gesture (clears dedupe fingerprint). */
  resetMultiPitchDragSync: () => void;
  /** Current HF->RS ID map (may be stale on the React render that follows `pushToRiffScore`). */
  hfToRs: IdMap;
  /** Current RS->HF ID map (same caveat — prefer `getRsToHf` in effects and async callbacks). */
  rsToHf: IdMap;
  /** Always returns the latest RS->HF map after load/pull (refs do not trigger re-renders). */
  getRsToHf: () => IdMap;
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
  getPitchGroupNoteIds?: () => Set<string>,
): UseRiffScoreSyncReturn {
  const isPushingRef = useRef(false);
  const hfToRsRef = useRef<IdMap>(new Map());
  const rsToHfRef = useRef<IdMap>(new Map());
  const lastMultiPitchFpRef = useRef<string | null>(null);

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

  const getRsToHf = useCallback(() => rsToHfRef.current, []);

  const resetMultiPitchDragSync = useCallback(() => {
    lastMultiPitchFpRef.current = null;
  }, []);

  const resolvePropagationNoteIds = useCallback(
    (api: MusicEditorAPI, currentScore: EditableScore | null): Set<string> => {
      const fromPicker = getPitchGroupNoteIds
        ? getPitchGroupNoteIds()
        : new Set(useToolStore.getState().selection.map((s) => s.noteId));
      const fromStore = new Set(useToolStore.getState().selection.map((s) => s.noteId));

      let fromApi = new Set<string>();
      if (currentScore) {
        try {
          const sel = api.getSelection() as {
            selectedNotes?: Array<{
              staffIndex: number;
              measureIndex: number;
              eventId: string;
              noteId: string | null;
            }>;
          };
          const sn = sel.selectedNotes ?? [];
          if (sn.length > 0) {
            const mapped = mapRiffSelectedNotesToHFSelections(currentScore, sn, rsToHfRef.current);
            fromApi = new Set(mapped.map((m) => m.noteId));
          }
        } catch {
          /* ignore */
        }
      }

      if (fromApi.size >= 2) return fromApi;
      if (fromPicker.size >= 2) return fromPicker;
      if (fromStore.size >= 2) return fromStore;
      return new Set([...fromPicker, ...fromStore, ...fromApi]);
    },
    [getPitchGroupNoteIds],
  );

  const pullFromRiffScore = useCallback(() => {
    const api = apiRef.current;
    if (!api || isPushingRef.current) return;

    const rsScore: RsScore = api.getScore();
    const currentScore = useScoreStore.getState().score;
    const hfMerged = riffScoreToEditableScore(
      rsScore,
      rsToHfRef.current,
      currentScore?.parts,
      currentScore,
    );
    const selectedIds = resolvePropagationNoteIds(api, currentScore);
    const hfScore = propagateMultiSelectPitchDelta(currentScore, hfMerged, selectedIds);

    useScoreStore.getState().replaceScoreFromEditor(hfScore);

    const maps = buildIdMap(hfScore, rsScore);
    hfToRsRef.current = maps.hfToRs;
    rsToHfRef.current = maps.rsToHf;
  }, [apiRef, resolvePropagationNoteIds]);

  const syncMultiPitchFromBaseline = useCallback(
    (baseline: EditableScore, groupIds: Set<string>) => {
      const api = apiRef.current;
      if (!api || isPushingRef.current || groupIds.size < 2) return;

      const rsScore: RsScore = api.getScore();
      const currentScore = useScoreStore.getState().score;
      if (!currentScore) return;

      const hfMerged = riffScoreToEditableScore(
        rsScore,
        rsToHfRef.current,
        currentScore.parts,
        currentScore,
      );
      const hfScore = propagateMultiSelectPitchDelta(baseline, hfMerged, groupIds);

      const fp = noteSetPitchFingerprint(hfScore, groupIds);
      if (fp === lastMultiPitchFpRef.current) return;
      const curFp = noteSetPitchFingerprint(currentScore, groupIds);
      if (fp === curFp) return;

      lastMultiPitchFpRef.current = fp;
      useScoreStore.getState().replaceScoreFromEditor(hfScore);

      const maps = buildIdMap(hfScore, rsScore);
      hfToRsRef.current = maps.hfToRs;
      rsToHfRef.current = maps.rsToHf;
    },
    [apiRef],
  );

  return {
    pushToRiffScore,
    pullFromRiffScore,
    flushToZustand: pullFromRiffScore,
    syncMultiPitchFromBaseline,
    resetMultiPitchDragSync,
    hfToRs: hfToRsRef.current,
    rsToHf: rsToHfRef.current,
    getRsToHf,
  };
}
