"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SandboxHeader } from "@/components/organisms/SandboxHeader";
import { ScoreCanvas } from "@/components/organisms/ScoreCanvas";
import { useUploadStore } from "@/store/useUploadStore";
import { useScoreStore, getClipboard, setClipboard, pasteNotes, type NoteSelection } from "@/store/useScoreStore";
import {
  cloneScore,
  extractNotes,
  setNoteDurations,
  toggleNoteDots,
  transposeNotes,
  setPitchByLetter,
  addArticulation,
  setNoteDynamics,
  insertMeasureBefore,
  insertMeasureAfter,
  deleteMeasure,
  insertNote,
  noteBeats,
  parseMeasureBeats,
  getInsertIndexAtBeat,
  getNoteById,
} from "@/lib/music/scoreUtils";
import { useToolStore } from "@/store/useToolStore";
import { useEditCursorStore } from "@/store/useEditCursorStore";
import { parseMusicXML } from "@/lib/music/musicxmlParser";
import { scoreToMusicXML } from "@/lib/music/scoreToMusicXML";
import { getLiveScoreAfterFlush } from "@/lib/music/liveScoreExport";
import { scoreToMidiBuffer } from "@/lib/music/scoreToMidi";
import { scoreToWavBuffer } from "@/lib/music/scoreToWav";
import { toPng } from "html-to-image";
import { zipSync, strToU8 } from "fflate";
import { TheoryInspectorPanel } from "@/components/organisms/TheoryInspectorPanel";
import { ExportModal } from "@/components/organisms/ExportModal";
import { ChatFAB } from "@/components/atoms/ChatFAB";
import { useTheoryInspector } from "@/hooks/useTheoryInspector";
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";
import {
  buildMeasureFocusFacts,
  buildPartFocusFacts,
} from "@/lib/music/regionExplainContext";
import {
  applyOriginalGeneratedPitches,
  captureGenerationBaseline,
} from "@/lib/music/theoryInspectorBaseline";
import { useSuggestionStore } from "@/store/useSuggestionStore";
import { applySuggestion, applySuggestions } from "@/lib/music/scoreUtils";
import { OnboardingCoachmark } from "@/components/organisms/OnboardingCoachmark";
import { completeOnboarding, isOnboardingComplete } from "@/lib/onboarding";
import { COACHMARKS_ENABLED, useCoachmarkStore } from "@/store/useCoachmarkStore";
import { useSandboxTourBridge } from "@/store/useSandboxTourBridge";
import { StudyLogExportBar } from "@/components/study/StudyLogExportBar";
import { getStudyCondition } from "@/lib/study/studyConfig";
import { logStudyEvent } from "@/lib/study/studyEventLog";
import type { IdeaAction } from "@/lib/ai/ideaActionSchema";
import { resolveIdeaActionNoteId } from "@/lib/music/ideaActionResolve";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";
import {
  RiffScoreSessionContext,
  type RiffScoreSessionHandles,
} from "@/context/RiffScoreSessionContext";

const ENGINE_URL = "";
const DURATION_TOOL_ORDER = [
  "duration-32nd",
  "duration-16th",
  "duration-eighth",
  "duration-quarter",
  "duration-half",
  "duration-whole",
] as const;

