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
  ValidationResult,
  ValidationViolations,
} from "@/store/useTheoryInspectorStore";
import { useSuggestionStore } from "@/store/useSuggestionStore";
import { getNoteById } from "@/lib/music/scoreUtils";
import type { ScoreCorrection, LLMCorrection } from "@/lib/music/suggestionTypes";

const ENGINE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:8000")
    : "http://localhost:8000";

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function msgId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Convert an EditableScore with 4 SATB parts into the slot format
 * expected by POST /api/validate-satb.
 *
 * Returns null if the score doesn't have exactly 4 parts or if parts
 * can't be mapped to SATB voices.
 */
function scoreToSlots(
  score: EditableScore,
): Array<{ voices: { soprano: string; alto: string; tenor: string; bass: string } }> | null {
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

  const slots: Array<{
    voices: { soprano: string; alto: string; tenor: string; bass: string };
  }> = [];

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
      const soprano = sNotes[n]?.pitch ?? sNotes[sNotes.length - 1]?.pitch;
      const alto = aNotes[n]?.pitch ?? aNotes[aNotes.length - 1]?.pitch;
      const tenor = tNotes[n]?.pitch ?? tNotes[tNotes.length - 1]?.pitch;
      const bass = bNotes[n]?.pitch ?? bNotes[bNotes.length - 1]?.pitch;

      if (soprano && alto && tenor && bass) {
        slots.push({ voices: { soprano, alto, tenor, bass } });
      }
    }
  }

  return slots.length > 0 ? slots : null;
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
      const slots = scoreToSlots(score);
      if (!slots) return;

      try {
        const response = await fetch(`${ENGINE_URL}/api/validate-satb`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slots }),
        });

        if (!response.ok) return;

        const result = (await response.json()) as ValidationResult;
        store.setLastValidation(result);

        if (result.valid) {
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
        // Engine not reachable — silently skip audit
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

      for (const part of score.parts) {
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
    [store, sendMessage, requestSuggestion],
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
    clearMessages: store.clearMessages,
  };
}
