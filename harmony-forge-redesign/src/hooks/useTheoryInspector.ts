"use client";

import { useCallback, useContext, useEffect, useRef } from "react";
import { RiffScoreSessionContext } from "@/context/RiffScoreSessionContext";
import { useScoreStore } from "@/store/useScoreStore";
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";
import type { TheoryInspectorMessage } from "@/components/organisms/TheoryInspectorPanel";
import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  getViolationLabel,
  type ViolationKey,
} from "@/lib/ai/taxonomyIndex";
import { DEFAULT_EXPLANATION_LEVEL } from "@/lib/ai/explanationLevel";
import type {
  NoteInsight,
  NoteInsightKind,
  ValidationResult,
  ValidationViolations,
} from "@/store/useTheoryInspectorStore";
import {
  computeTheoryInspectorMode,
  computeUserModifiedPitch,
  resolveOriginalEnginePitch,
  type TheoryInspectorMode,
} from "@/lib/music/theoryInspectorMode";
import { useSuggestionStore } from "@/store/useSuggestionStore";
import { getNoteById, parseMeasureBeats } from "@/lib/music/scoreUtils";
import type { SatbNoteContextOptions } from "@/lib/music/noteExplainContext";
import {
  buildAdditiveNoteContextLines,
  buildPitchEditDeltaFact,
  buildSatbNoteContextLines,
  buildSatbRhythmContextLines,
  buildScorePartRosterLines,
  describeNotationForTutor,
  formatAuthoritativeDurationFact,
  formatScoreDigestForFoundHit,
} from "@/lib/music/noteExplainContext";
import { buildMeasureFocusFacts } from "@/lib/music/regionExplainContext";
import type { TraceFinding, SlotTraceEntry } from "@/lib/music/theoryInspectorBaseline";
import { voicesAtGenerationForSlot } from "@/lib/music/theoryInspectorBaseline";
import {
  resolveSatbPartIndices,
  scoreToAuditedSlots,
  type AuditedSlot,
} from "@/lib/music/theoryInspectorSlots";
import type { ScoreCorrection, LLMCorrection } from "@/lib/music/suggestionTypes";
import type { ScoreIssueHighlight } from "@/lib/music/inspectorTypes";
import { SATB_RULES, isVoiceInRange, type VoiceKey } from "@/lib/music/theoryRules";
import { splitNoteInsightAiContent } from "@/lib/ai/noteInsightAiSplit";
import { getSuggestionExplanationMode } from "@/lib/study/studyConfig";
import { logStudyEvent } from "@/lib/study/studyEventLog";

const ENGINE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:8000")
    : "http://localhost:8000";

/** Tutor: plain language, grounded in score + checker facts. */
const NOTE_EXPLAIN_TUTOR_BRIEF =
  "Write for a curious musician who is not a theory student. **Before** any **Response rules** section, this message includes **exported notation** from the app: **SCORE_DIGEST**, **FACT:** lines, and usually a **FULL BAR** listing. That block **is** the score you can read (not a teaser). **Never** say notation or duration was not provided if SCORE_DIGEST or AUTHORITATIVE lines exist. " +
  "**Do not prioritize pitch over rhythm or other dimensions**—weave **everything the FACT lines supply** into one answer: pitches, notated durations (note type, quarter-note span, dots, ties), meter, staff roster, every staff sounding at this beat, intervals, voice-leading motion between moments, and same-line neighbors (before/after, across the barline) when listed. Mention articulation or dynamics only if they appear in the facts or the user asks. " +
  "If the message includes ENGINE ORIGIN facts, use those ONLY to explain what HarmonyForge originally generated at load time. Never say the engine ‘chose’ or ‘picked’ the CURRENT pitch if a pitch-edit FACT shows the user changed it—describe the **live** score using CURRENT SCORE FACTS instead. " +
  "STAFF ROSTER and vertical FACT lines label the user’s first staff as **Melody** when there are multiple staves; generated staves use their part names. When multiple harmony staves are listed, relate this moment to **Melody AND each other staff** that sounds. Use every relevant INTERVAL FACT. " +
  "CURRENT SCORE FACTS are a **full notation snapshot** for this moment; treat them as authoritative. Lines starting **FACT: AUTHORITATIVE NOTATION** or **FACT: Clicked event** state the **notated note length**—if either appears, you **must** answer half-note vs quarter etc. from them; never say duration is missing. When a claim follows from a FACT, state it plainly—no ‘maybe’, ‘probably’, ‘likely’, or ‘might’. " +
  "If the user clicked Melody (no engine-origin block), explain how this melody moment fits **each generated staff** at the same beat—do not invent generator intent. " +
  "Do not guess Roman numerals, key degrees, or chord labels unless they appear in the facts. Main answer: **3–5 bullets** (each “- ”) or **at most 4 short sentences**. " +
  "After the main answer, on its own line output exactly the text <<<SUGGESTIONS>>> then 2–4 short bullet lines (each starting with “- ”). **Every suggestion bullet must pair an action with an explicit reason** (use “because”, “so that”, or “— reason:”): e.g. “- Try X **because** Y from the FACTs” or “- Do Z — **reason:** smoother motion per the intervals listed.” Ideas must refine harmony or voice-leading or the **next** chord moment—grounded in supplied facts; if facts are too thin, use a single bullet: “- Not enough context for specific suggestions because the notation block does not spell out the next harmony.”";

/** Shown in the Harmonic Guide card when pitch still matches generation (Mode A). */
const SLIM_HARMONIC_GUIDE_ORIGIN =
  "The **current pitch matches** what HarmonyForge first wrote at load. For vertical intervals and voice motion at this moment, see **Engine evidence** below.";

function voiceLayman(voice: VoiceKey): string {
  switch (voice) {
    case "soprano":
      return "the highest harmony line (often near the tune)";
    case "alto":
      return "the upper-middle harmony line";
    case "tenor":
      return "the lower-middle harmony line";
    case "bass":
      return "the lowest harmony line (the bottom of the chord)";
    default:
      return voice;
  }
}