function TactileSandboxPageInner({
  onRiffScoreSessionReady,
}: {
  onRiffScoreSessionReady: (session: RiffScoreSessionHandles) => void;
}) {
  const riffSessionRef = React.useRef<RiffScoreSessionHandles | null>(null);
  const handleRiffScoreSessionReady = React.useCallback(
    (session: RiffScoreSessionHandles) => {
      riffSessionRef.current = session;
      onRiffScoreSessionReady(session);
    },
    [onRiffScoreSessionReady],
  );

  React.useEffect(() => {
    return () => {
      riffSessionRef.current?.flushToZustand();
    };
  }, []);

  const router = useRouter();
  const generatedMusicXML = useUploadStore((s) => s.generatedMusicXML);
  const setGeneratedMusicXML = useUploadStore((s) => s.setGeneratedMusicXML);
  const restoreFromStorage = useUploadStore((s) => s.restoreFromStorage);
  const coachmarkTourActive = useCoachmarkStore((s) => s.isActive);
  const { score, setScore, deleteSelection, applyScore, visibleParts, togglePartVisibility } = useScoreStore();
  const { activeTool, setActiveTool, clearSelection, selection, setSelection, toggleNoteSelection } = useToolStore();
  const {
    messages: inspectorMessages,
    inputValue: inspectorInputValue,
    setInputValue: setInspectorInputValue,
    sendMessage: sendInspectorMessage,
    handleChipClick: handleInspectorChipClick,
    isStreaming,
    streamingMessageId: inspectorStreamingMessageId,
    issueHighlights,
    selectedNoteInsight,
    inspectorScoreFocus,
    setInspectorScoreFocus,
    explainGeneratedNote,
    runAudit,
    explainViolationMore,
    suggestFixForViolation,
  } = useTheoryInspector();
  const suggestionStore = useSuggestionStore();
  const pendingCorrections = suggestionStore.getPendingCorrections();

  // Build suggestion batch map for the panel
  const suggestionBatchMap = React.useMemo(() => {
    const map = new Map<string, { corrections: import("@/lib/music/suggestionTypes").ScoreCorrection[]; summary: string }>();
    for (const batch of suggestionStore.batches) {
      map.set(batch.id, { corrections: batch.corrections, summary: batch.summary });
    }
    return map;
  }, [suggestionStore.batches]);

  // Accept/reject correction handlers
  const handleAcceptCorrection = React.useCallback(
    (correctionId: string) => {
      if (!score) return;
      const allCorrections = suggestionStore.batches.flatMap((b) => b.corrections);
      const correction = allCorrections.find((c) => c.id === correctionId);
      if (!correction) return;
      logStudyEvent("suggestion_accepted", { correctionId });
      const nextScore = applySuggestion(score, correction);
      applyScore(nextScore);
      suggestionStore.acceptCorrection(correctionId);
    },
    [score, applyScore, suggestionStore],
  );

  const handleRejectCorrection = React.useCallback(
    (correctionId: string) => {
      logStudyEvent("suggestion_rejected", { correctionId });
      suggestionStore.rejectCorrection(correctionId);
    },
    [suggestionStore],
  );

  const handleAcceptAll = React.useCallback(
    (batchId: string) => {
      if (!score) return;
      const batch = suggestionStore.batches.find((b) => b.id === batchId);
      if (!batch) return;
      const pending = batch.corrections.filter(
        (c) => suggestionStore.correctionStatuses[c.id] === "pending",
      );
      if (pending.length === 0) return;
      logStudyEvent("suggestion_accept_all", { batchId });
      const nextScore = applySuggestions(score, pending);
      applyScore(nextScore);
      suggestionStore.acceptAll(batchId);
    },
    [score, applyScore, suggestionStore],
  );

  const handleRejectAll = React.useCallback(
    (batchId: string) => {
      logStudyEvent("suggestion_reject_all", { batchId });
      suggestionStore.rejectAll(batchId);
    },
    [suggestionStore],
  );

  const patchSelectedNoteInsight = useTheoryInspectorStore(
    (s) => s.patchSelectedNoteInsight,
  );

  const handleAcceptIdeaAction = React.useCallback(
    (action: IdeaAction) => {
      riffSessionRef.current?.flushToZustand();
      const live = useScoreStore.getState().score;
      if (!live) {
        setInspectorDebugStatus("Could not apply: no score loaded.");
        return;
      }
      const insight = useTheoryInspectorStore.getState().selectedNoteInsight;
      const resolvedNoteId = resolveIdeaActionNoteId(live, action, insight);
      if (!resolvedNoteId) {
        setInspectorDebugStatus(
          `Could not apply: note id "${action.noteId}" not in score. Re-open this note so the tutor sees NOTE_IDS_FOR_IDEA_ACTIONS, or use a summary that names the target staff (e.g. Clarinet).`,
        );
        return;
      }
      const found = getNoteById(live, resolvedNoteId);
      if (!found) {
        setInspectorDebugStatus("Could not apply: resolved note disappeared.");
        return;
      }
      setInspectorDebugStatus("");
      logStudyEvent("idea_action_accepted", {
        actionId: action.id,
        noteId: resolvedNoteId,
      });
      const correction: ScoreCorrection = {
        id: action.id,
        noteId: resolvedNoteId,
        partId: found.part.id,
        measureIndex: found.measureIdx,
        noteIndex: found.noteIdx,
        originalPitch: found.note.pitch,
        suggestedPitch: action.suggestedPitch,
        ruleLabel: action.summary.slice(0, 120),
        rationale: "",
      };
      applyScore(applySuggestion(live, correction));
      const ins = useTheoryInspectorStore.getState().selectedNoteInsight;
      patchSelectedNoteInsight({
        ideaActionStatuses: {
          ...(ins?.ideaActionStatuses ?? {}),
          [action.id]: "accepted",
        },
      });
    },
    [applyScore, patchSelectedNoteInsight],
  );

  const handleRejectIdeaAction = React.useCallback(
    (action: IdeaAction) => {
      logStudyEvent("idea_action_rejected", {
        actionId: action.id,
        noteId: action.noteId,
      });
      const ins = useTheoryInspectorStore.getState().selectedNoteInsight;
      patchSelectedNoteInsight({
        ideaActionStatuses: {
          ...(ins?.ideaActionStatuses ?? {}),
          [action.id]: "rejected",
        },
      });
    },
    [patchSelectedNoteInsight],
  );

  const { cursor, setCursor, clearCursor } = useEditCursorStore();

  React.useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  React.useEffect(() => {
    if (generatedMusicXML || coachmarkTourActive) return;
    router.replace("/document");
  }, [generatedMusicXML, coachmarkTourActive, router]);

  // State for modals/panels — must be declared before handleToolSelect
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = React.useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [inspectorWidth, setInspectorWidth] = React.useState(380);
  const [inspectorDebugStatus, setInspectorDebugStatus] = React.useState("");
  const lastExplainedRef = React.useRef<{ noteId: string; at: number } | null>(null);
  /** Prevents runAudit on every score object identity change (RiffScore sync); audit once per inspector open. */
  const auditRunWhileInspectorOpenRef = React.useRef(false);

  const [exportModalMusicXML, setExportModalMusicXML] = React.useState<string | null>(null);
  const exportPreviewRef = React.useRef<HTMLDivElement | null>(null);

  const openExportModal = React.useCallback(() => {
    const live = getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
    setExportModalMusicXML(live ? scoreToMusicXML(live) : generatedMusicXML);
    setIsExportModalOpen(true);
  }, [generatedMusicXML]);

  const setExportModalOpenForTour = React.useCallback(
    (open: boolean) => {
      if (open) openExportModal();
      else setIsExportModalOpen(false);
    },
    [openExportModal],
  );

  React.useEffect(() => {
    useSandboxTourBridge.getState().register({
      setInspectorOpen: setIsInspectorOpen,
      setExportModalOpen: setExportModalOpenForTour,
    });
    return () => useSandboxTourBridge.getState().unregister();
  }, [setExportModalOpenForTour]);

  React.useEffect(() => {
    if (!coachmarkTourActive || generatedMusicXML) return;
    let cancelled = false;
    void fetch("/samples/tour_demo.xml")
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled && text.trim()) setGeneratedMusicXML(text);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [coachmarkTourActive, generatedMusicXML, setGeneratedMusicXML]);

  const durationToBeats = React.useCallback((dur: "w" | "h" | "q" | "8" | "16" | "32") => {
    const map: Record<"w" | "h" | "q" | "8" | "16" | "32", number> = {
      w: 4,
      h: 2,
      q: 1,
      "8": 0.5,
      "16": 0.25,
      "32": 0.125,
    };
    return map[dur] ?? 1;
  }, []);

  const withAccidental = React.useCallback((pitch: string, accidental: "#" | "b" | "natural") => {
    const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
    if (!m) return pitch;
    const step = m[1] ?? "C";
    const octave = m[3] ?? "4";
    if (accidental === "natural") return `${step}${octave}`;
    return `${step}${accidental}${octave}`;
  }, []);

  const applyAccidentalToSelection = React.useCallback((accidental: "#" | "b" | "natural") => {
    if (!score || selection.length === 0) return;
    const ids = new Set(selection.map((s) => s.noteId));
    const next = cloneScore(score);
    for (const part of next.parts) {
      for (const measure of part.measures) {
        for (const note of measure.notes) {
          if (!ids.has(note.id) || note.isRest) continue;
          note.pitch = withAccidental(note.pitch, accidental);
        }
      }
    }
    applyScore(next);
  }, [score, selection, applyScore, withAccidental]);

  const toggleTieOnSelection = React.useCallback(() => {
    if (!score || selection.length === 0) return;
    const ids = new Set(selection.map((s) => s.noteId));
    const next = cloneScore(score);
    for (const part of next.parts) {
      for (const measure of part.measures) {
        for (const note of measure.notes) {
          if (!ids.has(note.id) || note.isRest) continue;
          note.tie = note.tie ? undefined : "start";
        }
      }
    }
    applyScore(next);
  }, [score, selection, applyScore]);

  const setMeasureTimeSignature = React.useCallback(() => {
    if (!score) return;
    const target = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
    const value = window.prompt("Enter time signature (e.g. 4/4):", "4/4");
    if (!value) return;
    const next = cloneScore(score);
    for (const part of next.parts) {
      const measure = part.measures[target];
      if (measure) measure.timeSignature = value.trim();
    }
    applyScore(next);
  }, [score, cursor, selection, applyScore]);

  const setMeasureKeySignature = React.useCallback(() => {
    if (!score) return;
    const target = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
    const raw = window.prompt("Enter key signature fifths (-7 to 7):", "0");
    if (raw === null) return;
    const value = Number.parseInt(raw, 10);
    if (!Number.isFinite(value) || value < -7 || value > 7) return;
    const next = cloneScore(score);
    for (const part of next.parts) {
      const measure = part.measures[target];
      if (measure) measure.keySignature = value;
    }
    applyScore(next);
  }, [score, cursor, selection, applyScore]);

  const setSelectedPartClef = React.useCallback((clef: "treble" | "bass" | "alto") => {
    if (!score) return;
    const targetPartId = cursor?.partId ?? selection[0]?.partId ?? score.parts[0]?.id;
    if (!targetPartId) return;
    const next = cloneScore(score);
    const part = next.parts.find((p) => p.id === targetPartId);
    if (!part) return;
    part.clef = clef;
    applyScore(next);
  }, [score, cursor, selection, applyScore]);

  const annotateSelection = React.useCallback((label: string) => {
    if (!score || selection.length === 0) {
      window.alert(`${label} requires selected notes.`);
      return;
    }
    const text = window.prompt(`${label}: enter text`);
    if (!text) return;
    const ids = new Set(selection.map((s) => s.noteId));
    const next = cloneScore(score);
    for (const part of next.parts) {
      for (const measure of part.measures) {
        for (const note of measure.notes) {
          if (!ids.has(note.id)) continue;
          note.dynamics = text;
        }
      }
    }
    applyScore(next);
  }, [score, selection, applyScore]);

  const resolveInsertionTarget = React.useCallback(() => {
    if (!score) return null;
    if (cursor) {
      return {
        partId: cursor.partId,
        measureIndex: cursor.measureIndex,
        noteIndex: cursor.noteIndex,
        beat: cursor.beat,
      };
    }
    const selected = selection[0];
    if (selected) {
      return {
        partId: selected.partId,
        measureIndex: selected.measureIndex,
        noteIndex: selected.noteIndex + 1,
        beat: 0,
      };
    }
    const firstPart = score.parts[0];
    if (!firstPart) return null;
    return {
      partId: firstPart.id,
      measureIndex: 0,
      noteIndex: 0,
      beat: 0,
    };
  }, [cursor, score, selection]);

  const handleToolSelect = React.useCallback(
    (toolId: string) => {
      const editHandlers: Record<string, () => void> = {
        "edit-undo": () => riffSessionRef.current?.editorUndo(),
        "edit-redo": () => riffSessionRef.current?.editorRedo(),
        "edit-cut": () => {
          if (!score || selection.length === 0) return;
          const noteIds = selection.map((s) => s.noteId);
          setClipboard(extractNotes(score, new Set(noteIds)));
          deleteSelection(noteIds);
          clearSelection();
        },
        "edit-copy": () => {
          if (!score || selection.length === 0) return;
          const noteIds = selection.map((s) => s.noteId);
          setClipboard(extractNotes(score, new Set(noteIds)));
        },
        "edit-paste": () => {
          if (!score || getClipboard().length === 0) return;
          const target = resolveInsertionTarget();
          const partId = target?.partId ?? score.parts[0]?.id;
          const measureIndex = target?.measureIndex ?? 0;
          const noteIndex = target?.noteIndex ?? 0;
          const next = pasteNotes(score, partId, measureIndex, noteIndex);
          applyScore(next);
        },
        "edit-delete": () => {
          if (!score || selection.length === 0) return;
          deleteSelection(selection.map((s) => s.noteId));
          clearSelection();
        },
        "insert-rest": () => {
          if (!score) return;
          const target = resolveInsertionTarget();
          const partId = target?.partId ?? score.parts[0]?.id;
          const measureIndex = target?.measureIndex ?? 0;
          const noteIndex = target?.noteIndex ?? 0;
          if (!partId) return;
          const durationMap: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
            "duration-whole": "w",
            "duration-half": "h",
            "duration-quarter": "q",
            "duration-eighth": "8",
            "duration-16th": "16",
            "duration-32nd": "32",
            "duration-64th": "32",
          };
          const restDuration = activeTool && durationMap[activeTool] ? durationMap[activeTool] : "q";
          applyScore(insertNote(score, partId, measureIndex, noteIndex, {
            duration: restDuration,
            pitch: "B4",
            isRest: true,
          }));
        },
      };
      const durationMap: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
        "duration-whole": "w",
        "duration-half": "h",
        "duration-quarter": "q",
        "duration-eighth": "8",
        "duration-16th": "16",
        "duration-32nd": "32",
        "duration-64th": "32",
      };
      const pitchHandlers: Record<string, number> = {
        "pitch-up-semitone": 1,
        "pitch-down-semitone": -1,
        "pitch-up-octave": 12,
        "pitch-down-octave": -12,
      };
      if (editHandlers[toolId]) {
        editHandlers[toolId]();
      } else if (durationMap[toolId] && score && selection.length > 0) {
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = setNoteDurations(score, noteIds, durationMap[toolId]);
        applyScore(next);
      } else if (durationMap[toolId]) {
        setActiveTool(toolId);
      } else if (toolId === "duration-dotted" && score && selection.length > 0) {
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = toggleNoteDots(score, noteIds);
        applyScore(next);
      } else if (toolId === "duration-tie") {
        toggleTieOnSelection();
      } else if (pitchHandlers[toolId] !== undefined && score && selection.length > 0) {
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = transposeNotes(score, noteIds, pitchHandlers[toolId]);
        applyScore(next);
      } else if (toolId === "pitch-accidental-sharp") {
        applyAccidentalToSelection("#");
      } else if (toolId === "pitch-accidental-flat") {
        applyAccidentalToSelection("b");
      } else if (toolId === "pitch-accidental-natural") {
        applyAccidentalToSelection("natural");
      } else if (
        ["artic-slur", "artic-staccato", "artic-tenuto", "artic-accent", "artic-strong-accent", "artic-staccatissimo"].includes(toolId) &&
        score &&
        selection.length > 0
      ) {
        const articMap: Record<string, string> = {
          "artic-slur": "slur",
          "artic-staccato": "a.",
          "artic-tenuto": "a-",
          "artic-accent": "a>",
          "artic-strong-accent": "a^",
          "artic-staccatissimo": "staccatissimo",
        };
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = addArticulation(score, noteIds, articMap[toolId] ?? "a.");
        applyScore(next);
      } else if (toolId === "dynamics-expression-text") {
        annotateSelection("Expression text");
      } else if (
        ["dynamics-piano", "dynamics-cresc", "dynamics-decresc"].includes(toolId) &&
        score &&
        selection.length > 0
      ) {
        const dynMap: Record<string, string> = {
          "dynamics-piano": "p",
          "dynamics-cresc": "crescendo",
          "dynamics-decresc": "decrescendo",
        };
        const noteIds = new Set(selection.map((s) => s.noteId));
        const next = setNoteDynamics(score, noteIds, dynMap[toolId] ?? "p");
        applyScore(next);
      } else if (toolId === "measure-insert-before" && score) {
        const mIdx = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        applyScore(insertMeasureBefore(score, mIdx));
      } else if (toolId === "measure-insert-after" && score) {
        const mIdx = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        applyScore(insertMeasureAfter(score, mIdx + 1));
      } else if (toolId === "measure-delete" && score && (selection.length > 0 || cursor)) {
        const mIdx = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        applyScore(deleteMeasure(score, mIdx));
        clearSelection();
      } else if (toolId === "measure-change-time") {
        setMeasureTimeSignature();
      } else if (toolId === "measure-change-key") {
        setMeasureKeySignature();
      } else if (toolId === "measure-clef-treble") {
        setSelectedPartClef("treble");
      } else if (toolId === "measure-clef-bass") {
        setSelectedPartClef("bass");
      } else if (toolId === "measure-clef-alto") {
        setSelectedPartClef("alto");
      } else if (toolId === "score-copy") {
        const live = getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
        if (live) navigator.clipboard?.writeText(scoreToMusicXML(live));
      } else if (toolId === "score-print") {
        getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
        window.print();
      } else if (toolId === "score-save") {
        const live = getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
        if (!live) return;
        const blob = new Blob([scoreToMusicXML(live)], { type: "application/xml" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "harmony-forge-score.xml";
        a.click();
        URL.revokeObjectURL(a.href);
      } else if (toolId === "score-export") {
        openExportModal();
      } else if (toolId === "score-parts" || toolId === "score-layers") {
        setLayersPanelOpen((o) => !o);
      } else if (toolId === "text-lyrics") {
        annotateSelection("Lyrics");
      } else if (toolId === "text-performance") {
        annotateSelection("Performance text");
      } else if (toolId === "text-expression") {
        annotateSelection("Expression text");
      } else if (toolId === "text-chord-symbol") {
        annotateSelection("Chord symbol");
      } else {
        if (
          toolId.startsWith("duration-") ||
          toolId.startsWith("pitch-") ||
          toolId.startsWith("edit-")
        ) {
        }
        setActiveTool(toolId);
      }
    },
    [score, selection, deleteSelection, clearSelection, applyScore, setActiveTool, openExportModal, setLayersPanelOpen, cursor, resolveInsertionTarget, activeTool, toggleTieOnSelection, applyAccidentalToSelection, annotateSelection, setMeasureTimeSignature, setMeasureKeySignature, setSelectedPartClef]
  );

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection();
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selection.length > 0 && score) {
          e.preventDefault();
          handleToolSelect("edit-delete");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) riffSessionRef.current?.editorRedo();
        else riffSessionRef.current?.editorUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        riffSessionRef.current?.editorRedo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        if (selection.length > 0 && score) {
          e.preventDefault();
          handleToolSelect("edit-copy");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "x") {
        if (selection.length > 0 && score) {
          e.preventDefault();
          handleToolSelect("edit-cut");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        if (getClipboard().length > 0 && score) {
          e.preventDefault();
          handleToolSelect("edit-paste");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        if (!score) return;
        e.preventDefault();
        const all = score.parts.flatMap((part) =>
          part.measures.flatMap((measure, measureIndex) =>
            measure.notes.map((note, noteIndex) => ({
              partId: part.id,
              measureIndex,
              noteIndex,
              noteId: note.id,
            })),
          ),
        );
        setSelection(all);
      }
      // 2g.3: MuseScore-style keyboard shortcuts (when not in input/textarea)
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setActiveTool("duration-quarter");
      }
      const inputDurationMap: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
        "duration-whole": "w",
        "duration-half": "h",
        "duration-quarter": "q",
        "duration-eighth": "8",
        "duration-16th": "16",
        "duration-32nd": "32",
      };
      const inputDuration =
        activeTool && inputDurationMap[activeTool]
          ? inputDurationMap[activeTool]
          : "q";
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const currentIdx = DURATION_TOOL_ORDER.findIndex((tool) => tool === activeTool);
        const startIdx = currentIdx >= 0 ? currentIdx : 3; // default quarter
        const nextIdx =
          e.key === "["
            ? Math.max(0, startIdx - 1)
            : Math.min(DURATION_TOOL_ORDER.length - 1, startIdx + 1);
        setActiveTool(DURATION_TOOL_ORDER[nextIdx]);
      }
      if (e.key === "0" && score) {
        e.preventDefault();
        if (selection.length > 0) {
          const noteIds = new Set(selection.map((s) => s.noteId));
          const next = cloneScore(score);
          for (const part of next.parts) {
            for (const measure of part.measures) {
              for (const note of measure.notes) {
                if (!noteIds.has(note.id)) continue;
                note.isRest = true;
                note.pitch = "B4";
              }
            }
          }
          applyScore(next);
          return;
        }
        const durationMap: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
          "duration-whole": "w",
          "duration-half": "h",
          "duration-quarter": "q",
          "duration-eighth": "8",
          "duration-16th": "16",
          "duration-32nd": "32",
        };
        const restDuration =
          activeTool && durationMap[activeTool] ? durationMap[activeTool] : "q";
        const target = resolveInsertionTarget();
        const partId = target?.partId ?? score.parts[0]?.id;
        const measureIndex = target?.measureIndex ?? 0;
        const noteIndex = target?.noteIndex ?? 0;
        if (partId) {
          applyScore(
            insertNote(score, partId, measureIndex, noteIndex, {
              duration: restDuration,
              pitch: "B4",
              isRest: true,
            }),
          );
          const nextBeat = (target?.beat ?? 0) + durationToBeats(restDuration);
          setCursor({
            partId,
            measureIndex,
            beat: nextBeat,
            noteIndex: noteIndex + 1,
          });
        }
      }
      if (score && selection.length === 0) {
        const key = e.key.toUpperCase();
        if (["A", "B", "C", "D", "E", "F", "G"].includes(key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
          const target = resolveInsertionTarget();
          const partId = target?.partId ?? score.parts[0]?.id;
          const measureIndex = target?.measureIndex ?? 0;
          const noteIndex = target?.noteIndex ?? 0;
          if (!partId) return;
          e.preventDefault();
          const next = insertNote(score, partId, measureIndex, noteIndex, {
            duration: inputDuration,
            pitch: `${key}4`,
          });
          applyScore(next);
          const nextBeat = (target?.beat ?? 0) + durationToBeats(inputDuration);
          setCursor({
            partId,
            measureIndex,
            beat: nextBeat,
            noteIndex: noteIndex + 1,
          });
        }
      }
      if (selection.length === 0 && score && isNoteInputMode) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          moveCursorHorizontally(-1);
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          moveCursorHorizontally(1);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          moveCursorVertically(-1);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          moveCursorVertically(1);
        }
      }
      if (selection.length > 0 && score) {
        const key = e.key.toUpperCase();
        if (key >= "1" && key <= "9") {
          const durMap: Record<string, string> = {
            "1": "duration-32nd",
            "2": "duration-16th",
            "3": "duration-eighth",
            "4": "duration-quarter",
            "5": "duration-half",
            "6": "duration-whole",
          };
          const tool = durMap[key];
          if (tool) {
            e.preventDefault();
            handleToolSelect(tool);
          }
        } else if (["A", "B", "C", "D", "E", "F", "G"].includes(key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          const noteIds = new Set(selection.map((s) => s.noteId));
          applyScore(setPitchByLetter(score, noteIds, key));
        } else if (e.key === ",") {
          e.preventDefault();
          handleToolSelect("duration-tie");
        } else if (e.key === "+") {
          e.preventDefault();
          handleToolSelect("pitch-accidental-sharp");
        } else if (e.key === "-") {
          e.preventDefault();
          handleToolSelect("pitch-accidental-flat");
        } else if (e.key === "=") {
          e.preventDefault();
          handleToolSelect("pitch-accidental-natural");
        } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handleToolSelect(e.key === "ArrowUp" ? "pitch-up-semitone" : "pitch-down-semitone");
          } else if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            handleToolSelect(e.key === "ArrowUp" ? "pitch-up-octave" : "pitch-down-octave");
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clearSelection,
    selection,
    score,
    handleToolSelect,
    applyScore,
    activeTool,
    setActiveTool,
    resolveInsertionTarget,
    durationToBeats,
    setCursor,
    setSelection,
  ]);

  React.useEffect(() => {
    setShowOnboarding(!isOnboardingComplete());
  }, []);

  React.useEffect(() => {
    if (!generatedMusicXML) {
      setScore(null);
      setSelection([]);
      clearCursor();
      useTheoryInspectorStore.getState().clearGenerationBaseline();
      return;
    }
    const parsed = parseMusicXML(generatedMusicXML);
    setScore(parsed);
    setSelection([]);
    clearCursor();
    queueMicrotask(() => {
      const s = useScoreStore.getState().score;
      if (!s) return;
      void captureGenerationBaseline(s, ENGINE_URL).then((payload) => {
        const stamped = applyOriginalGeneratedPitches(s, payload.harmonyNotePitches);
        useScoreStore.getState().applyScore(stamped);
        useTheoryInspectorStore.getState().setGenerationBaseline({
          harmonyNotePitches: payload.harmonyNotePitches,
          satbTrace: payload.satbTrace,
          baselineAuditedSlots: payload.baselineAuditedSlots,
        });
      });
    });
  }, [generatedMusicXML, setScore, setSelection, clearCursor]);

  const scoreForCanvas = score ?? null;

  const isResizing = React.useRef(false);
  const startX = React.useRef(0);
  const startWidth = React.useRef(380);

  const handleResizeStart = React.useCallback(
    (e: React.MouseEvent) => {
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = inspectorWidth;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    },
    [inspectorWidth],
  );

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX.current - e.clientX; // dragging left → wider
      const newW = Math.max(280, Math.min(600, startWidth.current + delta));
      setInspectorWidth(newW);
    };
    const onMouseUp = () => {
      isResizing.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Search + filter (multi-select)
  // searchValue and activeFilters removed — RiffScore provides its own toolbar

  // Note input: selected duration for click-on-staff placement (Noteflight/MuseScore-style)
  const durationForInput = React.useMemo(() => {
    const map: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
      "duration-whole": "w",
      "duration-half": "h",
      "duration-quarter": "q",
      "duration-eighth": "8",
      "duration-16th": "16",
      "duration-32nd": "32",
    };
    return activeTool && map[activeTool] ? map[activeTool] : "q";
  }, [activeTool]);
  const isNoteInputMode = [
    "duration-whole",
    "duration-half",
    "duration-quarter",
    "duration-eighth",
    "duration-16th",
    "duration-32nd",
  ].includes(activeTool ?? "");

  const partOrderForCursor = React.useMemo(() => {
    if (!score) return [];
    if (!visibleParts || visibleParts.size === 0) return score.parts;
    const filtered = score.parts.filter((part) => visibleParts.has(part.id));
    return filtered.length > 0 ? filtered : score.parts;
  }, [score, visibleParts]);

  React.useEffect(() => {
    if (selection.length > 0 && selection[0]) {
      const sel = selection[0];
      const part = score?.parts.find((p) => p.id === sel.partId);
      const measure = part?.measures[sel.measureIndex];
      if (measure) {
        let beat = 0;
        for (let idx = 0; idx < Math.max(0, sel.noteIndex); idx++) {
          beat += noteBeats(measure.notes[idx]);
        }
        setCursor({
          partId: sel.partId,
          measureIndex: sel.measureIndex,
          beat,
          noteIndex: sel.noteIndex,
        });
      }
    }
  }, [selection, score, setCursor]);

  const moveCursorHorizontally = React.useCallback(
    (direction: -1 | 1) => {
      if (!score) return;
      const step = durationToBeats(durationForInput);
      const defaultPart = partOrderForCursor[0];
      const anchor =
        cursor ??
        (defaultPart
          ? {
              partId: defaultPart.id,
              measureIndex: 0,
              beat: 0,
              noteIndex: 0,
            }
          : null);
      if (!anchor) return;
      const part = score.parts.find((p) => p.id === anchor.partId) ?? score.parts[0];
      if (!part) return;
      let measureIndex = Math.max(0, Math.min(anchor.measureIndex, part.measures.length - 1));
      let beat = anchor.beat + direction * step;

      while (measureIndex > 0 && beat < 0) {
        const prevBeats = parseMeasureBeats(part.measures[measureIndex - 1]?.timeSignature);
        measureIndex -= 1;
        beat += prevBeats;
      }
      while (measureIndex < part.measures.length - 1) {
        const currentBeats = parseMeasureBeats(part.measures[measureIndex]?.timeSignature);
        if (beat <= currentBeats) break;
        beat -= currentBeats;
        measureIndex += 1;
      }

      const targetMeasure = part.measures[measureIndex];
      const beatsInMeasure = parseMeasureBeats(targetMeasure?.timeSignature);
      const clampedBeat = Math.max(0, Math.min(beatsInMeasure, beat));
      const noteIndex = targetMeasure ? getInsertIndexAtBeat(targetMeasure, clampedBeat) : 0;
      setCursor({
        partId: part.id,
        measureIndex,
        beat: clampedBeat,
        noteIndex,
      });
    },
    [cursor, durationForInput, durationToBeats, partOrderForCursor, score, setCursor],
  );

  const moveCursorVertically = React.useCallback(
    (direction: -1 | 1) => {
      if (!score || partOrderForCursor.length === 0) return;
      const defaultPart = partOrderForCursor[0];
      const anchor =
        cursor ??
        (defaultPart
          ? {
              partId: defaultPart.id,
              measureIndex: 0,
              beat: 0,
              noteIndex: 0,
            }
          : null);
      if (!anchor) return;
      const currentIdx = partOrderForCursor.findIndex((p) => p.id === anchor.partId);
      const startIdx = currentIdx >= 0 ? currentIdx : 0;
      const nextIdx = Math.max(
        0,
        Math.min(partOrderForCursor.length - 1, startIdx + direction),
      );
      const nextPart = partOrderForCursor[nextIdx];
      if (!nextPart) return;
      const measureIndex = Math.max(
        0,
        Math.min(anchor.measureIndex, nextPart.measures.length - 1),
      );
      const targetMeasure = nextPart.measures[measureIndex];
      const beatsInMeasure = parseMeasureBeats(targetMeasure?.timeSignature);
      const clampedBeat = Math.max(0, Math.min(beatsInMeasure, anchor.beat));
      const noteIndex = targetMeasure ? getInsertIndexAtBeat(targetMeasure, clampedBeat) : 0;
      setCursor({
        partId: nextPart.id,
        measureIndex,
        beat: clampedBeat,
        noteIndex,
      });
    },
    [cursor, partOrderForCursor, score, setCursor],
  );

  // Zoom
  // Zoom removed — RiffScore provides its own scale controls

  // Run audit once when inspector opens (do not depend on score identity — it changes every editor sync).
  React.useEffect(() => {
    if (!isInspectorOpen) {
      auditRunWhileInspectorOpenRef.current = false;
      return;
    }
    if (!score) return;
    if (auditRunWhileInspectorOpenRef.current) return;
    auditRunWhileInspectorOpenRef.current = true;
    void runAudit(score);
  }, [isInspectorOpen, score, runAudit]);

  const handleInspectorSelectMeasure = React.useCallback(
    (measureIndex: number) => {
      if (!score) return;
      const { lines, noteIds } = buildMeasureFocusFacts(score, measureIndex);
      setInspectorScoreFocus({
        kind: "measure",
        measureIndex,
        evidenceLines: lines,
        noteIds,
      });
    },
    [score, setInspectorScoreFocus],
  );

  const handleInspectorSelectPart = React.useCallback(
    (staffIndex: number) => {
      if (!score) return;
      const part = score.parts[staffIndex];
      if (!part) return;
      const { lines, noteIds } = buildPartFocusFacts(score, part.id);
      setInspectorScoreFocus({
        kind: "part",
        partId: part.id,
        partName: part.name,
        evidenceLines: lines,
        noteIds,
      });
    },
    [score, setInspectorScoreFocus],
  );

  const handleInspectorInferredRegion = React.useCallback(
    (region:
      | { kind: "measure"; measureIndex: number }
      | { kind: "part"; staffIndex: number }) => {
      if (region.kind === "measure") {
        handleInspectorSelectMeasure(region.measureIndex);
      } else {
        handleInspectorSelectPart(region.staffIndex);
      }
    },
    [handleInspectorSelectMeasure, handleInspectorSelectPart],
  );

  const inspectorFocusHighlightNoteIds = React.useMemo(() => {
    const f = inspectorScoreFocus;
    if (!f || f.kind === "note") return [];
    return f.noteIds;
  }, [inspectorScoreFocus]);

  const handleScoreNoteClick = React.useCallback(
    (sel: NoteSelection, shiftKey: boolean) => {
      toggleNoteSelection(sel, shiftKey);
      if (isInspectorOpen && score) {
        const partIndex = score.parts.findIndex((part) => part.id === sel.partId);
        const now = Date.now();
        const last = lastExplainedRef.current;
        if (last && last.noteId === sel.noteId && now - last.at < 1200) {
          setInspectorDebugStatus(
            `click throttled noteId=${sel.noteId} partId=${sel.partId} partIndex=${partIndex}`,
          );
          return;
        }
        lastExplainedRef.current = { noteId: sel.noteId, at: now };
        setInspectorDebugStatus(
          `clicked noteId=${sel.noteId} partId=${sel.partId} partIndex=${partIndex} invoking explainGeneratedNote`,
        );
        void explainGeneratedNote(score, sel.noteId, sel.partId);
      }
    },
    [toggleNoteSelection, isInspectorOpen, score, explainGeneratedNote],
  );

  const handleExport = async (format: string) => {
    const live = getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
    if (!live) {
      window.alert("No score to export.");
      setIsExportModalOpen(false);
      return;
    }
    const downloadBlob = (blob: Blob, filename: string) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    const xml = scoreToMusicXML(live);

    try {
      if (format === "xml") {
        downloadBlob(new Blob([xml], { type: "application/xml" }), "harmony-forge-score.xml");
      } else if (format === "json") {
        downloadBlob(new Blob([JSON.stringify(live, null, 2)], { type: "application/json" }), "harmony-forge-score.json");
      } else if (format === "pdf") {
        window.print();
      } else if (format === "chord-chart") {
        const formData = new FormData();
        formData.append(
          "file",
          new Blob([scoreToMusicXML(live)], { type: "application/xml" }),
          "score.xml",
        );
        const res = await fetch(`/api/export-chord-chart`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Could not generate chord chart");
        const chart = await res.text();
        downloadBlob(new Blob([chart], { type: "text/plain" }), "harmony-forge-chord-chart.txt");
      } else if (format === "midi") {
        const mid = scoreToMidiBuffer(live);
        downloadBlob(new Blob([new Uint8Array(mid)], { type: "audio/midi" }), "harmony-forge-score.mid");
      } else if (format === "png") {
        const root = exportPreviewRef.current;
        if (!root) {
          window.alert("Score preview is not ready. Close and reopen Export.");
        } else {
          const isDark =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
          const dataUrl = await toPng(root, {
            pixelRatio: 2,
            backgroundColor: isDark ? "#1A1110" : "#F8F3EA",
          });
          const res = await fetch(dataUrl);
          downloadBlob(await res.blob(), "harmony-forge-score.png");
        }
      } else if (format === "wav") {
        const ab = await scoreToWavBuffer(live);
        downloadBlob(new Blob([ab], { type: "audio/wav" }), "harmony-forge-score.wav");
      } else if (format === "zip") {
        const midi = scoreToMidiBuffer(live);
        const json = JSON.stringify(live, null, 2);
        const fd = new FormData();
        fd.append("file", new Blob([xml], { type: "application/xml" }), "score.xml");
        const chartRes = await fetch(`${API_BASE}/api/export-chord-chart`, { method: "POST", body: fd });
        const chart = chartRes.ok ? await chartRes.text() : "Chord chart unavailable.";
        const zipped = zipSync({
          "score.musicxml": strToU8(xml),
          "score.mid": midi,
          "score.json": strToU8(json),
          "chord-chart.txt": strToU8(chart),
        });
        downloadBlob(new Blob([new Uint8Array(zipped)], { type: "application/zip" }), "harmony-forge-export.zip");
      } else {
        window.alert(`Unknown export format: ${format}`);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Export failed");
    }
    setIsExportModalOpen(false);
  };

  // Don't render sandbox UI while redirecting (no generated music), unless coachmark tour is active (sample loads async)
  if (!generatedMusicXML && !coachmarkTourActive) {
    return null;
  }

  const reviewerStudyArm = getStudyCondition() === "reviewer_primary";

  return (
    <div
      className="hf-sandbox-root flex flex-col w-full h-screen overflow-hidden"
      style={{ backgroundColor: "var(--hf-bg)" }}
    >
      {/* Zone 1: Header */}
      <SandboxHeader onExportClick={openExportModal} />

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left column */}
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          data-coachmark="step-3"
        >
          {/* RiffScore editor — includes its own toolbar, score canvas, and playback */}
          <div className="hf-sandbox-print-target relative flex-1 min-h-[320px] overflow-hidden">
            <ScoreCanvas
              className="w-full h-full"
              score={scoreForCanvas}
              showViolations={isInspectorOpen}
              onCanvasClick={clearSelection}
              selection={selection}
              onNoteClick={handleScoreNoteClick}
              pendingCorrections={pendingCorrections}
              onAcceptCorrection={handleAcceptCorrection}
              onRejectCorrection={handleRejectCorrection}
              issueHighlights={issueHighlights}
              noteInspectionEnabled={isInspectorOpen}
              focusHighlightNoteIds={inspectorFocusHighlightNoteIds}
              onInspectorSelectMeasure={
                isInspectorOpen ? handleInspectorSelectMeasure : undefined
              }
              onInspectorSelectPart={
                isInspectorOpen ? handleInspectorSelectPart : undefined
              }
              onInspectorInferredRegion={
                isInspectorOpen ? handleInspectorInferredRegion : undefined
              }
              onRiffScoreSessionReady={handleRiffScoreSessionReady}
              noteInputPitchLabelEnabled={isNoteInputMode}
            />
            {layersPanelOpen && score && (
              <div
                className="hf-print-hide absolute left-4 top-full mt-1 z-50 rounded-lg px-3 py-2 shadow-lg min-w-[140px]"
                style={{
                  backgroundColor: "var(--hf-bg)",
                  border: "1px solid var(--hf-detail)",
                }}
              >
                <div className="text-[11px] font-medium mb-2" style={{ color: "var(--hf-text-secondary)" }}>
                  Visible parts
                </div>
                <p className="text-[10px] mb-2 opacity-80" style={{ color: "var(--hf-text-secondary)" }}>
                  The editor shows every staff; toggles here are for your workflow labels only.
                </p>
                {score.parts.map((part) => {
                  const isVisible = visibleParts.size === 0 || visibleParts.has(part.id);
                  return (
                    <label
                      key={part.id}
                      className="flex items-center gap-2 py-1 cursor-pointer text-[13px]"
                      style={{ color: "var(--hf-text-primary)" }}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => togglePartVisibility(part.id)}
                        className="rounded"
                      />
                      {part.name}
                    </label>
                  );
                })}
              </div>
            )}

            {/* ChatFAB — shown only when inspector is closed */}
            {!isInspectorOpen && (
              <div className="hf-print-hide absolute bottom-[28px] right-[28px] z-10">
                <ChatFAB onClick={() => setIsInspectorOpen(true)} />
              </div>
            )}
          </div>
        </div>

        {/* Right column: Theory Inspector — resizable */}
        {isInspectorOpen && (
          <div
            data-coachmark="step-4"
            className="hf-print-hide relative shrink-0 h-full overflow-hidden flex"
            style={{ width: inspectorWidth }}
          >
            {/* Drag handle — left edge */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[5px] cursor-col-resize z-10 group"
              onMouseDown={handleResizeStart}
              title="Drag to resize"
            >
              {/* Visual indicator on hover */}
              <div
                className="absolute left-[2px] top-[50%] -translate-y-[50%] w-[1px] h-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: "var(--hf-accent)" }}
              />
            </div>

            <TheoryInspectorPanel
              className="h-full flex-1"
              messages={inspectorMessages}
              inputValue={inspectorInputValue}
              onInputChange={setInspectorInputValue}
              onSend={() => {
                void sendInspectorMessage(inspectorInputValue);
              }}
              onChipClick={(chip) => handleInspectorChipClick(chip, score)}
              isStreaming={isStreaming}
              streamingMessageId={inspectorStreamingMessageId}
              noteInsight={selectedNoteInsight}
              inspectorScoreFocus={inspectorScoreFocus}
              debugStatus={inspectorDebugStatus}
              onClose={() => setIsInspectorOpen(false)}
              suggestionBatches={suggestionBatchMap}
              correctionStatuses={suggestionStore.correctionStatuses}
              onAcceptCorrection={handleAcceptCorrection}
              onRejectCorrection={handleRejectCorrection}
              onAcceptAllCorrections={handleAcceptAll}
              onRejectAllCorrections={handleRejectAll}
              onExplainMore={(msgId) => explainViolationMore(msgId)}
              onSuggestFix={
                score
                  ? (msgId) => suggestFixForViolation(score, msgId)
                  : undefined
              }
              onAcceptIdeaAction={handleAcceptIdeaAction}
              onRejectIdeaAction={handleRejectIdeaAction}
            />
          </div>
        )}
      </div>

      <StudyLogExportBar />

      {showOnboarding && !COACHMARKS_ENABLED && (
        <OnboardingCoachmark
          stepLabel="Step 3 of 3"
          title="Edit, listen, and inspect theory"
          description={
            reviewerStudyArm
              ? "Add harmony notes on extra staves as you like, use Play when available, and open Theory Inspector to audit issues and request fixes—harmonies were not auto-generated in this session."
              : "Use note tools directly on the staff, drag notes up/down to change pitch, use Play for audio preview, and Theory Inspector for explanations."
          }
          primaryCta="Finish tour"
          onPrimary={() => {
            completeOnboarding();
            setShowOnboarding(false);
          }}
          onSecondary={() => {
            completeOnboarding();
            setShowOnboarding(false);
          }}
          secondaryCta="Skip tour"
        />
      )}

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportModalMusicXML(null);
        }}
        onExport={handleExport}
        musicXML={exportModalMusicXML}
        previewContainerRef={exportPreviewRef}
      />
    </div>
  );
}

/**
 * TactileSandboxPage — RiffScore session context wraps inner so Theory Inspector can flush editor → Zustand.
 */
export default function TactileSandboxPage() {
  const [riffSession, setRiffScoreSession] = React.useState<RiffScoreSessionHandles | null>(null);
  return (
    <RiffScoreSessionContext.Provider value={riffSession}>
      <TactileSandboxPageInner onRiffScoreSessionReady={setRiffScoreSession} />
    </RiffScoreSessionContext.Provider>
  );
}
