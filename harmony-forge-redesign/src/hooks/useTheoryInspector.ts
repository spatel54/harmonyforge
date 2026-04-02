"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTheoryInspectorStore } from "@/store/useTheoryInspectorStore";
import type { TheoryInspectorMessage } from "@/components/organisms/TheoryInspectorPanel";
import type { EditableScore } from "@/lib/music/scoreTypes";
import {
  getViolationLabel,
  type ViolationKey,
} from "@/lib/ai/taxonomyIndex";
import type {
  NoteInsight,
  ValidationResult,
  ValidationViolations,
} from "@/store/useTheoryInspectorStore";
import { useSuggestionStore } from "@/store/useSuggestionStore";
import { getNoteById } from "@/lib/music/scoreUtils";
import {
  buildAdditiveNoteContextLines,
  buildSatbNoteContextLines,
} from "@/lib/music/noteExplainContext";
import type { ScoreCorrection, LLMCorrection } from "@/lib/music/suggestionTypes";
import type { ScoreIssueHighlight } from "@/lib/music/inspectorTypes";
import { SATB_RULES, isVoiceInRange, type VoiceKey } from "@/lib/music/theoryRules";

const ENGINE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:8000")
    : "http://localhost:8000";

/** Tutor: plain language, grounded in score + checker facts. */
const NOTE_EXPLAIN_TUTOR_BRIEF =
  "Write for a curious musician who is not a theory student. Answer only: why did the tool pick THIS note on THIS instrument line at THIS moment? " +
  "The SCORE FACTS block is computed from the user’s actual notation (melody + other staves at the same time, and neighbors on the clicked staff). Treat it as authoritative: explain the clicked pitch in relation to those melody and harmony snapshots and the intervals they imply. " +
  "When a statement follows directly from a FACT line, state it plainly—do not soften with ‘maybe’, ‘probably’, ‘likely’, or ‘might’. " +
  "Do not guess Roman numerals, key degrees, or chord labels unless they appear in the facts; if missing, say only what the listed pitches and intervals establish. " +
  "Do not lecture on four-part writing as a system. Short paragraphs, no acronym soup, 2–5 paragraphs max.";

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