function laymanFromFinding(f: TraceFinding): string {
  switch (f.rule) {
    case "parallelFifth":
      return "Two parts moved the same way and landed on another fifth—many tools flag that as a weak, hollow repeat.";
    case "parallelOctave":
      return "Two parts moved the same way and landed on another octave—often feels too doubled or empty.";
    case "range":
      return "This line’s pitch is outside the comfortable high/low band the generator expects for that role.";
    case "spacing":
      return "Two harmony lines are stacked farther apart than the spacing rule allows.";
    case "voiceOrder":
      return "The lines don’t stack cleanly from high to low at this moment (they cross in a way the checker dislikes).";
    case "voiceOverlap":
      return "Moving into this chord, one part jumps in a way that awkwardly crosses another part’s previous note.";
    default:
      return f.message;
  }
}

/**
 * Plain “why did the axiomatic pass put this pitch here?” for the **What this click means** card.
 */
function buildAxiomaticEngineWhyParagraph(
  originalEnginePitch: string,
  voice: VoiceKey,
  noteFindings: TraceFinding[],
  userModifiedPitch: boolean,
): string {
  const core = buildLaymanChordExplanation(originalEnginePitch, voice, noteFindings);
  const suffix = userModifiedPitch
    ? "\n\nThat reasoning describes **HarmonyForge’s first output** at this note. If you changed the pitch since then, the **live** score (and **Verifiable score export**) is authoritative for what you hear now."
    : "";
  return `**Why HarmonyForge’s axiomatic engine originally wrote ${originalEnginePitch} on ${voiceLayman(voice)}:** ${core}${suffix}`;
}

function buildLaymanChordExplanation(
  originalPitch: string,
  voice: VoiceKey,
  noteFindings: TraceFinding[],
): string {
  const role = voiceLayman(voice);
  if (noteFindings.length === 0) {
    return (
      `At generation time HarmonyForge wrote ${originalPitch} for ${role} here to complete the four-part chord snapshot together with the other three generator lines. ` +
      `Nothing in the automatic checks recorded at generation complained about this line for that moment: sensible range, spacing, stacking, and no flagged parallel motion into a weak interval for your part.`
    );
  }
  const plain = noteFindings.map(laymanFromFinding);
  const serious = noteFindings.some((f) => f.severity === "error");
  return (
    `At generation HarmonyForge still placed ${originalPitch} on ${role}, and the checker at that time ${serious ? "flagged a real issue" : "noted something borderline"}: ` +
    `${plain.join(" ")} ` +
    `So the engine’s pitch choice was still aimed at filling the harmony, but the stored check marks this line (or its combination with neighbors) under those automatic rules—not because the pitch class is forbidden on its own.`
  );
}

function mergeDeterministicBlocks(
  engineOrigin: string | undefined,
  currentGuide: string,
): string {
  if (engineOrigin?.trim()) {
    return `${engineOrigin.trim()}\n\n---\n\n${currentGuide.trim()}`;
  }
  return currentGuide.trim();
}

