"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme as useNextTheme } from "next-themes";
import "riffscore/styles.css";
import type { MusicEditorAPI, Selection as RsSelection } from "riffscore";
import type { EditableScore, NotePosition } from "@/lib/music/scoreTypes";
import type { NoteSelection } from "@/store/useScoreStore";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";
import { editableScoreToRiffConfig } from "@/lib/music/riffscoreAdapter";
import { useRiffScoreSync } from "@/hooks/useRiffScoreSync";
import { extractNotePositions } from "@/lib/music/riffscorePositions";
import { RiffScoreSuggestionOverlay } from "./RiffScoreSuggestionOverlay";

// Dynamic import — RiffScore manipulates DOM/SVG and cannot SSR
const RiffScoreComponent = dynamic(
  () => import("riffscore").then((mod) => mod.RiffScore),
  { ssr: false },
);

export interface RiffScoreEditorProps {
  score: EditableScore | null;
  className?: string;
  selection?: NoteSelection[];
  onNoteClick?: (sel: NoteSelection, shiftKey: boolean) => void;
  visiblePartIds?: Set<string>;
  onScoreChange?: (score: EditableScore) => void;
  onError?: (err: Error) => void;
  pendingCorrections?: ScoreCorrection[];
  onAcceptCorrection?: (correctionId: string) => void;
  onRejectCorrection?: (correctionId: string) => void;
}

