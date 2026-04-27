"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SandboxHeader } from "@/components/organisms/SandboxHeader";
import { AudioUnlockBanner } from "@/components/molecules/AudioUnlockBanner";
import { ScoreCanvas } from "@/components/organisms/ScoreCanvas";
import { useUploadStore } from "@/store/useUploadStore";
import { useScoreStore, getClipboard, setClipboard, pasteNotes, type NoteSelection } from "@/store/useScoreStore";
import {
  cloneScore,
  extractNotes,
  setNoteDurations,
  toggleNoteDots,
  toggleNoteRests,
  transposeNotes,
  setPitchByLetter,
  restsToNotes,
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
  setMeasureBarline,
  setMeasureRepeatMark,
  setMeasureTempoText,
  setOrnament,
  setTuplet,
  setLineOnSelection,
  setNoteLyric,
  setNoteChordSymbol,
  applySuggestion,
  applySuggestions,
  measureRangeForLocalizedHarmonyRegenerate,
  spliceHarmonyMeasuresFromAddonScore,
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
import { ExportPrintRoot } from "@/components/organisms/ExportPrintRoot";
import { SandboxPalettePanel } from "@/components/organisms/SandboxPalettePanel";
import { ChatFAB } from "@/components/atoms/ChatFAB";
import { ConfigurationBackFAB } from "@/components/atoms/ConfigurationBackFAB";
import { Palette as PaletteIcon } from "lucide-react";
import { useTheoryInspector } from "@/hooks/useTheoryInspector";
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";
import {
  buildMeasureFocusFacts,
  buildMeasurePartFocusFacts,
  buildPartFocusFacts,
} from "@/lib/music/regionExplainContext";
import {
  applyOriginalGeneratedPitches,
  captureGenerationBaseline,
} from "@/lib/music/theoryInspectorBaseline";
import { useSuggestionStore } from "@/store/useSuggestionStore";
import { OnboardingCoachmark } from "@/components/organisms/OnboardingCoachmark";
import { OnboardingOverlay } from "@/components/organisms/OnboardingOverlay";
import { TheoryInspectorFabHint } from "@/components/organisms/TheoryInspectorFabHint";
import { WorkspaceResetModal } from "@/components/organisms/WorkspaceResetModal";
import { SandboxHotkeysDialog } from "@/components/molecules/SandboxHotkeysDialog";
import {
  completeOnboarding,
  dismissInspectorFabHint,
  isInspectorFabHintDismissed,
  isOnboardingComplete,
  isSandboxFirstVisitDone,
} from "@/lib/onboarding";
import { COACHMARKS_ENABLED, useCoachmarkStore } from "@/store/useCoachmarkStore";
import { useSandboxTourBridge } from "@/store/useSandboxTourBridge";
import { StudyLogExportBar } from "@/components/study/StudyLogExportBar";
import { AppFooterStrip } from "@/components/organisms/AppFooterStrip";
import { getStudyCondition } from "@/lib/study/studyConfig";
import { logStudyEvent } from "@/lib/study/studyEventLog";
import type { IdeaAction } from "@/lib/ai/ideaActionSchema";
import { resolveIdeaActionNoteId } from "@/lib/music/ideaActionResolve";
import { applyIntent, type Intent } from "@/lib/ai/intentRouter";
import { useGenerationConfigStore } from "@/store/useGenerationConfigStore";
import type { ScoreCorrection } from "@/lib/music/suggestionTypes";
import {
  RiffScoreSessionContext,
  type RiffScoreSessionHandles,
} from "@/context/RiffScoreSessionContext";
import { isTypingTarget } from "@/lib/ui/isTypingTarget";

const ENGINE_URL = "";

const INSPECTOR_DOCK_STORAGE_KEY = "hf-inspector-dock";
const INSPECTOR_FLOAT_POS_KEY = "hf-inspector-float-pos";

const FLOAT_INSPECTOR_DEFAULT_W = 380;
const FLOAT_INSPECTOR_DEFAULT_H = 560;
const FLOAT_INSPECTOR_MIN_W = 280;
const FLOAT_INSPECTOR_MIN_H = 320;

type InspectorFloatResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function clampInspectorFloatLayout(
  left: number,
  top: number,
  w: number,
  h: number,
): { left: number; top: number; width: number; height: number } {
  const pad = 8;
  const maxW = window.innerWidth - 2 * pad;
  const maxH = window.innerHeight - 2 * pad;
  const width = Math.max(FLOAT_INSPECTOR_MIN_W, Math.min(w, maxW));
  const height = Math.max(FLOAT_INSPECTOR_MIN_H, Math.min(h, maxH));
  const leftClamped = Math.min(Math.max(pad, left), window.innerWidth - width - pad);
  const topClamped = Math.min(Math.max(pad, top), window.innerHeight - height - pad);
  return { left: leftClamped, top: topClamped, width, height };
}

function applyFloatResizeDelta(
  edge: InspectorFloatResizeEdge,
  dx: number,
  dy: number,
  startLeft: number,
  startTop: number,
  startW: number,
  startH: number,
): { left: number; top: number; w: number; h: number } {
  let left = startLeft;
  let top = startTop;
  let w = startW;
  let h = startH;
  if (edge === "e" || edge === "ne" || edge === "se") w = startW + dx;
  if (edge === "w" || edge === "nw" || edge === "sw") {
    w = startW - dx;
    left = startLeft + dx;
  }
  if (edge === "s" || edge === "se" || edge === "sw") h = startH + dy;
  if (edge === "n" || edge === "ne" || edge === "nw") {
    h = startH - dy;
    top = startTop + dy;
  }
  return { left, top, w, h };
}

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
  const workspaceBaselineXml = useUploadStore((s) => s.workspaceBaselineXml);
  const resetWorkspaceToBaseline = useUploadStore((s) => s.resetWorkspaceToBaseline);
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
    requestSuggestion: requestRegionSuggestion,
  } = useTheoryInspector();
  const suggestionStore = useSuggestionStore();
  const pendingCorrections = suggestionStore.getPendingCorrections();

  // Build suggestion batch map for the panel
  const suggestionBatchMap = React.useMemo(() => {
    const map = new Map<
      string,
      {
        corrections: import("@/lib/music/suggestionTypes").ScoreCorrection[];
        summary: string;
        musicalAlternatives?: import("@/lib/music/suggestionTypes").MusicalAlternativeHint[];
      }
    >();
    for (const batch of suggestionStore.batches) {
      map.set(batch.id, {
        corrections: batch.corrections,
        summary: batch.summary,
        musicalAlternatives: batch.musicalAlternatives,
      });
    }
    return map;
  }, [suggestionStore.batches]);

  // Accept/reject correction handlers
  const handleAcceptCorrection = React.useCallback(
    (correctionId: string) => {
      // Flush any pending RiffScore edits into Zustand first — applying against a
      // stale `score` closure would otherwise overwrite the user's uncommitted
      // edits and look like a destructive undo (Iter2 §2).
      riffSessionRef.current?.flushToZustand();
      const live = useScoreStore.getState().score;
      if (!live) return;
      const allCorrections = suggestionStore.batches.flatMap((b) => b.corrections);
      const correction = allCorrections.find((c) => c.id === correctionId);
      if (!correction) return;
      logStudyEvent("suggestion_accepted", { correctionId });
      const nextScore = applySuggestion(live, correction, {
        allowRhythm: useTheoryInspectorStore.getState().allowRhythmInSuggestions,
      });
      applyScore(nextScore);
      suggestionStore.acceptCorrection(correctionId);
    },
    [applyScore, suggestionStore],
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
      riffSessionRef.current?.flushToZustand();
      const live = useScoreStore.getState().score;
      if (!live) return;
      const batch = suggestionStore.batches.find((b) => b.id === batchId);
      if (!batch) return;
      const pending = batch.corrections.filter(
        (c) => suggestionStore.correctionStatuses[c.id] === "pending",
      );
      if (pending.length === 0) return;
      logStudyEvent("suggestion_accept_all", { batchId });
      const nextScore = applySuggestions(live, pending, {
        allowRhythm: useTheoryInspectorStore.getState().allowRhythmInSuggestions,
      });
      applyScore(nextScore);
      suggestionStore.acceptAll(batchId);
    },
    [applyScore, suggestionStore],
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

  const [noteExplainToast, setNoteExplainToast] = React.useState<string | null>(null);

  const showInspectorToast = React.useCallback((message: string) => {
    setNoteExplainToast(message);
    window.setTimeout(() => setNoteExplainToast(null), 4000);
  }, []);

  const handleAcceptIdeaAction = React.useCallback(
    (action: IdeaAction) => {
      riffSessionRef.current?.flushToZustand();
      const live = useScoreStore.getState().score;
      if (!live) {
        showInspectorToast("Could not apply: no score loaded.");
        return;
      }
      const insight = useTheoryInspectorStore.getState().selectedNoteInsight;
      const resolvedNoteId = resolveIdeaActionNoteId(live, action, insight);
      if (!resolvedNoteId) {
        showInspectorToast(
          `Could not apply: note id "${action.noteId}" not in score. Re-open this note so the tutor sees NOTE_IDS_FOR_IDEA_ACTIONS, or use a summary that names the target staff (e.g. Clarinet).`,
        );
        return;
      }
      const found = getNoteById(live, resolvedNoteId);
      if (!found) {
        showInspectorToast("Could not apply: resolved note disappeared.");
        return;
      }
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
      applyScore(
        applySuggestion(live, correction, {
          allowRhythm: useTheoryInspectorStore.getState().allowRhythmInSuggestions,
        }),
      );
      const ins = useTheoryInspectorStore.getState().selectedNoteInsight;
      patchSelectedNoteInsight({
        ideaActionStatuses: {
          ...(ins?.ideaActionStatuses ?? {}),
          [action.id]: "accepted",
        },
      });
    },
    [applyScore, patchSelectedNoteInsight, showInspectorToast],
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

  const handleApplyIntent = React.useCallback(
    (msgId: string, intent: Intent) => {
      const cfgStore = useGenerationConfigStore.getState();
      const msg = useTheoryInspectorStore.getState().messages.find((m) => m.id === msgId);
      logStudyEvent("intent_applied", {
        action: intent.action,
      });
      const handled = applyIntent(intent, {
        setMood: (m) => cfgStore.setMood(m),
        setGenre: (g) => cfgStore.setGenre(g),
        setRhythmDensity: (v) => cfgStore.setRhythmDensity(v),
        setPickupBeats: (beats) => cfgStore.setPickupBeats(beats),
        regenerate: () => router.push("/document"),
        navigate: (path) => router.push(path),
      });
      if (!handled) {
        showInspectorToast("Could not apply that action yet — open Document to adjust manually.");
        return;
      }
      // Clear the INTENT from the message so the bubble collapses.
      if (msg) {
        useTheoryInspectorStore.getState().updateMessage(msgId, { intent: null });
      }
    },
    [router, showInspectorToast],
  );

  const handleDismissIntent = React.useCallback(
    (msgId: string) => {
      useTheoryInspectorStore.getState().updateMessage(msgId, { intent: null });
    },
    [],
  );

  const { cursor, setCursor, clearCursor } = useEditCursorStore();

  React.useEffect(() => {
    restoreFromStorage();
  }, [restoreFromStorage]);

  React.useEffect(() => {
    if (coachmarkTourActive || !generatedMusicXML) return;
    if (!isSandboxFirstVisitDone()) setSandboxIntroOpen(true);
  }, [coachmarkTourActive, generatedMusicXML]);

  React.useEffect(() => {
    if (generatedMusicXML || coachmarkTourActive) return;
    router.replace("/document");
  }, [generatedMusicXML, coachmarkTourActive, router]);

  // State for modals/panels — must be declared before handleToolSelect
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [layersPanelOpen, setLayersPanelOpen] = React.useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [sandboxIntroOpen, setSandboxIntroOpen] = React.useState(false);
  const [inspectorFabHintLoaded, setInspectorFabHintLoaded] = React.useState(false);
  const [inspectorFabHintDismissed, setInspectorFabHintDismissed] = React.useState(true);
  const [resetWorkspaceModalOpen, setResetWorkspaceModalOpen] = React.useState(false);
  const [hotkeysDialogOpen, setHotkeysDialogOpen] = React.useState(false);
  const [inspectorWidth, setInspectorWidth] = React.useState(380);
  const [inspectorDockMode, setInspectorDockMode] = React.useState<"sidebar" | "floating">("sidebar");
  const lastExplainedRef = React.useRef<{ noteId: string; at: number } | null>(null);
  /** Prevents runAudit on every score object identity change (RiffScore sync); audit once per inspector open. */
  const auditRunWhileInspectorOpenRef = React.useRef(false);

  const [exportModalMusicXML, setExportModalMusicXML] = React.useState<string | null>(null);
  const exportPreviewRef = React.useRef<HTMLDivElement | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);
  const notationMode = "edit" as const;
  const [showExpressiveSovereigntyCallout, setShowExpressiveSovereigntyCallout] = React.useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("hf-dismiss-expressive-sovereignty") !== "1",
  );

  const dismissInspectorFabHintCallout = React.useCallback(() => {
    try {
      dismissInspectorFabHint();
    } catch {
      /* ignore */
    }
    setInspectorFabHintDismissed(true);
  }, []);

  React.useEffect(() => {
    try {
      setInspectorFabHintDismissed(isInspectorFabHintDismissed());
    } catch {
      setInspectorFabHintDismissed(false);
    }
    setInspectorFabHintLoaded(true);
  }, []);

  React.useEffect(() => {
    try {
      if (localStorage.getItem(INSPECTOR_DOCK_STORAGE_KEY) === "floating") {
        setInspectorDockMode("floating");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const inspectorFloatWrapRef = React.useRef<HTMLDivElement | null>(null);
  const [inspectorFloatPos, setInspectorFloatPos] = React.useState<{ left: number; top: number } | null>(
    null,
  );
  const [inspectorFloatSize, setInspectorFloatSize] = React.useState({
    width: FLOAT_INSPECTOR_DEFAULT_W,
    height: FLOAT_INSPECTOR_DEFAULT_H,
  });
  const inspectorFloatPosRef = React.useRef(inspectorFloatPos);
  inspectorFloatPosRef.current = inspectorFloatPos;
  const inspectorFloatSizeRef = React.useRef(inspectorFloatSize);
  inspectorFloatSizeRef.current = inspectorFloatSize;

  const setInspectorDockModePersisted = React.useCallback(
    (mode: "sidebar" | "floating") => {
      if (mode === "floating") {
        setInspectorFloatSize((s) => ({ ...s, width: inspectorWidth }));
      } else {
        const fw = inspectorFloatSizeRef.current.width;
        setInspectorWidth(Math.max(280, Math.min(600, fw)));
      }
      setInspectorDockMode(mode);
      try {
        localStorage.setItem(INSPECTOR_DOCK_STORAGE_KEY, mode);
      } catch {
        /* ignore */
      }
    },
    [inspectorWidth],
  );

  const inspectorFloatDragRef = React.useRef<{
    pointerId: number;
    grabX: number;
    grabY: number;
  } | null>(null);
  const inspectorFloatPosDuringDragRef = React.useRef<{ left: number; top: number } | null>(null);
  const inspectorFloatResizeRef = React.useRef<{
    pointerId: number;
    edge: InspectorFloatResizeEdge;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    startW: number;
    startH: number;
  } | null>(null);
  const inspectorFloatLayoutAfterResizeRef = React.useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    if (inspectorDockMode !== "floating") return;
    try {
      const raw = localStorage.getItem(INSPECTOR_FLOAT_POS_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { left?: unknown; top?: unknown; width?: unknown; height?: unknown };
      if (
        typeof p.left === "number" &&
        typeof p.top === "number" &&
        Number.isFinite(p.left) &&
        Number.isFinite(p.top)
      ) {
        setInspectorFloatPos({ left: p.left, top: p.top });
      }
      setInspectorFloatSize((prev) => ({
        width:
          typeof p.width === "number" && Number.isFinite(p.width) && p.width >= FLOAT_INSPECTOR_MIN_W
            ? p.width
            : prev.width,
        height:
          typeof p.height === "number" && Number.isFinite(p.height) && p.height >= FLOAT_INSPECTOR_MIN_H
            ? p.height
            : prev.height,
      }));
    } catch {
      /* ignore */
    }
  }, [inspectorDockMode]);

  const persistInspectorFloatLayout = React.useCallback(
    (p: { left: number; top: number; width: number; height: number }) => {
      try {
        localStorage.setItem(INSPECTOR_FLOAT_POS_KEY, JSON.stringify(p));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const handleInspectorFloatHeaderPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (inspectorDockMode !== "floating") return;
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      const wrap = inspectorFloatWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const left0 = inspectorFloatPos?.left ?? rect.left;
      const top0 = inspectorFloatPos?.top ?? rect.top;
      if (inspectorFloatPos == null) {
        setInspectorFloatPos({ left: left0, top: top0 });
      }
      inspectorFloatDragRef.current = {
        pointerId: e.pointerId,
        grabX: e.clientX - left0,
        grabY: e.clientY - top0,
      };
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const onMove = (ev: PointerEvent) => {
        const d = inspectorFloatDragRef.current;
        if (!d || ev.pointerId !== d.pointerId) return;
        const w = wrap.offsetWidth;
        const h = wrap.offsetHeight;
        let left = ev.clientX - d.grabX;
        let top = ev.clientY - d.grabY;
        const pad = 8;
        left = Math.max(pad, Math.min(left, window.innerWidth - w - pad));
        top = Math.max(pad, Math.min(top, window.innerHeight - h - pad));
        const next = { left, top };
        inspectorFloatPosDuringDragRef.current = next;
        setInspectorFloatPos(next);
      };
      const onUp = (ev: PointerEvent) => {
        const d = inspectorFloatDragRef.current;
        if (!d || ev.pointerId !== d.pointerId) return;
        inspectorFloatDragRef.current = null;
        try {
          el.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        const last = inspectorFloatPosDuringDragRef.current;
        inspectorFloatPosDuringDragRef.current = null;
        if (last) {
          const { width, height } = inspectorFloatSizeRef.current;
          persistInspectorFloatLayout({ ...last, width, height });
        }
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    },
    [inspectorDockMode, inspectorFloatPos, persistInspectorFloatLayout],
  );

  const handleInspectorFloatResizePointerDown = React.useCallback(
    (edge: InspectorFloatResizeEdge) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (inspectorDockMode !== "floating") return;
      e.preventDefault();
      e.stopPropagation();
      const wrap = inspectorFloatWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const left0 = inspectorFloatPosRef.current?.left ?? rect.left;
      const top0 = inspectorFloatPosRef.current?.top ?? rect.top;
      if (inspectorFloatPosRef.current == null) {
        setInspectorFloatPos({ left: left0, top: top0 });
      }
      const { width: startW, height: startH } = inspectorFloatSizeRef.current;
      inspectorFloatResizeRef.current = {
        pointerId: e.pointerId,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: left0,
        startTop: top0,
        startW,
        startH,
      };
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const onMove = (ev: PointerEvent) => {
        const r = inspectorFloatResizeRef.current;
        if (!r || ev.pointerId !== r.pointerId) return;
        const dx = ev.clientX - r.startX;
        const dy = ev.clientY - r.startY;
        const raw = applyFloatResizeDelta(
          r.edge,
          dx,
          dy,
          r.startLeft,
          r.startTop,
          r.startW,
          r.startH,
        );
        const c = clampInspectorFloatLayout(raw.left, raw.top, raw.w, raw.h);
        inspectorFloatLayoutAfterResizeRef.current = c;
        setInspectorFloatPos({ left: c.left, top: c.top });
        setInspectorFloatSize({ width: c.width, height: c.height });
      };
      const onUp = (ev: PointerEvent) => {
        const r = inspectorFloatResizeRef.current;
        if (!r || ev.pointerId !== r.pointerId) return;
        inspectorFloatResizeRef.current = null;
        try {
          el.releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
        const laidOut = inspectorFloatLayoutAfterResizeRef.current;
        inspectorFloatLayoutAfterResizeRef.current = null;
        if (laidOut) persistInspectorFloatLayout(laidOut);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    },
    [inspectorDockMode, persistInspectorFloatLayout],
  );

  React.useEffect(() => {
    if (!isInspectorOpen || !inspectorFabHintLoaded) return;
    if (inspectorFabHintDismissed) return;
    dismissInspectorFabHintCallout();
  }, [isInspectorOpen, inspectorFabHintLoaded, inspectorFabHintDismissed, dismissInspectorFabHintCallout]);

  const openExportModal = React.useCallback(() => {
    const live = getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
    setExportModalMusicXML(live ? scoreToMusicXML(live) : generatedMusicXML);
    setIsExportModalOpen(true);
  }, [generatedMusicXML]);

  const downloadLiveXml = React.useCallback(() => {
    const live = getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
    if (!live) return;
    const blob = new Blob([scoreToMusicXML(live)], { type: "application/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "harmony-forge-score.xml";
    a.click();
    URL.revokeObjectURL(a.href);
  }, []);

  /**
   * Print the score alone. Temporarily tag <body> with `hf-printing-score`
   * so the new @media print rules bless only `ExportPrintRoot`; afterprint
   * clears the class. This guarantees the PDF/print output matches the
   * ExportModal's PNG preview (score only, no toolbar / palette / chrome).
   */
  const printScoreOnly = React.useCallback(() => {
    if (typeof window === "undefined") return;
    // Flush any pending RiffScore edits so the print root renders the latest
    // score — ExportPrintRoot subscribes to Zustand via <RiffScoreEditor>.
    getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
    document.body.classList.add("hf-printing-score");
    const cleanup = () => {
      document.body.classList.remove("hf-printing-score");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    // Defer to next microtask so the body class applies before the dialog.
    window.setTimeout(() => {
      window.print();
      // Fallback for environments that don't dispatch `afterprint` (Safari).
      window.setTimeout(cleanup, 1000);
    }, 50);
  }, []);

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
    if (!score) return;
    const ids =
      riffSessionRef.current?.getPitchGroupNoteIds() ?? new Set(selection.map((s) => s.noteId));
    if (ids.size === 0) return;
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

  const setSelectedPartClef = React.useCallback((clef: "treble" | "bass" | "alto" | "tenor") => {
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

    const sel0 = selection[0];
    if (sel0) {
      const part = score.parts.find((p) => p.id === sel0.partId);
      const measure = part?.measures[sel0.measureIndex];
      const slot = measure?.notes[sel0.noteIndex];
      // MuseScore / Noteflight: a selected rest is the insertion slot (replace in place), not after it.
      if (slot?.isRest && measure) {
        let beat = 0;
        for (let idx = 0; idx < sel0.noteIndex; idx++) {
          beat += noteBeats(measure.notes[idx]!);
        }
        return {
          partId: sel0.partId,
          measureIndex: sel0.measureIndex,
          noteIndex: sel0.noteIndex,
          beat,
        };
      }
    }

    if (cursor) {
      return {
        partId: cursor.partId,
        measureIndex: cursor.measureIndex,
        noteIndex: cursor.noteIndex,
        beat: cursor.beat,
      };
    }

    if (sel0) {
      return {
        partId: sel0.partId,
        measureIndex: sel0.measureIndex,
        noteIndex: sel0.noteIndex + 1,
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
      } else if (durationMap[toolId] && selection.length > 0) {
        riffSessionRef.current?.flushToZustand?.();
        const live = useScoreStore.getState().score;
        if (!live) return;
        const noteIds =
          riffSessionRef.current?.getPitchGroupNoteIds() ?? new Set(selection.map((s) => s.noteId));
        const next = setNoteDurations(live, noteIds, durationMap[toolId]);
        applyScore(next);
      } else if (durationMap[toolId]) {
        setActiveTool(toolId);
      } else if (toolId === "duration-rest-toggle" && selection.length > 0) {
        riffSessionRef.current?.flushToZustand?.();
        const live = useScoreStore.getState().score;
        if (!live) return;
        const noteIds =
          riffSessionRef.current?.getPitchGroupNoteIds() ?? new Set(selection.map((s) => s.noteId));
        applyScore(toggleNoteRests(live, noteIds));
      } else if (toolId === "duration-dotted" && selection.length > 0) {
        riffSessionRef.current?.flushToZustand?.();
        const live = useScoreStore.getState().score;
        if (!live) return;
        const noteIds =
          riffSessionRef.current?.getPitchGroupNoteIds() ?? new Set(selection.map((s) => s.noteId));
        const next = toggleNoteDots(live, noteIds);
        applyScore(next);
      } else if (toolId === "duration-tie") {
        toggleTieOnSelection();
      } else if (pitchHandlers[toolId] !== undefined) {
        const noteIds = riffSessionRef.current?.getTransposeTargetNoteIds?.() ?? new Set<string>();
        if (noteIds.size === 0) return;
        const live = useScoreStore.getState().score;
        if (!live) return;
        applyScore(transposeNotes(live, noteIds, pitchHandlers[toolId]));
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
        ["dynamics-piano", "dynamics-forte", "dynamics-cresc", "dynamics-decresc"].includes(toolId) &&
        selection.length > 0
      ) {
        riffSessionRef.current?.flushToZustand?.();
        const live = useScoreStore.getState().score;
        if (!live) return;
        const dynMap: Record<string, string> = {
          "dynamics-piano": "p",
          "dynamics-forte": "f",
          "dynamics-cresc": "crescendo",
          "dynamics-decresc": "decrescendo",
        };
        const noteIds =
          riffSessionRef.current?.getPitchGroupNoteIds() ?? new Set(selection.map((s) => s.noteId));
        const next = setNoteDynamics(live, noteIds, dynMap[toolId] ?? "p");
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
      } else if (toolId === "measure-clef-tenor") {
        setSelectedPartClef("tenor");
      } else if (toolId.startsWith("measure-change-key-") && score) {
        const raw = toolId.slice("measure-change-key-".length);
        const fifths = Number.parseInt(raw, 10);
        if (Number.isFinite(fifths) && fifths >= -7 && fifths <= 7) {
          const target = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
          const next = cloneScore(score);
          for (const part of next.parts) {
            const measure = part.measures[target];
            if (measure) measure.keySignature = fifths;
          }
          applyScore(next);
        }
      } else if (toolId.startsWith("measure-change-time-") && score) {
        const raw = toolId.slice("measure-change-time-".length);
        const match = raw.match(/^(\d+)-(\d+)$/);
        if (match) {
          const ts = `${match[1]}/${match[2]}`;
          const target = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
          const next = cloneScore(score);
          for (const part of next.parts) {
            const measure = part.measures[target];
            if (measure) measure.timeSignature = ts;
          }
          applyScore(next);
        }
      } else if (toolId.startsWith("measure-barline-") && score) {
        const style = toolId.slice("measure-barline-".length) as Parameters<typeof setMeasureBarline>[2];
        const target = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        applyScore(setMeasureBarline(score, target, style));
      } else if (toolId.startsWith("measure-repeat-") && score) {
        const kind = toolId.slice("measure-repeat-".length);
        const target = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        if (kind === "clear") {
          applyScore(setMeasureRepeatMark(score, target, null));
        } else if (["segno", "coda", "dc", "ds", "fine"].includes(kind)) {
          applyScore(
            setMeasureRepeatMark(
              score,
              target,
              kind as "segno" | "coda" | "dc" | "ds" | "fine",
            ),
          );
        }
      } else if (toolId === "measure-rehearsal-mark" && score) {
        const target = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        const text = window.prompt("Rehearsal mark:", "A");
        if (text !== null) {
          const next = cloneScore(score);
          for (const part of next.parts) {
            const measure = part.measures[target];
            if (measure) {
              if (text.trim() === "") delete measure.rehearsalMark;
              else measure.rehearsalMark = text.trim();
            }
          }
          applyScore(next);
        }
      } else if (toolId.startsWith("tempo-preset-") && score) {
        const kind = toolId.slice("tempo-preset-".length);
        const presets: Record<string, { text: string; bpm: number }> = {
          largo: { text: "Largo", bpm: 40 },
          adagio: { text: "Adagio", bpm: 66 },
          andante: { text: "Andante", bpm: 76 },
          moderato: { text: "Moderato", bpm: 108 },
          allegro: { text: "Allegro", bpm: 132 },
          presto: { text: "Presto", bpm: 168 },
        };
        const target = cursor?.measureIndex ?? selection[0]?.measureIndex ?? 0;
        if (kind === "custom") {
          const raw = window.prompt("Tempo BPM (quarter note):", String(score.bpm ?? 120));
          if (raw) {
            const bpm = Number.parseFloat(raw);
            if (Number.isFinite(bpm) && bpm > 0) {
              applyScore(setMeasureTempoText(score, target, `♩ = ${Math.round(bpm)}`, bpm));
            }
          }
        } else if (kind in presets) {
          const { text, bpm } = presets[kind]!;
          applyScore(setMeasureTempoText(score, target, `${text} ♩ = ${bpm}`, bpm));
        }
      } else if (toolId.startsWith("ornament-") && score && selection.length > 0) {
        const ornament = toolId.slice("ornament-".length);
        const noteIds = new Set(selection.map((s) => s.noteId));
        applyScore(setOrnament(score, noteIds, ornament));
      } else if (toolId.startsWith("tuplet-") && score && selection.length > 0) {
        const rest = toolId.slice("tuplet-".length);
        const noteIds = new Set(selection.map((s) => s.noteId));
        if (rest === "clear") {
          applyScore(setTuplet(score, noteIds, null));
        } else {
          const n = Number.parseInt(rest, 10);
          if (Number.isFinite(n) && n > 0) applyScore(setTuplet(score, noteIds, n));
        }
      } else if (
        (toolId === "line-slur" ||
          toolId === "line-cresc-hairpin" ||
          toolId === "line-decresc-hairpin" ||
          toolId === "line-8va" ||
          toolId === "line-8vb") &&
        score &&
        selection.length > 0
      ) {
        const kindMap: Record<string, string> = {
          "line-slur": "slur",
          "line-cresc-hairpin": "cresc-hairpin",
          "line-decresc-hairpin": "decresc-hairpin",
          "line-8va": "8va",
          "line-8vb": "8vb",
        };
        const noteIds = new Set(selection.map((s) => s.noteId));
        applyScore(setLineOnSelection(score, noteIds, kindMap[toolId] ?? "slur"));
      } else if (toolId === "pitch-accidental-dsharp" && score && selection.length > 0) {
        applyAccidentalToSelection("#");
        applyAccidentalToSelection("#");
      } else if (toolId === "pitch-accidental-dflat" && score && selection.length > 0) {
        applyAccidentalToSelection("b");
        applyAccidentalToSelection("b");
      } else if (
        (toolId === "dynamics-ppp" ||
          toolId === "dynamics-pp" ||
          toolId === "dynamics-mp" ||
          toolId === "dynamics-mf" ||
          toolId === "dynamics-f" ||
          toolId === "dynamics-ff" ||
          toolId === "dynamics-fff" ||
          toolId === "dynamics-sfz" ||
          toolId === "dynamics-fp") &&
        selection.length > 0
      ) {
        riffSessionRef.current?.flushToZustand?.();
        const live = useScoreStore.getState().score;
        if (!live) return;
        const map: Record<string, string> = {
          "dynamics-ppp": "ppp",
          "dynamics-pp": "pp",
          "dynamics-mp": "mp",
          "dynamics-mf": "mf",
          "dynamics-f": "f",
          "dynamics-ff": "ff",
          "dynamics-fff": "fff",
          "dynamics-sfz": "sfz",
          "dynamics-fp": "fp",
        };
        const noteIds =
          riffSessionRef.current?.getPitchGroupNoteIds() ?? new Set(selection.map((s) => s.noteId));
        applyScore(setNoteDynamics(live, noteIds, map[toolId] ?? "mp"));
      } else if (toolId === "artic-fermata" && score && selection.length > 0) {
        const noteIds = new Set(selection.map((s) => s.noteId));
        applyScore(addArticulation(score, noteIds, "fermata"));
      } else if (
        (toolId === "breath-mark" || toolId === "breath-caesura") &&
        score &&
        selection.length > 0
      ) {
        const noteIds = new Set(selection.map((s) => s.noteId));
        applyScore(
          addArticulation(
            score,
            noteIds,
            toolId === "breath-mark" ? "breath-mark" : "caesura",
          ),
        );
      } else if (toolId === "text-lyrics" && score && selection.length > 0) {
        const text = window.prompt("Lyric syllable:");
        if (text !== null) {
          const noteIds = new Set(selection.map((s) => s.noteId));
          applyScore(setNoteLyric(score, noteIds, text.trim() === "" ? null : text));
        }
      } else if (toolId === "text-chord-symbol" && score && selection.length > 0) {
        const text = window.prompt("Chord symbol (e.g. Cmaj7):");
        if (text !== null) {
          const noteIds = new Set(selection.map((s) => s.noteId));
          applyScore(setNoteChordSymbol(score, noteIds, text.trim() === "" ? null : text));
        }
      } else if (toolId === "score-copy") {
        const live = getLiveScoreAfterFlush(riffSessionRef.current, () => useScoreStore.getState().score);
        if (live) navigator.clipboard?.writeText(scoreToMusicXML(live));
      } else if (toolId === "score-print") {
        printScoreOnly();
      } else if (toolId === "score-export-xml") {
        downloadLiveXml();
      } else if (toolId === "score-save") {
        downloadLiveXml();
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
    [score, selection, deleteSelection, clearSelection, applyScore, setActiveTool, openExportModal, setLayersPanelOpen, cursor, resolveInsertionTarget, activeTool, toggleTieOnSelection, applyAccidentalToSelection, annotateSelection, setMeasureTimeSignature, setMeasureKeySignature, setSelectedPartClef, printScoreOnly, downloadLiveXml]
  );

  const handleToolbarAction = React.useCallback(
    (toolId: string) => {
      handleToolSelect(toolId);
      return true;
    },
    [handleToolSelect],
  );

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target);
      const keyLower = e.key.toLowerCase();
      const allowEdit = notationMode === "edit";

      if (!typing) {
        if (e.key === "Escape") {
          riffSessionRef.current?.editorDeselectAll?.();
          clearSelection();
        }
        if (allowEdit && (e.key === "Delete" || e.key === "Backspace")) {
          if (selection.length > 0 && score) {
            e.preventDefault();
            e.stopPropagation();
            handleToolSelect("edit-delete");
          }
        }
        if (allowEdit && (e.metaKey || e.ctrlKey) && keyLower === "z") {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (e.shiftKey) riffSessionRef.current?.editorRedo();
          else riffSessionRef.current?.editorUndo();
          return;
        }
        if (
          allowEdit &&
          ((e.metaKey || e.ctrlKey) && keyLower === "y")
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();
          riffSessionRef.current?.editorRedo();
          return;
        }
        if (allowEdit && (e.metaKey || e.ctrlKey) && keyLower === "c") {
          if (selection.length > 0 && score) {
            e.preventDefault();
            e.stopPropagation();
            handleToolSelect("edit-copy");
          }
        }
        if (allowEdit && (e.metaKey || e.ctrlKey) && keyLower === "x") {
          if (selection.length > 0 && score) {
            e.preventDefault();
            e.stopPropagation();
            handleToolSelect("edit-cut");
          }
        }
        if (allowEdit && (e.metaKey || e.ctrlKey) && keyLower === "v") {
          if (getClipboard().length > 0 && score) {
            e.preventDefault();
            e.stopPropagation();
            handleToolSelect("edit-paste");
          }
        }
        if (allowEdit && (e.metaKey || e.ctrlKey) && keyLower === "a" && score) {
          e.preventDefault();
          e.stopPropagation();
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
          riffSessionRef.current?.editorSelectAll?.();
        }
      }

      // 2g.3: MuseScore-style keyboard shortcuts (when not typing in a field/editor text)
      if (typing) return;
      if (e.key === "F9" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsPaletteOpen((open) => !open);
      }
      if (!allowEdit) return;
      if (!e.metaKey && !e.ctrlKey && !e.altKey && keyLower === "r" && score) {
        e.preventDefault();
        setActiveTool(activeTool === "mode-repitch" ? "duration-quarter" : "mode-repitch");
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey && keyLower === "n") {
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
      const bracketDec = e.key === "[" || e.code === "BracketLeft";
      const bracketInc = e.key === "]" || e.code === "BracketRight";
      if (bracketDec || bracketInc) {
        e.preventDefault();
        const currentIdx = DURATION_TOOL_ORDER.findIndex((tool) => tool === activeTool);
        const startIdx = currentIdx >= 0 ? currentIdx : 3; // default quarter
        const nextIdx = bracketDec
          ? Math.max(0, startIdx - 1)
          : Math.min(DURATION_TOOL_ORDER.length - 1, startIdx + 1);
        setActiveTool(DURATION_TOOL_ORDER[nextIdx]);
      }
      const isDigitZero = e.key === "0" || e.code === "Numpad0";
      if (isDigitZero && score) {
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
          // Noteflight/MuseScore parity: if the insertion target is a rest,
          // repitch that rest in-place (same duration) rather than inserting
          // a new note after it.
          const part = score.parts.find((p) => p.id === partId);
          const measure = part?.measures[measureIndex];
          const restAtTarget =
            measure && measure.notes[noteIndex]?.isRest
              ? measure.notes[noteIndex]
              : null;
          if (restAtTarget) {
            e.preventDefault();
            const next = restsToNotes(score, new Set([restAtTarget.id]), key);
            applyScore(next);
            const nextBeat = (target?.beat ?? 0) + noteBeats(restAtTarget);
            setCursor({
              partId,
              measureIndex,
              beat: nextBeat,
              noteIndex: noteIndex + 1,
            });
            return;
          }
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
      // Chromatic ↑/↓ (⌘/Ctrl = octave): match toolbar +/- semitone. getTransposeTargetNoteIds
      // flushes RS→Zustand first — transpose from store score, not React closure (can lag one tick).
      if (score && (e.code === "ArrowUp" || e.code === "ArrowDown") && !e.altKey) {
        const noteIds = riffSessionRef.current?.getTransposeTargetNoteIds?.() ?? new Set<string>();
        if (noteIds.size > 0) {
          e.preventDefault();
          e.stopImmediatePropagation();
          const isOctave = e.metaKey || e.ctrlKey;
          const up = e.code === "ArrowUp";
          const delta = isOctave ? (up ? 12 : -12) : up ? 1 : -1;
          const liveScore = useScoreStore.getState().score;
          if (!liveScore) return;
          applyScore(transposeNotes(liveScore, noteIds, delta));
          return;
        }
      }
      if (selection.length === 0 && score) {
        if (e.code === "ArrowLeft") {
          e.preventDefault();
          moveCursorHorizontally(-1);
          return;
        }
        if (e.code === "ArrowRight") {
          e.preventDefault();
          moveCursorHorizontally(1);
          return;
        }
        if ((isNoteInputMode || isRepitchMode) && e.code === "ArrowUp") {
          e.preventDefault();
          moveCursorVertically(-1);
          return;
        }
        if ((isNoteInputMode || isRepitchMode) && e.code === "ArrowDown") {
          e.preventDefault();
          moveCursorVertically(1);
        }
      }
      if (selection.length > 0 && score) {
        const key = e.key.toUpperCase();
        let digit: string | null = null;
        if (/^[1-9]$/.test(key)) digit = key;
        else {
          const row = /^Digit([1-9])$/.exec(e.code);
          if (row) digit = row[1]!.toUpperCase();
          else {
            const pad = /^Numpad([1-9])$/.exec(e.code);
            if (pad) digit = pad[1]!.toUpperCase();
          }
        }
        if (digit) {
          const durMap: Record<string, string> = {
            "1": "duration-32nd",
            "2": "duration-16th",
            "3": "duration-eighth",
            "4": "duration-quarter",
            "5": "duration-half",
            "6": "duration-whole",
          };
          const tool = durMap[digit];
          if (tool) {
            e.preventDefault();
            handleToolSelect(tool);
          }
        } else if (["A", "B", "C", "D", "E", "F", "G"].includes(key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          const noteIds =
            riffSessionRef.current?.getPitchGroupNoteIds() ?? new Set(selection.map((s) => s.noteId));
          applyScore(setPitchByLetter(score, noteIds, key));
        } else if (e.key === "," || e.code === "Comma") {
          e.preventDefault();
          handleToolSelect("duration-tie");
        } else if (e.key === "+" || e.code === "NumpadAdd") {
          e.preventDefault();
          handleToolSelect("pitch-accidental-sharp");
        } else if (e.key === "-" || e.key === "\u2212" || e.code === "Minus" || e.code === "NumpadSubtract") {
          e.preventDefault();
          handleToolSelect("pitch-accidental-flat");
        } else if (e.key === "=" || e.code === "NumpadEqual") {
          e.preventDefault();
          handleToolSelect("pitch-accidental-natural");
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // Hoisting caveat: `isNoteInputMode`, `moveCursorHorizontally`, and
    // `moveCursorVertically` are declared after this effect (useCallback).
    // They are referenced inside the keydown handler via closure; the listener
    // fires after render so the closure sees the current values. Including
    // them in deps would require reordering the whole component and offers no
    // user-visible benefit — the handler only reads the latest state at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    notationMode,
    setIsPaletteOpen,
  ]);

  React.useEffect(() => {
    setShowOnboarding(!isOnboardingComplete());
  }, []);

  const hydrateSandboxFromMusicXml = React.useCallback(
    (xml: string) => {
      const parsed = parseMusicXML(xml);
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
    },
    [setScore, setSelection, clearCursor],
  );

  React.useEffect(() => {
    if (!generatedMusicXML) {
      setScore(null);
      setSelection([]);
      clearCursor();
      useTheoryInspectorStore.getState().clearGenerationBaseline();
      return;
    }
    hydrateSandboxFromMusicXml(generatedMusicXML);
  }, [generatedMusicXML, hydrateSandboxFromMusicXml, setScore, setSelection, clearCursor]);

  const scoreForCanvas = score ?? null;

  const isResizing = React.useRef(false);
  const startX = React.useRef(0);
  const startWidth = React.useRef(380);

  const handleResizeStart = React.useCallback(
    (e: React.MouseEvent) => {
      if (inspectorDockMode === "floating") return;
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = inspectorWidth;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    },
    [inspectorWidth, inspectorDockMode],
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
  const isRepitchMode = activeTool === "mode-repitch";

  const handleRestInputCommit = React.useCallback(
    (sel: NoteSelection, pitch: string) => {
      if (!score) return;
      const part = score.parts.find((p) => p.id === sel.partId);
      const measure = part?.measures[sel.measureIndex];
      const slot = measure?.notes[sel.noteIndex];
      const duration = slot?.isRest ? slot.duration : durationForInput;
      const dots = slot?.isRest ? slot.dots : undefined;
      applyScore(
        insertNote(score, sel.partId, sel.measureIndex, sel.noteIndex, {
          pitch,
          duration,
          dots,
          isRest: false,
        }),
      );
      clearSelection();
    },
    [score, applyScore, durationForInput, clearSelection],
  );

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
    (measureIndex: number, partId?: string) => {
      if (!score) return;
      const { lines, noteIds } = partId
        ? buildMeasurePartFocusFacts(score, measureIndex, partId)
        : buildMeasureFocusFacts(score, measureIndex);
      setInspectorScoreFocus({
        kind: "measure",
        measureIndex,
        ...(partId ? { partId } : {}),
        evidenceLines: lines,
        noteIds,
      });
    },
    [score, setInspectorScoreFocus],
  );

  const handleRegenerateHarmonyForRange = React.useCallback(
    async (startMeasure: number, endMeasure: number) => {
      riffSessionRef.current?.flushToZustand();
      const live = useScoreStore.getState().score;
      if (!live || live.parts.length <= 1) {
        setNoteExplainToast("Add harmony parts first, or generate from Document.");
        window.setTimeout(() => setNoteExplainToast(null), 4000);
        return;
      }
      const start = Math.min(startMeasure, endMeasure);
      const end = Math.max(startMeasure, endMeasure);
      const cfg = useGenerationConfigStore.getState();
      const xml = scoreToMusicXML(live);
      try {
        const res = await fetch("/api/generate-harmony-range", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            musicXml: xml,
            startMeasure: start,
            endMeasure: end,
            config: {
              mood: cfg.mood,
              genre: "classical",
              rhythmDensity: cfg.rhythmDensity,
              bassRhythmMode: cfg.bassRhythmMode,
              instruments: cfg.instruments,
              preferInferredChords: cfg.preferInferredChords,
              pickupBeats: cfg.pickupBeats ?? undefined,
            },
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          setNoteExplainToast(
            typeof err.error === "string" ? err.error : `Harmony regenerate failed (${res.status})`,
          );
          window.setTimeout(() => setNoteExplainToast(null), 5000);
          return;
        }
        const outXml = await res.text();
        const addon = parseMusicXML(outXml);
        if (!addon) {
          setNoteExplainToast("Could not parse generated harmony slice.");
          window.setTimeout(() => setNoteExplainToast(null), 4000);
          return;
        }
        const merged = spliceHarmonyMeasuresFromAddonScore(live, addon, start);
        if (!merged.ok) {
          setNoteExplainToast(merged.reason);
          window.setTimeout(() => setNoteExplainToast(null), 6000);
          return;
        }
        applyScore(merged.score);
        riffSessionRef.current?.editorDeselectAll?.();
        clearSelection();
        const focusAfter = useTheoryInspectorStore.getState().inspectorScoreFocus;
        if (focusAfter?.kind === "measure") {
          const s = useScoreStore.getState().score;
          if (s) {
            const { lines, noteIds } = focusAfter.partId
              ? buildMeasurePartFocusFacts(s, focusAfter.measureIndex, focusAfter.partId)
              : buildMeasureFocusFacts(s, focusAfter.measureIndex);
            setInspectorScoreFocus({
              ...focusAfter,
              evidenceLines: lines,
              noteIds,
            });
          }
        }
        if (merged.partialMerge && merged.skippedHarmonyPartNames?.length) {
          setNoteExplainToast(
            `Harmony updated for bars ${start + 1}–${end + 1}; unchanged staves: ${merged.skippedHarmonyPartNames.join(", ")}`,
          );
          window.setTimeout(() => setNoteExplainToast(null), 6000);
        }
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
      } catch {
        setNoteExplainToast("Harmony regenerate request failed.");
        window.setTimeout(() => setNoteExplainToast(null), 4000);
      }
    },
    [applyScore, clearSelection, setInspectorScoreFocus],
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
      | { kind: "measure"; measureIndex: number; partId?: string }
      | { kind: "part"; staffIndex: number }) => {
      if (region.kind === "measure") {
        handleInspectorSelectMeasure(region.measureIndex, region.partId);
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

  const runInspectorNoteExplain = React.useCallback(
    (sel: NoteSelection) => {
      if (!isInspectorOpen || !score) return;
      const now = Date.now();
      const last = lastExplainedRef.current;
      if (last && last.noteId === sel.noteId && now - last.at < 1200) {
        return;
      }
      lastExplainedRef.current = { noteId: sel.noteId, at: now };
      void explainGeneratedNote(score, sel.noteId, sel.partId).then((ok) => {
        if (ok) return;
        setNoteExplainToast("Couldn’t open a note explanation for this click.");
        window.setTimeout(() => setNoteExplainToast(null), 4000);
      });
    },
    [isInspectorOpen, score, explainGeneratedNote],
  );

  const handleEditorSelectionChange = React.useCallback(
    (sels: NoteSelection[]) => {
      setSelection(sels);
      if (sels.length === 1) runInspectorNoteExplain(sels[0]!);
    },
    [setSelection, runInspectorNoteExplain],
  );

  const handleScoreNoteClick = React.useCallback(
    (sel: NoteSelection, shiftKey: boolean) => {
      toggleNoteSelection(sel, shiftKey);
      runInspectorNoteExplain(sel);
    },
    [toggleNoteSelection, runInspectorNoteExplain],
  );

  const clearScoreSelection = React.useCallback(() => {
    riffSessionRef.current?.editorDeselectAll?.();
    clearSelection();
    setInspectorScoreFocus(null);
  }, [clearSelection, setInspectorScoreFocus]);

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
        // Close the export dialog first so only the print root is captured.
        setIsExportModalOpen(false);
        window.setTimeout(() => printScoreOnly(), 50);
        return;
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
          const dataUrl = await toPng(root, {
            pixelRatio: 2,
            backgroundColor: "#F8F3EA",
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
        const chartRes = await fetch(`/api/export-chord-chart`, { method: "POST", body: fd });
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
      <SandboxHeader
        onExportClick={openExportModal}
        showResetWorkspace={Boolean(workspaceBaselineXml)}
        onResetWorkspaceClick={() => setResetWorkspaceModalOpen(true)}
        onHotkeysClick={() => setHotkeysDialogOpen(true)}
      />
      <AudioUnlockBanner />
      {noteExplainToast && (
        <div
          className="hf-toast-animate hf-print-hide fixed bottom-4 left-1/2 -translate-x-1/2 z-[180] px-4 py-2.5 rounded-xl font-mono text-xs max-w-md text-center shadow-[0_8px_30px_rgba(45,24,23,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] border backdrop-blur-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--hf-panel-bg) 92%, transparent)",
            color: "var(--hf-text-primary)",
            borderColor: "color-mix(in srgb, var(--hf-detail) 55%, transparent)",
          }}
          role="status"
        >
          {noteExplainToast}
        </div>
      )}

      {!reviewerStudyArm && score && score.parts.length > 1 && showExpressiveSovereigntyCallout && (
        <div
          className="hf-banner-animate hf-print-hide flex flex-wrap items-start justify-between gap-2 px-4 py-2.5 border-b"
          style={{
            backgroundColor: "color-mix(in srgb, var(--hf-surface) 82%, var(--hf-bg))",
            borderColor: "color-mix(in srgb, var(--hf-detail) 45%, transparent)",
          }}
        >
          <p
            className="font-mono text-[11px] sm:text-xs max-w-[52rem] leading-snug font-medium"
            style={{
              color: "var(--hf-text-primary)",
              textShadow:
                "0 1px 2px color-mix(in srgb, var(--hf-bg) 55%, transparent)",
            }}
          >
            <strong className="font-semibold">Expressive sovereignty:</strong> HarmonyForge fills in{" "}
            <strong className="font-semibold">chord framework</strong> only—phrasing, dynamics, and articulation stay
            yours. Use the <strong className="font-semibold">Notation (beta)</strong> panel (F9) to layer expression
            after harmony.
          </p>
          <button
            type="button"
            className="hf-pressable shrink-0 font-mono text-[11px] underline underline-offset-2 opacity-90 hover:opacity-100 rounded px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-bg)]"
            style={{ color: "var(--hf-text-primary)" }}
            onClick={() => {
              try {
                localStorage.setItem("hf-dismiss-expressive-sovereignty", "1");
              } catch {
                // ignore
              }
              setShowExpressiveSovereigntyCallout(false);
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left column */}
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          data-coachmark="step-3"
        >
          {/* RiffScore editor — includes its own toolbar, score canvas, and playback */}
          <div className="hf-sandbox-print-target relative flex-1 min-h-0 overflow-hidden">
            <ScoreCanvas
              className="w-full h-full"
              score={scoreForCanvas}
              showViolations={isInspectorOpen}
              onCanvasClick={clearScoreSelection}
              selection={selection}
              onNoteClick={handleScoreNoteClick}
              onEditorSelectionChange={handleEditorSelectionChange}
              pendingCorrections={pendingCorrections}
              onAcceptCorrection={handleAcceptCorrection}
              onRejectCorrection={handleRejectCorrection}
              issueHighlights={isInspectorOpen ? issueHighlights : []}
              noteInspectionEnabled={isInspectorOpen}
              enableScoreEditing={notationMode === "edit"}
              focusHighlightNoteIds={
                isInspectorOpen ? inspectorFocusHighlightNoteIds : []
              }
              onInspectorSelectMeasure={
                scoreForCanvas ? handleInspectorSelectMeasure : undefined
              }
              onInspectorSelectPart={
                scoreForCanvas ? handleInspectorSelectPart : undefined
              }
              onInspectorInferredRegion={
                scoreForCanvas ? handleInspectorInferredRegion : undefined
              }
              onRiffScoreSessionReady={handleRiffScoreSessionReady}
              noteInputPitchLabelEnabled={isNoteInputMode || isRepitchMode}
              onPaletteSymbolDrop={(toolId) => {
                handleToolSelect(toolId);
              }}
              onToolbarAction={handleToolbarAction}
              onToolbarPrint={printScoreOnly}
              onRestInputCommit={handleRestInputCommit}
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

            <div className="hf-print-hide absolute bottom-[28px] left-[28px] z-50">
              <ConfigurationBackFAB />
            </div>
            {/* ChatFAB — shown only when inspector is closed */}
            {!isInspectorOpen && (
              <div className="hf-print-hide absolute bottom-[28px] right-[28px] z-50 flex flex-col items-end gap-0">
                {inspectorFabHintLoaded &&
                  !inspectorFabHintDismissed &&
                  Boolean(generatedMusicXML) &&
                  Boolean(score) &&
                  !coachmarkTourActive &&
                  !sandboxIntroOpen && (
                    <TheoryInspectorFabHint onDismiss={dismissInspectorFabHintCallout} />
                  )}
                <ChatFAB onClick={() => setIsInspectorOpen(true)} />
              </div>
            )}
            {/* Palette panel toggle — shown when the panel is hidden (edit mode only) */}
            {!isPaletteOpen && notationMode === "edit" && (
              <button
                type="button"
                onClick={() => setIsPaletteOpen(true)}
                title="Show notation panel (F9)"
                aria-label="Show notation panel (beta)"
                className="hf-print-hide hf-pressable absolute top-[72px] right-[16px] z-[70] flex items-center gap-1.5 h-[32px] px-3 rounded-[6px] border border-[var(--hf-detail)] bg-[var(--hf-panel-bg)] shadow-sm hover:shadow-md hover:border-[var(--hf-accent)] hover:bg-[color-mix(in_srgb,var(--hf-accent)_8%,var(--hf-panel-bg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-canvas-bg)]"
              >
                <PaletteIcon className="w-[14px] h-[14px]" style={{ color: "var(--hf-text-primary)" }} />
                <span className="font-mono text-[11px]" style={{ color: "var(--hf-text-primary)" }}>
                  Notation (beta)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Middle column: Palette panel */}
        {isPaletteOpen && notationMode === "edit" && (
          <SandboxPalettePanel
            className="hf-print-hide"
            hasSelection={selection.length > 0}
            onActivate={(toolId) => handleToolSelect(toolId)}
            onClose={() => setIsPaletteOpen(false)}
          />
        )}

        {/* Theory Inspector — sidebar (resizable) or floating card */}
        {isInspectorOpen && (
          <div
            ref={inspectorDockMode === "floating" ? inspectorFloatWrapRef : undefined}
            data-coachmark="step-4"
            className={
              inspectorDockMode === "floating"
                ? `hf-print-hide hf-inspector-enter-float fixed z-[100] flex flex-col rounded-[6px] overflow-visible shadow-2xl border${
                    inspectorFloatPos == null ? " bottom-5 right-5" : ""
                  }`
                : "hf-print-hide hf-inspector-enter-sidebar relative shrink-0 h-full overflow-hidden flex"
            }
            style={{
              width: inspectorDockMode === "floating" ? inspectorFloatSize.width : inspectorWidth,
              height: inspectorDockMode === "floating" ? inspectorFloatSize.height : undefined,
              borderColor: "var(--hf-detail)",
              backgroundColor: "var(--hf-panel-bg)",
              ...(inspectorDockMode === "floating" && inspectorFloatPos != null
                ? {
                    left: inspectorFloatPos.left,
                    top: inspectorFloatPos.top,
                    right: "auto",
                    bottom: "auto",
                  }
                : {}),
            }}
          >
            {inspectorDockMode === "floating" && (
              <>
                <div
                  className="absolute -top-1.5 left-4 right-4 h-3 z-[110] cursor-ns-resize touch-none rounded-sm hover:bg-[color-mix(in_srgb,var(--hf-accent)_18%,transparent)]"
                  onPointerDown={handleInspectorFloatResizePointerDown("n")}
                  title="Resize height"
                  role="separator"
                  aria-orientation="horizontal"
                />
                <div
                  className="absolute -bottom-1.5 left-4 right-4 h-3 z-[110] cursor-ns-resize touch-none rounded-sm hover:bg-[color-mix(in_srgb,var(--hf-accent)_18%,transparent)]"
                  onPointerDown={handleInspectorFloatResizePointerDown("s")}
                  title="Resize height"
                  role="separator"
                  aria-orientation="horizontal"
                />
                <div
                  className="absolute -left-1.5 top-4 bottom-4 w-3 z-[110] cursor-ew-resize touch-none rounded-sm hover:bg-[color-mix(in_srgb,var(--hf-accent)_18%,transparent)]"
                  onPointerDown={handleInspectorFloatResizePointerDown("w")}
                  title="Resize width"
                  role="separator"
                  aria-orientation="vertical"
                />
                <div
                  className="absolute -right-1.5 top-4 bottom-4 w-3 z-[110] cursor-ew-resize touch-none rounded-sm hover:bg-[color-mix(in_srgb,var(--hf-accent)_18%,transparent)]"
                  onPointerDown={handleInspectorFloatResizePointerDown("e")}
                  title="Resize width"
                  role="separator"
                  aria-orientation="vertical"
                />
                <div
                  className="absolute -left-1 -top-1 z-[110] h-4 w-4 cursor-nwse-resize touch-none"
                  onPointerDown={handleInspectorFloatResizePointerDown("nw")}
                  title="Resize"
                  aria-hidden
                />
                <div
                  className="absolute -right-1 -top-1 z-[110] h-4 w-4 cursor-nesw-resize touch-none"
                  onPointerDown={handleInspectorFloatResizePointerDown("ne")}
                  title="Resize"
                  aria-hidden
                />
                <div
                  className="absolute -left-1 -bottom-1 z-[110] h-4 w-4 cursor-nesw-resize touch-none"
                  onPointerDown={handleInspectorFloatResizePointerDown("sw")}
                  title="Resize"
                  aria-hidden
                />
                <div
                  className="absolute -right-1 -bottom-1 z-[110] h-4 w-4 cursor-nwse-resize touch-none"
                  onPointerDown={handleInspectorFloatResizePointerDown("se")}
                  title="Resize"
                  aria-hidden
                />
              </>
            )}
            {inspectorDockMode === "sidebar" && (
              <div
                className="absolute left-0 top-0 bottom-0 w-[5px] cursor-col-resize z-10 group"
                onMouseDown={handleResizeStart}
                title="Drag to resize"
              >
                <div
                  className="absolute left-[2px] top-[50%] -translate-y-[50%] w-[1px] h-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "var(--hf-accent)" }}
                />
              </div>
            )}

            <div
              className={
                inspectorDockMode === "floating"
                  ? "flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden rounded-[6px] h-full"
                  : "contents"
              }
            >
              <TheoryInspectorPanel
                className={
                  inspectorDockMode === "floating" ? "h-full min-h-0 flex-1" : "h-full flex-1"
                }
                inspectorDockMode={inspectorDockMode}
                onInspectorDockModeChange={setInspectorDockModePersisted}
                floatingHeaderDrag={
                  inspectorDockMode === "floating"
                    ? {
                        onPointerDown: handleInspectorFloatHeaderPointerDown,
                        className: "cursor-grab active:cursor-grabbing select-none",
                        title:
                          "Drag header to move. Drag edges or corners to resize. Dock, Float, and Close still click normally.",
                      }
                    : undefined
                }
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
              onClose={() => setIsInspectorOpen(false)}
              suggestionBatches={suggestionBatchMap}
              correctionStatuses={suggestionStore.correctionStatuses}
              onAcceptCorrection={handleAcceptCorrection}
              onRejectCorrection={handleRejectCorrection}
              onAcceptAllCorrections={handleAcceptAll}
              onRejectAllCorrections={handleRejectAll}
              onRequestStylist={() => {
                void requestRegionSuggestion();
              }}
              onExplainMore={(msgId) => explainViolationMore(msgId)}
              onSuggestFix={
                score
                  ? (msgId) => suggestFixForViolation(score, msgId)
                  : undefined
              }
              onAcceptIdeaAction={handleAcceptIdeaAction}
              onRejectIdeaAction={handleRejectIdeaAction}
              onStarterPromptClick={(prompt) => {
                void sendInspectorMessage(prompt);
              }}
              onEditFocusedRegion={
                score
                  ? (payload) => {
                      if (payload.scope === "measure") {
                        const { startMeasure, endMeasure } = measureRangeForLocalizedHarmonyRegenerate(
                          useToolStore.getState().selection,
                          payload.measureIndex,
                        );
                        void handleRegenerateHarmonyForRange(startMeasure, endMeasure);
                      }
                      void requestRegionSuggestion(score);
                    }
                  : undefined
              }
              onApplyIntent={handleApplyIntent}
              onDismissIntent={handleDismissIntent}
              editorSelection={selection}
              />
            </div>
          </div>
        )}
      </div>

      <AppFooterStrip end={<StudyLogExportBar />} />

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

      {/* Hidden print root — only visible when body.hf-printing-score is active. */}
      <ExportPrintRoot score={scoreForCanvas} />

      <OnboardingOverlay open={sandboxIntroOpen} onClose={() => setSandboxIntroOpen(false)} />
      <SandboxHotkeysDialog isOpen={hotkeysDialogOpen} onClose={() => setHotkeysDialogOpen(false)} />
      <WorkspaceResetModal
        open={resetWorkspaceModalOpen}
        onCancel={() => setResetWorkspaceModalOpen(false)}
        onConfirm={() => {
          setResetWorkspaceModalOpen(false);
          resetWorkspaceToBaseline();
          const xml = useUploadStore.getState().workspaceBaselineXml;
          if (xml) hydrateSandboxFromMusicXml(xml);
        }}
      />

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