/** SATB “engine moment” facts: prefer full baseline slots when still aligned with current. */
function originSatbContextLines(
  currentSlots: AuditedSlot[],
  baselineSlots: AuditedSlot[] | null,
  slotIndex: number,
  voice: VoiceKey,
  baselinePitches: Record<string, string>,
  satbOpts?: SatbNoteContextOptions,
): string[] {
  if (
    baselineSlots &&
    baselineSlots.length === currentSlots.length &&
    baselineSlots[slotIndex]
  ) {
    const cur = currentSlots[slotIndex]!;
    const base = baselineSlots[slotIndex]!;
    const idsMatch = VOICE_KEYS.every((k) => cur.noteIds[k] === base.noteIds[k]);
    if (idsMatch) {
      return buildSatbNoteContextLines(baselineSlots, slotIndex, voice, satbOpts);
    }
  }
  const slot = currentSlots[slotIndex]!;
  const vOrig = voicesAtGenerationForSlot(slot, baselinePitches);
  const hybrid = currentSlots.map((s, i) => ({
    voices: i === slotIndex ? vOrig : s.voices,
  }));
  return buildSatbNoteContextLines(hybrid, slotIndex, voice, satbOpts);
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function msgId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface ValidationTraceResult extends ValidationResult {
  trace: SlotTraceEntry[];
}

const VOICE_KEYS: VoiceKey[] = ["soprano", "alto", "tenor", "bass"];
const STEP_SEMITONES: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

function pitchToMidi(pitch: string): number {
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return 60;
  const step = m[1] ?? "C";
  const octNum = parseInt(m[3] ?? "4", 10);
  let semitones = (STEP_SEMITONES[step] ?? 0) + (octNum - 4) * 12;
  if (m[2] === "#") semitones += 1;
  if (m[2] === "b") semitones -= 1;
  return 60 + semitones;
}

function intervalSemitones(a: number, b: number): number {
  return Math.abs(a - b) % 12;
}

function motionDirection(from: number, to: number): number {
  if (to > from) return 1;
  if (to < from) return -1;
  return 0;
}

function pushHighlights(
  target: ScoreIssueHighlight[],
  slot: AuditedSlot,
  voices: VoiceKey[],
  label: string,
  severity: "error" | "warning",
) {
  for (const voice of voices) {
    const noteId = slot.noteIds[voice];
    if (!noteId) continue;
    target.push({
      noteId,
      label,
      severity,
      detail: `${label} in ${voice}`,
    });
  }
}

function dedupeHighlights(highlights: ScoreIssueHighlight[]): ScoreIssueHighlight[] {
  const byNote = new Map<string, ScoreIssueHighlight>();
  for (const h of highlights) {
    const prev = byNote.get(h.noteId);
    if (!prev) {
      byNote.set(h.noteId, h);
      continue;
    }
    if (prev.severity === "warning" && h.severity === "error") {
      byNote.set(h.noteId, h);
    }
  }
  return [...byNote.values()];
}

function getHarmonyPartIds(score: EditableScore): Set<string> {
  if (score.parts.length <= 1) {
    return new Set(score.parts.map((p) => p.id));
  }
  // Additive harmonies: part 0 is user melody input, remaining parts are generated.
  return new Set(score.parts.slice(1).map((p) => p.id));
}

function isHarmonyPart(score: EditableScore, partId: string): boolean {
  return getHarmonyPartIds(score).has(partId);
}

/**
 * When the score is not 4-part SATB-aligned (e.g. melody + one or two harmony instruments),
 * we cannot build vertical S/A/T/B slots. Still show a useful inspector card for the clicked note.
 */
function buildFallbackNoteInsight(
  score: EditableScore,
  noteId: string,
  partId: string,
  baselinePitches: Record<string, string>,
): NoteInsight | null {
  const found = getNoteById(score, noteId);
  if (!found || found.note.isRest) return null;
  const partIdx = score.parts.findIndex((p) => p.id === partId);
  const part = score.parts[partIdx];
  const partName = part?.name ?? partId;
  const n = score.parts.length;
  const currentPitch = found.note.pitch;
  const originalEnginePitch = resolveOriginalEnginePitch(
    found.note,
    baselinePitches,
    noteId,
  );
  const userModifiedPitch = computeUserModifiedPitch(
    originalEnginePitch,
    currentPitch,
  );
  const inspectorMode = computeTheoryInspectorMode({
    isMelodyPart: false,
    originalEnginePitch,
    currentPitch,
  });
  const insightKind: NoteInsightKind =
    originalEnginePitch !== null ? "harmony-with-provenance" : "harmony-no-provenance";

  const scoreFacts = buildAdditiveNoteContextLines(
    score,
    found.measureIdx,
    found.noteIdx,
    partId,
  );
  const pitchEditDeltaLine =
    originalEnginePitch !== null
      ? buildPitchEditDeltaFact(originalEnginePitch, currentPitch)
      : null;

  const engineOriginExplanation =
    originalEnginePitch !== null
      ? `When this arrangement was generated, HarmonyForge wrote **${originalEnginePitch}** on the “${partName}” staff at this moment (measure ${found.measureIdx + 1}). ` +
        `With only ${n} part line(s), the editor does not expose the full four-voice SATB snapshot, so you will not see the same slot-by-slot engine trace as on a strict S/A/T/B score—but this pitch is still what the deterministic pass originally emitted on this note.`
      : undefined;

  const mbFallback = parseMeasureBeats(found.measure.timeSignature);
  const rhythmPhrase = describeNotationForTutor(found.note, mbFallback);
  const fullCurrentGuide =
    `**${currentPitch}** on “${partName}” (measure ${found.measureIdx + 1}). ${rhythmPhrase.charAt(0).toUpperCase() + rhythmPhrase.slice(1)} ` +
    (userModifiedPitch
      ? `You changed this note since generation; the export below matches the live score. `
      : "") +
    `Open **Verifiable score export** for every staff at this beat and the full bar.`;

  const additiveWhy =
    originalEnginePitch !== null
      ? `**Why HarmonyForge’s axiomatic pass emitted ${originalEnginePitch} on “${partName}”:** The deterministic solver assigned harmony pitches for your chosen ensemble to fit the melody and inferred chord context at this moment (additive score—no full four-voice slot grid in the inspector).${userModifiedPitch ? " You’ve edited since; the export below is the live truth." : ""}`
      : "";

  const currentPitchGuideExplanation =
    inspectorMode === "origin-justifier"
      ? originalEnginePitch !== null
        ? `**This note still matches the first HarmonyForge output.**\n\n${additiveWhy}`
        : SLIM_HARMONIC_GUIDE_ORIGIN
      : `${fullCurrentGuide}${additiveWhy ? `\n\n${additiveWhy}` : ""}`;

  const deterministicExplanation = mergeDeterministicBlocks(
    engineOriginExplanation,
    currentPitchGuideExplanation,
  );

  const evidenceLines = [
    ...(originalEnginePitch !== null
      ? [
          "=== ORIGIN JUSTIFIER (pitch at generation; do not confuse with edits) ===",
          `FACT: Original generated pitch on this note id: ${originalEnginePitch}`,
        ]
      : []),
    ...(pitchEditDeltaLine ? [pitchEditDeltaLine] : []),
    "=== HARMONIC GUIDE — CURRENT SCORE FACTS (live notation: full snapshot) ===",
    ...scoreFacts,
    "---",
    `Part: ${partName} (${n} part score — no four-line chord snapshot for this click)`,
    `Measure ${found.measureIdx + 1}, event ${found.noteIdx + 1} · ${currentPitch}`,
  ];

  return {
    noteId,
    noteLabel: currentPitch,
    voice: `harmony line — ${partName}`,
    slotIndex: found.measureIdx + 1,
    inspectorMode,
    source: "local-fallback",
    deterministicExplanation,
    evidenceLines,
    insightKind,
    currentPitch,
    originalEnginePitch,
    userModifiedPitch,
    engineOriginExplanation,
    currentPitchGuideExplanation,
    pitchEditDeltaLine: pitchEditDeltaLine ?? undefined,
  };
}

function detectIssueHighlights(auditedSlots: AuditedSlot[]): ScoreIssueHighlight[] {
  const highlights: ScoreIssueHighlight[] = [];
  const pairs: Array<[VoiceKey, VoiceKey]> = [
    ["soprano", "alto"],
    ["soprano", "tenor"],
    ["soprano", "bass"],
    ["alto", "tenor"],
    ["alto", "bass"],
    ["tenor", "bass"],
  ];

  for (let i = 0; i < auditedSlots.length; i++) {
    const curr = auditedSlots[i];
    const currMidi: Record<VoiceKey, number> = {
      soprano: pitchToMidi(curr.voices.soprano),
      alto: pitchToMidi(curr.voices.alto),
      tenor: pitchToMidi(curr.voices.tenor),
      bass: pitchToMidi(curr.voices.bass),
    };

    if (!isVoiceInRange("soprano", currMidi.soprano)) {
      pushHighlights(highlights, curr, ["soprano"], "Range violation", "error");
    }
    if (!isVoiceInRange("alto", currMidi.alto)) {
      pushHighlights(highlights, curr, ["alto"], "Range violation", "error");
    }
    if (!isVoiceInRange("tenor", currMidi.tenor)) {
      pushHighlights(highlights, curr, ["tenor"], "Range violation", "error");
    }
    if (!isVoiceInRange("bass", currMidi.bass)) {
      pushHighlights(highlights, curr, ["bass"], "Range violation", "error");
    }

    if (currMidi.soprano - currMidi.alto > SATB_RULES.maxSpacing.sopranoAlto) {
      pushHighlights(highlights, curr, ["soprano", "alto"], "Spacing violation", "warning");
    }
    if (currMidi.alto - currMidi.tenor > SATB_RULES.maxSpacing.altoTenor) {
      pushHighlights(highlights, curr, ["alto", "tenor"], "Spacing violation", "warning");
    }
    if (currMidi.tenor - currMidi.bass > SATB_RULES.maxSpacing.tenorBass) {
      pushHighlights(highlights, curr, ["tenor", "bass"], "Spacing violation", "warning");
    }

    if (!(currMidi.soprano >= currMidi.alto && currMidi.alto >= currMidi.tenor && currMidi.tenor >= currMidi.bass)) {
      pushHighlights(highlights, curr, VOICE_KEYS, "Voice order violation", "error");
    }

    if (i === 0) continue;
    const prev = auditedSlots[i - 1];
    const prevMidi: Record<VoiceKey, number> = {
      soprano: pitchToMidi(prev.voices.soprano),
      alto: pitchToMidi(prev.voices.alto),
      tenor: pitchToMidi(prev.voices.tenor),
      bass: pitchToMidi(prev.voices.bass),
    };

    for (const [v1, v2] of pairs) {
      const prevInterval = intervalSemitones(prevMidi[v1], prevMidi[v2]);
      const currInterval = intervalSemitones(currMidi[v1], currMidi[v2]);
      const d1 = motionDirection(prevMidi[v1], currMidi[v1]);
      const d2 = motionDirection(prevMidi[v2], currMidi[v2]);
      const parallelMotion = d1 === d2 && d1 !== 0;
      if (!parallelMotion) continue;

      if (prevInterval === 7 && currInterval === 7) {
        pushHighlights(highlights, curr, [v1, v2], "Parallel fifth", "error");
      }
      if (prevInterval === 0 && currInterval === 0) {
        pushHighlights(highlights, curr, [v1, v2], "Parallel octave", "error");
      }
    }

    for (let upper = 0; upper < 4; upper++) {
      for (let lower = upper + 1; lower < 4; lower++) {
        const upperVoice = VOICE_KEYS[upper];
        const lowerVoice = VOICE_KEYS[lower];
        if (currMidi[lowerVoice] > prevMidi[upperVoice] || currMidi[upperVoice] < prevMidi[lowerVoice]) {
          pushHighlights(highlights, curr, [upperVoice, lowerVoice], "Voice overlap", "warning");
        }
      }
    }
  }

  return dedupeHighlights(highlights);
}

function findingsToHighlights(
  score: EditableScore,
  auditedSlots: AuditedSlot[],
  trace: SlotTraceEntry[],
): ScoreIssueHighlight[] {
  const highlights: ScoreIssueHighlight[] = [];
  const harmonyPartIds = getHarmonyPartIds(score);

  for (const slotTrace of trace) {
    const slot = auditedSlots[slotTrace.slotIndex];
    if (!slot) continue;
    for (const finding of slotTrace.findings) {
      for (const voice of finding.voices) {
        const noteId = slot.noteIds[voice];
        if (!noteId) continue;
        const found = getNoteById(score, noteId);
        if (!found || !harmonyPartIds.has(found.part.id)) continue;
        highlights.push({
          noteId,
          label: finding.message,
          severity: finding.severity,
          detail: `${finding.rule} at slot ${slotTrace.slotIndex + 1}`,
        });
      }
    }
  }

  return dedupeHighlights(highlights);
}

/**
 * Hook connecting the Theory Inspector Zustand store to the API layer.
 *
 * Returns actions for:
 * - sendMessage(text) — posts to /api/theory-inspector with streaming
 * - runAudit(score) — calls the engine's validate-satb endpoint
 * - handleChipClick(chip) — routes chip actions to the right persona
 */
export function useTheoryInspector() {
  const store = useTheoryInspectorStore();
  const riffSession = useContext(RiffScoreSessionContext);
  const flushEditorToZustand = useCallback(() => {
    riffSession?.flushToZustand();
  }, [riffSession]);
  const abortRef = useRef<AbortController | null>(null);

  // Check API key availability on mount
  useEffect(() => {
    fetch("/api/theory-inspector")
      .then((res) => res.json())
      .then((data: { hasApiKey?: boolean }) => {
        store.setHasApiKey(data.hasApiKey ?? false);
      })
      .catch(() => {
        store.setHasApiKey(false);
      });
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Send a user message to the Theory Inspector and stream the AI response.
   */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || store.isStreaming) return;

      flushEditorToZustand();

      const gate = useTheoryInspectorStore.getState();

      // Abort any in-flight stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const snap = useTheoryInspectorStore.getState();

      // Conversation history must exclude this turn’s user message, or the API gets
      // a plain-text duplicate immediately before the enriched final user message.
      const conversationHistory = snap.messages
        .filter((m) => m.type === "user" || m.type === "ai")
        .slice(-20)
        .map((m) => ({
          role: (m.type === "user" ? "user" : "assistant") as
            | "user"
            | "assistant",
          content: m.content ?? "",
        }));

      // Find the most recent violation for context
      const lastViolation = [...snap.messages].reverse().find(
        (m) => m.type === "violation",
      );
      const violationType = lastViolation?.violationType;

      const scoreFocus = snap.inspectorScoreFocus;
      let scoreSelectionContext: string | undefined;
      let theoryInspectorNoteMode: TheoryInspectorMode | undefined;
      if (scoreFocus?.kind === "note") {
        const ev = scoreFocus.insight.evidenceLines;
        scoreSelectionContext = ev?.length ? ev.join("\n") : undefined;
        theoryInspectorNoteMode = scoreFocus.insight.inspectorMode;
      } else if (scoreFocus?.kind === "measure" || scoreFocus?.kind === "part") {
        scoreSelectionContext = scoreFocus.evidenceLines.join("\n");
        theoryInspectorNoteMode = undefined;
      }

      const userMsg: TheoryInspectorMessage = {
        id: msgId("u"),
        type: "user",
        content: trimmed,
        timestamp: timestamp(),
      };
      store.addMessage(userMsg);
      store.setInputValue("");

      const persona = store.persona;
      const genre = store.genre;

      // Prepare streaming AI message placeholder
      const aiMsgId = msgId("ai");
      const aiMsg: TheoryInspectorMessage = {
        id: aiMsgId,
        type: "ai",
        content: "",
        timestamp: timestamp(),
      };
      store.addMessage(aiMsg);
      store.setIsStreaming(true);
      store.setStreamingMessageId(aiMsgId);

      const focusRepeat =
        scoreSelectionContext?.trim() ?? "";
      const userMessageWithFocus =
        focusRepeat.length > 0
          ? `**Exported notation for this turn (read before answering; SCORE_DIGEST / FACT lines / FULL BAR = visible score):**\n${focusRepeat}\n\n---\n**User:**\n${trimmed}`
          : trimmed;

      try {
        const response = await fetch("/api/theory-inspector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persona,
            genre,
            userMessage: userMessageWithFocus,
            violationType,
            scoreSelectionContext,
            theoryInspectorNoteMode,
            conversationHistory,
            ...(gate.hasApiKey
              ? { explanationLevel: DEFAULT_EXPLANATION_LEVEL }
              : {}),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? `HTTP ${response.status}`);
        }

        const contentType = response.headers.get("Content-Type") ?? "";

        if (contentType.includes("application/json")) {
          // Fallback mode (no API key)
          const data = (await response.json()) as {
            content: string;
            chips?: string[];
            source?: string;
          };
          store.updateMessage(aiMsgId, { content: data.content });
        } else {
          // Streaming mode
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          const decoder = new TextDecoder();
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            store.updateMessage(aiMsgId, { content: accumulated });
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unknown error";
        store.updateMessage(aiMsgId, {
          content: `Error: ${message}. Please try again.`,
        });
      } finally {
        store.setIsStreaming(false);
        store.setStreamingMessageId(null);
      }
    },
    [store, flushEditorToZustand],
  );

  /**
   * Run the SATB Auditor against the current score.
   * Posts to the engine's validate-satb endpoint and creates
   * violation messages for each detected issue.
   */
  const runAudit = useCallback(
    async (_score?: EditableScore | null) => {
      flushEditorToZustand();
      const score = useScoreStore.getState().score;
      if (!score) return;

      const slotData = scoreToAuditedSlots(score);
      if (!slotData) return;

      logStudyEvent("run_audit", {});

      try {
        const response = await fetch(`${ENGINE_URL}/api/validate-satb-trace`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots: slotData.apiSlots }),
        });

        if (!response.ok) return;

        const result = (await response.json()) as ValidationTraceResult;
        store.setLastValidation(result);
        store.setIssueHighlights(
          findingsToHighlights(score, slotData.auditedSlots, result.trace ?? []),
        );

        if (result.valid) {
          store.clearIssueHighlights();
          store.addMessage({
            id: msgId("sys"),
            type: "system",
            content: `All ${result.totalSlots} voice-leading slots pass validation. No violations detected.`,
            timestamp: timestamp(),
          });
          return;
        }

        // System message summarizing the audit
        store.addMessage({
          id: msgId("sys"),
          type: "system",
          content: `SATB Voice Leading Audit — ${result.totalSlots} slots analyzed, HER: ${(result.her * 100).toFixed(1)}%`,
          timestamp: timestamp(),
        });

        // Create violation messages for each non-zero violation type
        const violations = result.violations;
        const keys = Object.keys(violations) as (keyof ValidationViolations)[];
        for (const key of keys) {
          const count = violations[key];
          if (count > 0) {
            store.addMessage({
              id: msgId("v"),
              type: "violation",
              violationType: getViolationLabel(key as ViolationKey),
              content: `${count} ${getViolationLabel(key as ViolationKey).toLowerCase()} violation${count > 1 ? "s" : ""} detected.`,
              timestamp: timestamp(),
            });
          }
        }

      } catch {
        // Engine trace not reachable — fallback to local deterministic highlight checks.
        const harmonyPartIds = getHarmonyPartIds(score);
        const localHighlights = detectIssueHighlights(slotData.auditedSlots).filter((h) => {
          const found = getNoteById(score, h.noteId);
          return found ? harmonyPartIds.has(found.part.id) : false;
        });
        store.setIssueHighlights(localHighlights);
      }
    },
    [store, flushEditorToZustand],
  );

  const suggestionStore = useSuggestionStore();

  /**
   * Request structured corrections from the Stylist AI.
   * Sends the score context to /api/theory-inspector/suggest
   * and stores the result as a SuggestionBatch.
   */
  const requestSuggestion = useCallback(
    async (_score?: EditableScore | null) => {
      if (suggestionStore.isLoading) return;

      flushEditorToZustand();
      const score = useScoreStore.getState().score;
      if (!score) return;

      suggestionStore.setIsLoading(true);
      store.setIsStreaming(true);

      // Immediate feedback: show a system message
      store.addMessage({
        id: msgId("sys"),
        type: "system",
        content: "Analyzing score and generating suggestions\u2026",
        timestamp: timestamp(),
      });

      // Build score context: all notes with their IDs and pitches
      const scoreContext: Array<{
        noteId: string;
        pitch: string;
        duration: string;
        partName: string;
        measureIndex: number;
        noteIndex: number;
      }> = [];

      const harmonyPartIds = getHarmonyPartIds(score);
      for (const part of score.parts) {
        if (!harmonyPartIds.has(part.id)) continue;
        for (let mIdx = 0; mIdx < part.measures.length; mIdx++) {
          const measure = part.measures[mIdx];
          for (let nIdx = 0; nIdx < measure.notes.length; nIdx++) {
            const note = measure.notes[nIdx];
            scoreContext.push({
              noteId: note.id,
              pitch: note.pitch,
              duration: note.duration,
              partName: part.name,
              measureIndex: mIdx,
              noteIndex: nIdx,
            });
          }
        }
      }

      // Find most recent violation for context
      const lastViolation = [...store.messages].reverse().find(
        (m) => m.type === "violation",
      );

      try {
        const response = await fetch("/api/theory-inspector/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genre: store.genre,
            violationType: lastViolation?.violationType,
            scoreContext,
            explanationLevel: DEFAULT_EXPLANATION_LEVEL,
            suggestionExplanationMode: getSuggestionExplanationMode(),
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error ?? `HTTP ${response.status}`);
        }

        const data = (await response.json()) as {
          corrections: LLMCorrection[];
          summary: string;
        };

        // Hydrate corrections: LLM returns "note_0", "note_1" etc.
        // Map these indices back to real noteIds via the scoreContext array order.
        const hydrated: ScoreCorrection[] = [];
        for (const llmC of data.corrections) {
          // Parse "note_X" index
          const idxMatch = llmC.noteId.match(/^note_(\d+)$/);
          const scEntry = idxMatch
            ? scoreContext[parseInt(idxMatch[1], 10)]
            : undefined;
          if (!scEntry) continue;

          const found = getNoteById(score, scEntry.noteId);
          if (!found) continue;

          hydrated.push({
            id: msgId("sc"),
            noteId: scEntry.noteId,
            partId: found.part.id,
            measureIndex: found.measureIdx,
            noteIndex: found.noteIdx,
            originalPitch: found.note.pitch,
            suggestedPitch: llmC.suggestedPitch,
            ruleLabel: llmC.ruleLabel,
            rationale: llmC.rationale,
          });
        }

        if (hydrated.length > 0) {
          const batchId = msgId("batch");
          suggestionStore.addBatch({
            id: batchId,
            corrections: hydrated,
            summary: data.summary,
            violationType: lastViolation?.violationType,
            status: "pending",
            createdAt: Date.now(),
          });

          // Add a suggestion message to the chat
          store.addMessage({
            id: msgId("sug"),
            type: "suggestion",
            suggestionBatchId: batchId,
            timestamp: timestamp(),
          });
        } else {
          store.addMessage({
            id: msgId("sys"),
            type: "system",
            content: "No applicable corrections found for the current score.",
            timestamp: timestamp(),
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unknown error";
        store.addMessage({
          id: msgId("sys"),
          type: "system",
          content: `Suggestion request failed: ${message}`,
          timestamp: timestamp(),
        });
      } finally {
        suggestionStore.setIsLoading(false);
        store.setIsStreaming(false);
      }
    },
    [store, suggestionStore, flushEditorToZustand],
  );

  /**
   * Handle quick-reply chip clicks.
   * Routes to the appropriate persona and sends a message.
   * "Suggest correction" triggers structured suggestion flow if score is available.
   */
  const handleChipClick = useCallback(
    (chip: string, score?: EditableScore | null) => {
      const lower = chip.toLowerCase();
      if (lower.includes("show in score") && score) {
        runAudit(score);
        store.addMessage({
          id: msgId("sys"),
          type: "system",
          content: "Highlighted current voice-leading issues in the score.",
          timestamp: timestamp(),
        });
        return;
      }
      if (lower.includes("explain") || lower.includes("why")) {
        store.setPersona("tutor");
        sendMessage(chip);
      } else if (lower.includes("suggest correction") && score) {
        store.setPersona("stylist");
        logStudyEvent("suggest_fix", { source: "chip" });
        requestSuggestion(score);
      } else if (
        lower.includes("fix") ||
        lower.includes("suggest") ||
        lower.includes("alternate")
      ) {
        store.setPersona("stylist");
        sendMessage(chip);
      } else if (lower.includes("check") || lower.includes("audit")) {
        store.setPersona("auditor");
        sendMessage(chip);
      } else {
        sendMessage(chip);
      }
    },
    [store, sendMessage, requestSuggestion, runAudit],
  );

  const streamTutorNoteInsight = useCallback(
    async (base: NoteInsight, evidence: string) => {
      const st0 = useTheoryInspectorStore.getState();
      if (!st0.hasApiKey) return;
      store.setIsStreaming(true);
      store.setStreamingMessageId(null);
      try {
        const response = await fetch("/api/theory-inspector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persona: "tutor",
            genre: store.genre,
            theoryInspectorNoteMode: base.inspectorMode,
            userMessage: `${evidence}\n\n---\n**Response rules** (apply after reading the notation block above):\n${NOTE_EXPLAIN_TUTOR_BRIEF}`,
            scoreSelectionContext: evidence,
            explanationLevel: DEFAULT_EXPLANATION_LEVEL,
          }),
        });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? `HTTP ${response.status}`);
        }
        const contentType = response.headers.get("Content-Type") ?? "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { content?: string };
          const raw = data.content ?? "";
          const { explanation, suggestions } = splitNoteInsightAiContent(raw);
          store.setSelectedNoteInsight({
            ...base,
            aiExplanation: explanation,
            aiSuggestions: suggestions || undefined,
          });
        } else {
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");
          const decoder = new TextDecoder();
          let accumulated = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulated += decoder.decode(value, { stream: true });
            const { explanation, suggestions } = splitNoteInsightAiContent(accumulated);
            store.setSelectedNoteInsight({
              ...base,
              aiExplanation: explanation,
              aiSuggestions: suggestions || undefined,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        store.setSelectedNoteInsight({
          ...base,
          aiExplanation: `Could not generate AI note explanation: ${message}`,
          aiSuggestions: undefined,
        });
      } finally {
        store.setIsStreaming(false);
        store.setStreamingMessageId(null);
      }
    },
    [store],
  );

  const explainNotePitch = useCallback(
    async (score: EditableScore, noteId: string, partId: string) => {
      if (store.isStreaming) return;

      flushEditorToZustand();
      const live = useScoreStore.getState().score ?? score;

      const found = getNoteById(live, noteId);
      if (!found || found.note.isRest) return;

      logStudyEvent("theory_inspector_note_click", { noteId, partId });

      const partIndex = live.parts.findIndex((p) => p.id === partId);
      if (partIndex < 0) return;

      const {
        generationBaselineHarmonyPitches: baselinePitches,
        generationBaselineSatbTrace: baselineTrace,
        generationBaselineAuditedSlots: baselineAuditedSlots,
      } = useTheoryInspectorStore.getState();

      const isMelodyPart = live.parts.length > 1 && partIndex === 0;

      if (isMelodyPart) {
        const partName = live.parts[partIndex]?.name ?? partId;
        const currentPitch = found.note.pitch;
        const scoreFacts = buildAdditiveNoteContextLines(
          live,
          found.measureIdx,
          found.noteIdx,
          partId,
        );
        const mbMelody = parseMeasureBeats(found.measure.timeSignature);
        const melodyRhythm = describeNotationForTutor(found.note, mbMelody);
        const currentPitchGuideExplanation =
          `You clicked your **tune** (“${partName}”) in measure ${found.measureIdx + 1}. ` +
          `This written pitch is **${currentPitch}**. ${melodyRhythm.charAt(0).toUpperCase() + melodyRhythm.slice(1)} ` +
          `**Verifiable score export** lists every staff at this beat and the full bar.`;

        const melodyInsight: NoteInsight = {
          noteId,
          noteLabel: currentPitch,
          voice: `melody — ${partName}`,
          slotIndex: found.measureIdx + 1,
          inspectorMode: "melody-context",
          source: "local-fallback",
          deterministicExplanation: currentPitchGuideExplanation,
          evidenceLines: [
            "=== CURRENT SCORE FACTS (melody + harmony at this beat; full notation snapshot) ===",
            ...scoreFacts,
            `Measure ${found.measureIdx + 1} · ${currentPitch}`,
          ],
          insightKind: "melody-guide",
          currentPitch,
          originalEnginePitch: null,
          userModifiedPitch: false,
          currentPitchGuideExplanation,
        };
        store.setSelectedNoteInsight(melodyInsight);
        await streamTutorNoteInsight(
          melodyInsight,
          melodyInsight.evidenceLines.join("\n"),
        );
        return;
      }

      if (!isHarmonyPart(live, partId)) {
        return;
      }

      const slotData = scoreToAuditedSlots(live, {
        requireExactlyFourParts: true,
      });
      if (!slotData) {
        const fallback = buildFallbackNoteInsight(live, noteId, partId, baselinePitches);
        if (fallback) {
          store.setSelectedNoteInsight(fallback);
          await streamTutorNoteInsight(fallback, fallback.evidenceLines.join("\n"));
        }
        return;
      }

      const slotIndex = slotData.auditedSlots.findIndex((sl) =>
        VOICE_KEYS.some((voice) => sl.noteIds[voice] === noteId),
      );
      if (slotIndex < 0) {
        const fallback = buildFallbackNoteInsight(live, noteId, partId, baselinePitches);
        if (fallback) {
          const evidenceLines = [
            ...fallback.evidenceLines,
            "(Internal: note id not in four-voice grid; treating as single harmony line.)",
          ];
          store.setSelectedNoteInsight({ ...fallback, evidenceLines });
          await streamTutorNoteInsight({ ...fallback, evidenceLines }, evidenceLines.join("\n"));
        }
        return;
      }

      const slot = slotData.auditedSlots[slotIndex];
      const voice = VOICE_KEYS.find((v) => slot.noteIds[v] === noteId);
      if (!voice) return;

      const satbResolved = resolveSatbPartIndices(live);
      const satbOpts: SatbNoteContextOptions | undefined = satbResolved
        ? { voiceStaffNames: satbResolved.names }
        : undefined;
      const rosterLines = buildScorePartRosterLines(live);

      const currentPitch = slot.voices[voice];
      const originalEnginePitch = resolveOriginalEnginePitch(
        found.note,
        baselinePitches,
        noteId,
      );
      const userModifiedPitch = computeUserModifiedPitch(
        originalEnginePitch,
        currentPitch,
      );
      const inspectorMode = computeTheoryInspectorMode({
        isMelodyPart: false,
        originalEnginePitch,
        currentPitch,
      });
      const pitchEditDeltaLine =
        originalEnginePitch !== null
          ? buildPitchEditDeltaFact(originalEnginePitch, currentPitch)
          : null;

      const originFacts = originSatbContextLines(
        slotData.auditedSlots,
        baselineAuditedSlots,
        slotIndex,
        voice,
        baselinePitches,
        satbOpts,
      );
      const rhythmFacts = buildSatbRhythmContextLines(
        live,
        slotData.auditedSlots,
        slotIndex,
        satbOpts,
      );

      const clickedAuthoritative = formatAuthoritativeDurationFact(
        found.note,
        parseMeasureBeats(found.measure.timeSignature),
        found.measure.timeSignature,
      );

      const currentFacts = buildSatbNoteContextLines(
        slotData.auditedSlots,
        slotIndex,
        voice,
        satbOpts,
      );

      let originFindings: TraceFinding[] = [];
      const bt = baselineTrace?.find((t) => t.slotIndex === slotIndex);
      if (bt) {
        originFindings = bt.findings.filter((f) => f.voices.includes(voice));
      } else if (originalEnginePitch !== null) {
        const ov = voicesAtGenerationForSlot(slot, baselinePitches);
        const om: Record<VoiceKey, number> = {
          soprano: pitchToMidi(ov.soprano),
          alto: pitchToMidi(ov.alto),
          tenor: pitchToMidi(ov.tenor),
          bass: pitchToMidi(ov.bass),
        };
        if (!isVoiceInRange(voice, om[voice])) {
          originFindings.push({
            rule: "range",
            severity: "error",
            voices: [voice],
            message: `${voice} out of SATB range at generation`,
          });
        }
      }

      const engineOriginExplanation =
        originalEnginePitch !== null
          ? `${buildLaymanChordExplanation(originalEnginePitch, voice, originFindings)}${originFacts.length > 0 ? `\n\n${originFacts.join("\n")}` : ""}`
          : undefined;

      const mbSatb = parseMeasureBeats(found.measure.timeSignature);
      const satbRhythmPhrase = describeNotationForTutor(found.note, mbSatb);
      const fullSatbCurrentGuide =
        `Chord moment **${slotIndex + 1}** — your **${voice}** line (${voiceLayman(voice)}) sounds **${currentPitch}**. ` +
        `${satbRhythmPhrase.charAt(0).toUpperCase() + satbRhythmPhrase.slice(1)}` +
        (userModifiedPitch
          ? ` You edited this line since the first generation; **What the tool first wrote** stays frozen to that pass.`
          : "") +
        ` **Verifiable score export** has all four parts, intervals, and bar-wide rhythm.`;

      const satbWhy =
        originalEnginePitch !== null
          ? buildAxiomaticEngineWhyParagraph(
              originalEnginePitch,
              voice,
              originFindings,
              userModifiedPitch,
            )
          : "";

      const currentPitchGuideExplanation =
        inspectorMode === "origin-justifier"
          ? originalEnginePitch !== null
            ? `**This note still matches the first HarmonyForge output.**\n\n${satbWhy}`
            : SLIM_HARMONIC_GUIDE_ORIGIN
          : `${fullSatbCurrentGuide}${satbWhy ? `\n\n${satbWhy}` : ""}`;

      const sourceTag = bt && originFindings.length > 0 ? "engine-trace" : "local-fallback";

      const { lines: satbMeasureLines } = buildMeasureFocusFacts(
        live,
        found.measureIdx,
      );

      const evidenceLines = [
        ...(originalEnginePitch !== null
          ? [
              "=== ORIGIN JUSTIFIER (pitches + checker at generation; not your live edit) ===",
              `FACT: Original generated pitch on this note: ${originalEnginePitch}`,
              ...originFacts,
              ...(originFindings.length > 0
                ? originFindings.map(
                    (f) =>
                      `• ${f.severity === "error" ? "Issue" : "Heads-up"} (at generation): ${laymanFromFinding(f)}`,
                  )
                : ["• No stored trace findings for this line at generation."]),
            ]
          : ["=== ORIGIN JUSTIFIER ===", "No baseline pitch stored for this note id (guide-only mode)."]),
        ...(pitchEditDeltaLine ? ["", pitchEditDeltaLine] : []),
        "",
        "=== HARMONIC GUIDE — CURRENT SCORE FACTS (live notation) ===",
        "=== NOTATION PROVIDED TO YOU (deterministic export from the editor) ===",
        formatScoreDigestForFoundHit(found),
        ...rosterLines,
        clickedAuthoritative,
        ...rhythmFacts,
        ...currentFacts,
        "---",
        "FULL BAR (all staves, this measure):",
        ...satbMeasureLines,
        "",
        `Chord moment ${slotIndex + 1} · current four lines (high → low): ${slot.voices.soprano} · ${slot.voices.alto} · ${slot.voices.tenor} · ${slot.voices.bass}`,
      ];

      const insightKind: NoteInsightKind =
        originalEnginePitch !== null ? "harmony-with-provenance" : "harmony-no-provenance";

      const nextInsight: NoteInsight = {
        noteId,
        noteLabel: currentPitch,
        voice,
        slotIndex: slotIndex + 1,
        inspectorMode,
        source: sourceTag === "engine-trace" ? "engine-trace" : "local-fallback",
        deterministicExplanation: mergeDeterministicBlocks(
          engineOriginExplanation,
          currentPitchGuideExplanation,
        ),
        evidenceLines,
        insightKind,
        currentPitch,
        originalEnginePitch,
        userModifiedPitch,
        engineOriginExplanation,
        currentPitchGuideExplanation,
        pitchEditDeltaLine: pitchEditDeltaLine ?? undefined,
      };
      store.setSelectedNoteInsight(nextInsight);
      await streamTutorNoteInsight(nextInsight, evidenceLines.join("\n"));
    },
    [store, streamTutorNoteInsight, flushEditorToZustand],
  );

  const explainGeneratedNote = explainNotePitch;

  const explainViolationMore = useCallback((msgId: string) => {
    logStudyEvent("explain_more", { msgId });
    const m = useTheoryInspectorStore.getState().messages.find((x) => x.id === msgId);
    if (m?.type !== "violation") return;
    const label = m.violationType ?? "this issue";
    void sendMessage(
      `Explain more about “${label}” in plain language, using the checker context if available.`,
    );
  }, [sendMessage]);

  const suggestFixForViolation = useCallback(
    (score: EditableScore, msgId: string) => {
      logStudyEvent("suggest_fix", { msgId });
      void requestSuggestion(score);
    },
    [requestSuggestion],
  );

  return {
    messages: store.messages,
    inputValue: store.inputValue,
    setInputValue: store.setInputValue,
    isStreaming: store.isStreaming,
    streamingMessageId: store.streamingMessageId,
    hasApiKey: store.hasApiKey,
    persona: store.persona,
    genre: store.genre,
    setGenre: store.setGenre,
    sendMessage,
    runAudit,
    handleChipClick,
    requestSuggestion,
    issueHighlights: store.issueHighlights,
    selectedNoteInsight: store.selectedNoteInsight,
    inspectorScoreFocus: store.inspectorScoreFocus,
    setInspectorScoreFocus: store.setInspectorScoreFocus,
    explainNotePitch,
    explainGeneratedNote,
    explainViolationMore,
    suggestFixForViolation,
    clearMessages: store.clearMessages,
  };
}