export function RiffScoreEditor({
  score,
  className,
  selection = [],
  onNoteClick,
  visiblePartIds,
  onScoreChange,
  onError,
  pendingCorrections,
  onAcceptCorrection,
  onRejectCorrection,
}: RiffScoreEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<MusicEditorAPI | null>(null);
  const [instanceId] = useState(() => `hf-score-${Date.now()}`);
  const [notePositions, setNotePositions] = useState<NotePosition[]>([]);
  const [isReady, setIsReady] = useState(false);
  const prevScoreRef = useRef<EditableScore | null>(null);

  // visiblePartIds is reserved for future per-staff visibility toggling in RiffScore
  void visiblePartIds;

  const { resolvedTheme } = useNextTheme();
  const rsTheme = resolvedTheme === "dark" ? "DARK" as const : "LIGHT" as const;

  const { pushToRiffScore, rsToHf } = useRiffScoreSync(apiRef, score);

  // Build config from score, passing current theme
  const config = useMemo(
    () => score ? editableScoreToRiffConfig(score, { theme: rsTheme }) : undefined,
    [score, rsTheme],
  );

  // Acquire the API handle once RiffScore mounts
  useEffect(() => {
    if (typeof window === "undefined") return;

    const tryAcquire = () => {
      const registry = (window as unknown as Record<string, unknown>).riffScore as
        | { get: (id: string) => MusicEditorAPI | undefined }
        | undefined;
      if (registry) {
        const api = registry.get(instanceId);
        if (api) {
          apiRef.current = api;
          setIsReady(true);
          return true;
        }
      }
      return false;
    };

    if (tryAcquire()) return;

    // Poll briefly if not immediately available
    const interval = setInterval(() => {
      if (tryAcquire()) clearInterval(interval);
    }, 100);
    const timeout = setTimeout(() => clearInterval(interval), 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [instanceId]);

  // Push score to RiffScore when it changes externally (e.g., undo/redo, file load)
  useEffect(() => {
    if (!isReady || !score) return;
    // Only push if the score reference actually changed (not from our own pull)
    if (score !== prevScoreRef.current) {
      prevScoreRef.current = score;
      pushToRiffScore();
    }
  }, [isReady, score, pushToRiffScore]);

  // Extract note positions after renders for overlay positioning
  useEffect(() => {
    if (!isReady || !containerRef.current || !score) return;

    const updatePositions = () => {
      if (!containerRef.current) return;
      const positions = extractNotePositions(containerRef.current, score, rsToHf);
      setNotePositions(positions);
    };

    // Wait for RiffScore to render
    const timer = setTimeout(updatePositions, 200);

    // Re-extract on resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updatePositions, 100);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [isReady, score, rsToHf]);

  // Subscribe to selection events for onNoteClick
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !onNoteClick) return;

    const unsub = api.on("selection", (sel: unknown) => {
      const rsSel = sel as RsSelection;
      if (rsSel.selectedNotes.length === 0) return;

      const first = rsSel.selectedNotes[0];
      if (!first.noteId || !score) return;

      // Map RiffScore selection back to HF NoteSelection
      const hfNoteId = rsToHf.get(first.noteId) ?? first.noteId;
      const part = score.parts[first.staffIndex];
      if (!part) return;

      const hfSel: NoteSelection = {
        partId: part.id,
        measureIndex: first.measureIndex,
        noteIndex: 0, // RiffScore uses eventId, not noteIndex — find it
        noteId: hfNoteId,
      };

      // Find actual noteIndex within the measure
      const measure = part.measures[first.measureIndex];
      if (measure) {
        const idx = measure.notes.findIndex((n) => n.id === hfNoteId);
        if (idx >= 0) hfSel.noteIndex = idx;
      }

      onNoteClick(hfSel, false);
    });

    return unsub;
  }, [isReady, onNoteClick, score, rsToHf]);

  // Subscribe to errors
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !onError) return;

    const unsub = api.on("error", (result: unknown) => {
      const r = result as { message?: string };
      onError(new Error(r.message ?? "RiffScore error"));
    });

    return unsub;
  }, [isReady, onError]);

  // Notify parent when score changes from within RiffScore
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !onScoreChange) return;

    const unsub = api.on("score", () => {
      const currentScore = prevScoreRef.current;
      if (currentScore) onScoreChange(currentScore);
    });

    return unsub;
  }, [isReady, onScoreChange]);

  if (!score || !config) return null;

  const selectedIds = new Set(selection.map((s) => s.noteId));

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[200px] riffscore-hf-wrapper ${className ?? ""}`}
      style={{ position: "relative" }}
    >
      {/* Override RiffScore styles to match HarmonyForge design system */}
      <style>{`
        .riffscore-hf-wrapper .RiffScore {
          --riff-color-primary: var(--hf-accent, #ffb300) !important;
          --riff-color-primary-hover: #e6a200 !important;
          --riff-color-active-bg: var(--hf-accent, #ffb300) !important;
        }
        .riffscore-hf-wrapper .RiffScore,
        .riffscore-hf-wrapper .RiffScore > div,
        .riffscore-hf-wrapper .riff-ScoreEditor,
        .riffscore-hf-wrapper .riff-ScoreEditor__content {
          background: transparent !important;
        }
        .riffscore-hf-wrapper .riff-ScoreCanvas {
          background: transparent !important;
        }
      `}</style>
      <RiffScoreComponent
        id={instanceId}
        config={config}
      />

      {/* Selection highlights */}
      {notePositions.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {notePositions
            .filter((pos) => selectedIds.has(pos.selection.noteId))
            .map((pos) => (
              <div
                key={pos.selection.noteId}
                className="absolute rounded pointer-events-none"
                style={{
                  left: pos.x - 4,
                  top: pos.y - 4,
                  width: pos.w + 8,
                  height: pos.h + 8,
                  backgroundColor: "rgba(255, 179, 0, 0.3)",
                }}
                aria-hidden="true"
              />
            ))}
        </div>
      )}

      {/* Ghost note correction overlays */}
      {pendingCorrections && pendingCorrections.length > 0 && (
        <RiffScoreSuggestionOverlay
          corrections={pendingCorrections}
          notePositions={notePositions}
          containerRef={containerRef}
          onAccept={onAcceptCorrection}
          onReject={onRejectCorrection}
        />
      )}
    </div>
  );
}
