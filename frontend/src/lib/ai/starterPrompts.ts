/**
 * Contextual starter prompts for the Theory Inspector empty state (Iter1 §3).
 *
 * The participant said: "I just don't know what question to ask" — these are
 * small, clickable chips that match the current focus so the empty chat
 * never feels blank.
 */

import type { InspectorScoreFocus } from "@/store/useTheoryInspectorStore";

export interface StarterPrompt {
  id: string;
  label: string;
  /** Verbatim text sent to the tutor chat when the chip is clicked. */
  prompt: string;
}

const DEFAULT_STARTERS: StarterPrompt[] = [
  {
    id: "check-voice-leading",
    label: "Check my voice leading",
    prompt: "Please audit my score for voice-leading issues and summarize the three most important things to improve.",
  },
  {
    id: "suggest-passing",
    label: "Suggest a passing chord here",
    prompt: "Can you suggest a passing chord at my cursor or in the focused bar that would smooth the voice leading?",
  },
  {
    id: "explain-chord",
    label: "Explain this chord",
    prompt: "Explain the current chord at my cursor: its function, how it relates to the previous and next chord, and any common moves I might try.",
  },
  {
    id: "check-pickup",
    label: "Is the pickup aligned?",
    prompt: "Does my score have a pickup measure (anacrusis), and is the generated harmony aligned to the first downbeat rather than the pickup?",
  },
];

const MEASURE_STARTERS: StarterPrompt[] = [
  {
    id: "explain-bar",
    label: "What is happening in this bar?",
    prompt: "Explain what is happening harmonically and rhythmically in the focused bar. Keep it to 3–5 bullets.",
  },
  {
    id: "edit-bar",
    label: "Edit this bar",
    prompt: "Suggest concrete pitch edits for the focused bar that improve voice leading without changing the melody.",
  },
  {
    id: "bar-why",
    label: "Why this voicing?",
    prompt: "Why did the engine pick this voicing in this bar? Mention the most important SATB constraint it was respecting.",
  },
];

const PART_STARTERS: StarterPrompt[] = [
  {
    id: "explain-part",
    label: "Audit this part",
    prompt: "Audit this part in isolation: range, direction, independence from the other voices. 3–5 bullets max.",
  },
  {
    id: "smooth-part",
    label: "Smoother line?",
    prompt: "Can this part be made more melodically coherent without breaking the current harmonies?",
  },
];

const NOTE_STARTERS: StarterPrompt[] = [
  {
    id: "note-why",
    label: "Why this note?",
    prompt: "Why is the selected note there, and what would change if I moved it up or down a step?",
  },
  {
    id: "note-try",
    label: "Try a different pitch",
    prompt: "Suggest one or two alternative pitches for the selected note that would still fit the harmony.",
  },
];

/**
 * Resolve the best starter prompt set for the current inspector focus.
 * Falls back to default chips when no focus is set.
 */
export function resolveStarterPrompts(
  focus: InspectorScoreFocus | null,
): StarterPrompt[] {
  if (!focus) return DEFAULT_STARTERS;
  switch (focus.kind) {
    case "note":
      return NOTE_STARTERS;
    case "measure":
      return MEASURE_STARTERS;
    case "part":
      return PART_STARTERS;
    default:
      return DEFAULT_STARTERS;
  }
}