function buildLaymanChordExplanation(
  pitch: string,
  voice: VoiceKey,
  noteFindings: TraceFinding[],
): string {
  const role = voiceLayman(voice);
  if (noteFindings.length === 0) {
    return (
      `The generator picked ${pitch} for ${role} here because it completes the chord HarmonyForge is building at this instant together with the other three notes. ` +
      `For this moment nothing in the automatic checks complained: each line is in a sensible pitch range, the lines aren’t absurdly far apart, they stack high-to-low without crossing, ` +
      `and the motion from the previous chord didn’t trigger the usual “both lines slid the same way into a bad interval” patterns for your line.`
    );
  }
  const plain = noteFindings.map(laymanFromFinding);
  const serious = noteFindings.some((f) => f.severity === "error");
  return (
    `The generator still placed ${pitch} on ${role} here, but the checker is ${serious ? "calling this out as a real issue" : "nudging that something is borderline"}: ` +
    `${plain.join(" ")} ` +
    `So the “why” is: the tool chose this pitch to fill out the harmony, but this line (or how it combines with its neighbors) breaks one of those automatic good-harmony habits—not because the letter name is forbidden on its own.`
  );
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

type VoiceMap = Record<VoiceKey, string>;
type VoiceNoteMap = Record<VoiceKey, string | null>;

interface AuditedSlot {
  voices: VoiceMap;
  noteIds: VoiceNoteMap;
}

interface TraceFinding {
  rule:
    | "range"
    | "spacing"
    | "voiceOrder"
    | "parallelFifth"
    | "parallelOctave"
    | "voiceOverlap";
  severity: "error" | "warning";
  voices: VoiceKey[];
  message: string;
}

interface SlotTrace {
  slotIndex: number;
  findings: TraceFinding[];
}

interface ValidationTraceResult extends ValidationResult {
  trace: SlotTrace[];
}

/**
 * Convert an EditableScore with SATB parts into:
 * - API slots for backend validation
 * - local slots with note IDs for inline highlight mapping
 */
function scoreToAuditedSlots(
  score: EditableScore,
): { apiSlots: Array<{ voices: VoiceMap }>; auditedSlots: AuditedSlot[] } | null {
  if (score.parts.length < 4) return null;

  // Try to match parts by name (case-insensitive), fall back to order
  const nameMap: Record<string, number> = {};
  score.parts.forEach((part, i) => {
    const lower = part.name.toLowerCase();
    if (lower.includes("soprano") || lower === "s") nameMap.soprano = i;
    else if (lower.includes("alto") || lower === "a") nameMap.alto = i;
    else if (lower.includes("tenor") || lower === "t") nameMap.tenor = i;
    else if (lower.includes("bass") || lower === "b") nameMap.bass = i;
  });

  const si = nameMap.soprano ?? 0;
  const ai = nameMap.alto ?? 1;
  const ti = nameMap.tenor ?? 2;
  const bi = nameMap.bass ?? 3;

  const sPart = score.parts[si];
  const aPart = score.parts[ai];
  const tPart = score.parts[ti];
  const bPart = score.parts[bi];

  if (!sPart || !aPart || !tPart || !bPart) return null;

  const measureCount = Math.min(
    sPart.measures.length,
    aPart.measures.length,
    tPart.measures.length,
    bPart.measures.length,
  );

  const apiSlots: Array<{ voices: VoiceMap }> = [];
  const auditedSlots: AuditedSlot[] = [];

  for (let m = 0; m < measureCount; m++) {
    const sNotes = sPart.measures[m]?.notes ?? [];
    const aNotes = aPart.measures[m]?.notes ?? [];
    const tNotes = tPart.measures[m]?.notes ?? [];
    const bNotes = bPart.measures[m]?.notes ?? [];

    // Align notes by index within each measure
    const noteCount = Math.max(
      sNotes.length,
      aNotes.length,
      tNotes.length,
      bNotes.length,
    );

    for (let n = 0; n < noteCount; n++) {
      const sRef = sNotes[n] ?? sNotes[sNotes.length - 1];
      const aRef = aNotes[n] ?? aNotes[aNotes.length - 1];
      const tRef = tNotes[n] ?? tNotes[tNotes.length - 1];
      const bRef = bNotes[n] ?? bNotes[bNotes.length - 1];

      const soprano = sRef?.pitch;
      const alto = aRef?.pitch;
      const tenor = tRef?.pitch;
      const bass = bRef?.pitch;

      if (soprano && alto && tenor && bass) {
        const voices: VoiceMap = { soprano, alto, tenor, bass };
        const noteIds: VoiceNoteMap = {
          soprano: sRef?.id ?? null,
          alto: aRef?.id ?? null,
          tenor: tRef?.id ?? null,
          bass: bRef?.id ?? null,
        };
        apiSlots.push({ voices });
        auditedSlots.push({ voices, noteIds });
      }
    }
  }

  return apiSlots.length > 0 ? { apiSlots, auditedSlots } : null;
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
): NoteInsight | null {
  const found = getNoteById(score, noteId);
  if (!found) return null;
  const partIdx = score.parts.findIndex((p) => p.id === partId);
  const part = score.parts[partIdx];
  const partName = part?.name ?? partId;
  const n = score.parts.length;
  const pitchLabel = found.note.isRest ? "a rest" : found.note.pitch;
  const scoreFacts = buildAdditiveNoteContextLines(
    score,
    found.measureIdx,
    found.noteIdx,
    partId,
  );
  return {
    noteId,
    noteLabel: found.note.isRest ? "(rest)" : found.note.pitch,
    voice: `harmony line — ${partName}`,
    slotIndex: found.measureIdx + 1,
    source: "local-fallback",
    deterministicExplanation:
      `This is ${pitchLabel} on your “${partName}” harmony track (measure ${found.measureIdx + 1}, beat ${found.noteIdx + 1}). ` +
      `HarmonyForge put it there to support your melody at that moment—the generator is trying to add notes that belong with what you’re playing in the other staves.\n\n` +
      `This score only has ${n} part line(s) in the editor. The deep “chord-by-chord” checker that compares four matched voices at once needs a full four-line layout; ` +
      `with fewer lines we can’t automatically line up “this click” with that four-note snapshot, so the card can’t spell out the same rule-by-rule story you’d get in a four-part view. ` +
      `The harmony engine underneath still uses those habits when it invents notes; we’re just not showing the step-by-step proof for this layout.` +
      (scoreFacts.length > 0 ? `\n\n${scoreFacts.join("\n")}` : ""),
    evidenceLines: [
      "=== SCORE FACTS (measured from the score) ===",
      ...scoreFacts,
      "---",
      `Part: ${partName} (${n} part score — no four-line chord snapshot for this click)`,
      `Measure ${found.measureIdx + 1}, beat ${found.noteIdx + 1} · ${found.note.isRest ? "rest" : found.note.pitch}`,
    ],
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
  trace: SlotTrace[],
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

      // Abort any in-flight stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Add user message
      const userMsg: TheoryInspectorMessage = {
        id: msgId("u"),
        type: "user",
        content: trimmed,
        timestamp: timestamp(),
      };
      store.addMessage(userMsg);
      store.setInputValue("");

      // Determine persona from context
      const persona = store.persona;
      const genre = store.genre;

      // Find the most recent violation for context
      const lastViolation = [...store.messages].reverse().find(
        (m) => m.type === "violation",
      );
      const violationType = lastViolation?.violationType;

      // Build conversation history (last 10 exchanges)
      const history = store.messages
        .filter((m) => m.type === "user" || m.type === "ai")
        .slice(-20)
        .map((m) => ({
          role: (m.type === "user" ? "user" : "assistant") as
            | "user"
            | "assistant",
          content: m.content ?? "",
        }));

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

      try {
        const response = await fetch("/api/theory-inspector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persona,
            genre,
            userMessage: trimmed,
            violationType,
            conversationHistory: history,
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

          if (data.chips) {
            store.addMessage({
              id: msgId("chips"),
              type: "chips",
              chips: data.chips,
            });
          }
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

          // Add follow-up chips
          store.addMessage({
            id: msgId("chips"),
            type: "chips",
            chips: violationType
              ? ["Explain more", "Suggest fix", "Show in score"]
              : [
                  "Explain this chord",
                  "Check voice leading",
                  "Suggest correction",
                ],
          });
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
    [store],
  );

  /**
   * Run the SATB Auditor against the current score.
   * Posts to the engine's validate-satb endpoint and creates
   * violation messages for each detected issue.
   */
  const runAudit = useCallback(
    async (score: EditableScore) => {
      const slotData = scoreToAuditedSlots(score);
      if (!slotData) return;

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

        // Add follow-up chips
        store.addMessage({
          id: msgId("chips"),
          type: "chips",
          chips: ["Explain violations", "Suggest fixes", "Show in score"],
        });
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
    [store],
  );

  const suggestionStore = useSuggestionStore();

  /**
   * Request structured corrections from the Stylist AI.
   * Sends the score context to /api/theory-inspector/suggest
   * and stores the result as a SuggestionBatch.
   */
  const requestSuggestion = useCallback(
    async (score: EditableScore) => {
      if (suggestionStore.isLoading) return;
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
    [store, suggestionStore],
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

  const explainGeneratedNote = useCallback(
    async (score: EditableScore, noteId: string, partId: string) => {
      if (!isHarmonyPart(score, partId)) {
        return;
      }
      if (store.isStreaming) return;

      const slotData = scoreToAuditedSlots(score);
      if (!slotData) {
        const fallback = buildFallbackNoteInsight(score, noteId, partId);
        if (fallback) {
          store.setSelectedNoteInsight(fallback);
          const key = useTheoryInspectorStore.getState().hasApiKey;
          if (key) {
            store.setIsStreaming(true);
            try {
              const evidence = fallback.evidenceLines.join("\n");
              const response = await fetch("/api/theory-inspector", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  persona: "tutor",
                  genre: store.genre,
                  userMessage: `${NOTE_EXPLAIN_TUTOR_BRIEF}\n\n${evidence}`,
                  violationContext: evidence,
                }),
              });
              if (!response.ok) {
                const data = (await response.json()) as { error?: string };
                throw new Error(data.error ?? `HTTP ${response.status}`);
              }
              const contentType = response.headers.get("Content-Type") ?? "";
              if (contentType.includes("application/json")) {
                const data = (await response.json()) as { content?: string };
                store.setSelectedNoteInsight({
                  ...fallback,
                  aiExplanation: data.content ?? "",
                });
              } else {
                const reader = response.body?.getReader();
                if (reader) {
                  const decoder = new TextDecoder();
                  let accumulated = "";
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    accumulated += decoder.decode(value, { stream: true });
                    store.setSelectedNoteInsight({
                      ...fallback,
                      aiExplanation: accumulated,
                    });
                  }
                }
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Unknown error";
              store.setSelectedNoteInsight({
                ...fallback,
                aiExplanation: `Could not generate AI explanation: ${msg}`,
              });
            } finally {
              store.setIsStreaming(false);
              store.setStreamingMessageId(null);
            }
          }
        }
        return;
      }

      const slotIndex = slotData.auditedSlots.findIndex((slot) =>
        VOICE_KEYS.some((voice) => slot.noteIds[voice] === noteId),
      );
      if (slotIndex < 0) {
        const fallback = buildFallbackNoteInsight(score, noteId, partId);
        if (fallback) {
          store.setSelectedNoteInsight(fallback);
          const key = useTheoryInspectorStore.getState().hasApiKey;
          if (key) {
            store.setIsStreaming(true);
            try {
              const evidence =
                fallback.evidenceLines.join("\n") +
                "\n(Internal: clicked note did not match the four-line chord snapshot—treat as a single-line harmony note.)";
              const response = await fetch("/api/theory-inspector", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  persona: "tutor",
                  genre: store.genre,
                  userMessage: `${NOTE_EXPLAIN_TUTOR_BRIEF}\n\n${evidence}`,
                  violationContext: evidence,
                }),
              });
              if (response.ok) {
                const contentType = response.headers.get("Content-Type") ?? "";
                if (contentType.includes("application/json")) {
                  const data = (await response.json()) as { content?: string };
                  store.setSelectedNoteInsight({
                    ...fallback,
                    aiExplanation: data.content ?? "",
                  });
                } else {
                  const reader = response.body?.getReader();
                  if (reader) {
                    const decoder = new TextDecoder();
                    let accumulated = "";
                    while (true) {
                      const { done, value } = await reader.read();
                      if (done) break;
                      accumulated += decoder.decode(value, { stream: true });
                      store.setSelectedNoteInsight({
                        ...fallback,
                        aiExplanation: accumulated,
                      });
                    }
                  }
                }
              }
            } catch {
              /* keep deterministic only */
            } finally {
              store.setIsStreaming(false);
              store.setStreamingMessageId(null);
            }
          }
        }
        return;
      }

      const slot = slotData.auditedSlots[slotIndex];
      const voice = VOICE_KEYS.find((v) => slot.noteIds[v] === noteId);
      if (!voice) return;
      let slotFindings: TraceFinding[] = [];
      try {
        const traceResponse = await fetch(`${ENGINE_URL}/api/validate-satb-trace`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots: slotData.apiSlots }),
        });
        if (traceResponse.ok) {
          const traceResult = (await traceResponse.json()) as ValidationTraceResult;
          const slotTrace = traceResult.trace.find((t) => t.slotIndex === slotIndex);
          slotFindings = slotTrace?.findings ?? [];
        }
      } catch {
        // Continue with local fallback if trace endpoint is not reachable.
      }

      if (slotFindings.length === 0) {
        const currMidi: Record<VoiceKey, number> = {
          soprano: pitchToMidi(slot.voices.soprano),
          alto: pitchToMidi(slot.voices.alto),
          tenor: pitchToMidi(slot.voices.tenor),
          bass: pitchToMidi(slot.voices.bass),
        };
        if (!isVoiceInRange("soprano", currMidi.soprano)) {
          slotFindings.push({
            rule: "range",
            severity: "error",
            voices: ["soprano"],
            message: "soprano out of SATB range",
          });
        }
        if (!isVoiceInRange("alto", currMidi.alto)) {
          slotFindings.push({
            rule: "range",
            severity: "error",
            voices: ["alto"],
            message: "alto out of SATB range",
          });
        }
        if (!isVoiceInRange("tenor", currMidi.tenor)) {
          slotFindings.push({
            rule: "range",
            severity: "error",
            voices: ["tenor"],
            message: "tenor out of SATB range",
          });
        }
        if (!isVoiceInRange("bass", currMidi.bass)) {
          slotFindings.push({
            rule: "range",
            severity: "error",
            voices: ["bass"],
            message: "bass out of SATB range",
          });
        }
      }

      const noteFindings = slotFindings.filter((f) => f.voices.includes(voice));
      const sourceTag = slotFindings.length > 0 ? "engine trace" : "local fallback";
      const scoreFacts = buildSatbNoteContextLines(slotData.auditedSlots, slotIndex, voice);
      const evidenceLines = [
        "=== SCORE FACTS (melody + vertical sonority + motion) ===",
        ...scoreFacts,
        "=== ENGINE / CHECKER ===",
        `Chord moment ${slotIndex + 1} · your line: ${slot.voices[voice]} (${voiceLayman(voice)})`,
        `Full chord (high → low): ${slot.voices.soprano} · ${slot.voices.alto} · ${slot.voices.tenor} · ${slot.voices.bass}`,
        ...(slotFindings.length > 0
          ? slotFindings.map(
              (f) =>
                `• ${f.severity === "error" ? "Issue" : "Heads-up"}: ${laymanFromFinding(f)}`,
            )
          : ["• No automatic issues reported for this chord moment."]),
      ];

      const nextInsight: NoteInsight = {
        noteId,
        noteLabel: slot.voices[voice],
        voice,
        slotIndex: slotIndex + 1,
        source: sourceTag === "engine trace" ? "engine-trace" : "local-fallback",
        deterministicExplanation: `${buildLaymanChordExplanation(
          slot.voices[voice],
          voice,
          noteFindings,
        )}${scoreFacts.length > 0 ? `\n\n${scoreFacts.join("\n")}` : ""}`,
        evidenceLines,
      };
      store.setSelectedNoteInsight(nextInsight);

      if (!useTheoryInspectorStore.getState().hasApiKey) return;

      store.setIsStreaming(true);
      store.setStreamingMessageId(null);

      const evidence = [
        "=== SCORE FACTS (authoritative) ===",
        ...scoreFacts,
        "",
        "=== CHECKER (this line) ===",
        `Clicked note: ${slot.voices[voice]} on ${voiceLayman(voice)}`,
        `Chord moment #${slotIndex + 1} — the four generator lines at once: ${slot.voices.soprano}, ${slot.voices.alto}, ${slot.voices.tenor}, ${slot.voices.bass}`,
        noteFindings.length > 0
          ? `What the checker says about this line: ${noteFindings.map(laymanFromFinding).join(" ")}`
          : "What the checker says about this line: nothing flagged for this note.",
      ].join("\n\n");

      try {
        const response = await fetch("/api/theory-inspector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            persona: "tutor",
            genre: store.genre,
            userMessage: `${NOTE_EXPLAIN_TUTOR_BRIEF}\n\n${evidence}`,
            violationContext: evidence,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? `HTTP ${response.status}`);
        }

        const contentType = response.headers.get("Content-Type") ?? "";
        if (contentType.includes("application/json")) {
          const data = (await response.json()) as { content?: string };
          store.setSelectedNoteInsight({
            ...nextInsight,
            aiExplanation: data.content ?? "Could not generate note explanation.",
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
            store.setSelectedNoteInsight({
              ...nextInsight,
              aiExplanation: accumulated,
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        store.setSelectedNoteInsight({
          ...nextInsight,
          aiExplanation: `Could not generate AI note explanation: ${message}`,
        });
      } finally {
        store.setIsStreaming(false);
        store.setStreamingMessageId(null);
      }
    },
    [store],
  );

  return {
    messages: store.messages,
    inputValue: store.inputValue,
    setInputValue: store.setInputValue,
    isStreaming: store.isStreaming,
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
    explainGeneratedNote,
    clearMessages: store.clearMessages,
  };
}
