import type { VoiceKey } from "./theoryRules";

export type InspectorHighlightSeverity = "error" | "warning";

/** Mirrors engine / trace `rule` ids for stable tooltip copy. */
export type ScoreIssueRuleId =
  | "range"
  | "spacing"
  | "voiceOrder"
  | "parallelFifth"
  | "parallelOctave"
  | "voiceOverlap";

/** UI label aligned with local `detectIssueHighlights` and engine trace rules. */
export const CANONICAL_ISSUE_LABEL: Record<ScoreIssueRuleId, string> = {
  range: "Range violation",
  spacing: "Spacing violation",
  voiceOrder: "Voice order violation",
  parallelFifth: "Parallel fifth",
  parallelOctave: "Parallel octave",
  voiceOverlap: "Voice overlap",
};

export interface ScoreIssueHighlight {
  noteId: string;
  label: string;
  severity: InspectorHighlightSeverity;
  detail?: string;
  /** When set, hover copy can name the rule and parts accurately. */
  ruleId?: ScoreIssueRuleId;
  /** Voices involved (pair for parallels/spacing/overlap; one for range; four for order). */
  involvedVoices?: VoiceKey[];
}

const VOICE_LABEL: Record<VoiceKey, string> = {
  soprano: "soprano",
  alto: "alto",
  tenor: "tenor",
  bass: "bass",
};

function formatVoiceList(voices: VoiceKey[]): string {
  if (voices.length === 0) return "these parts";
  if (voices.length === 1) return `the ${VOICE_LABEL[voices[0]]} line`;
  if (voices.length === 2) {
    return `the ${VOICE_LABEL[voices[0]]} and ${VOICE_LABEL[voices[1]]} lines`;
  }
  return voices.map((v) => VOICE_LABEL[v]).join(", ");
}

function summaryFromRule(h: ScoreIssueHighlight): string | null {
  const { ruleId, involvedVoices = [] } = h;
  if (!ruleId) return null;

  switch (ruleId) {
    case "parallelFifth": {
      if (involvedVoices.length >= 2) {
        const [a, b] = involvedVoices;
        return (
          `The ${VOICE_LABEL[a]} and ${VOICE_LABEL[b]} both moved in the same direction, and you again have a perfect fifth between them—` +
          `same two interval classes in a row. Classical part-writing usually treats that as a parallel fifth and asks for a different voice-leading choice.`
        );
      }
      return (
        "Two harmony lines moved in the same direction and formed a perfect fifth again, like the previous chord—" +
        "that pattern is what people mean by parallel fifths, and classical rules normally avoid it."
      );
    }
    case "parallelOctave": {
      if (involvedVoices.length >= 2) {
        const [a, b] = involvedVoices;
        return (
          `The ${VOICE_LABEL[a]} and ${VOICE_LABEL[b]} both moved in the same direction, and you again have an octave or unison between them—` +
          `same doubled interval twice in a row. That is a parallel octave (or parallel unison), which classical writing usually softens or breaks up.`
        );
      }
      return (
        "Two lines moved together into another octave or unison—classical style often flags that as parallel octaves because the parts sound too doubled."
      );
    }
    case "voiceOverlap": {
      if (involvedVoices.length >= 2) {
        const [a, b] = involvedVoices;
        return (
          `As this chord arrived, ${VOICE_LABEL[a]} and ${VOICE_LABEL[b]} crossed in a way that puts one part above where the other had just been—` +
          `voice overlap can make it hard to hear who is supposed to be on top.`
        );
      }
      return "A lower part ended up above a higher part’s previous note (or the reverse)—that crossing is flagged as overlap.";
    }
    case "spacing": {
      if (involvedVoices.length >= 2) {
        const [a, b] = involvedVoices;
        const pair =
          (a === "soprano" && b === "alto") || (a === "alto" && b === "soprano")
            ? "Soprano and alto should usually stay within about an octave of each other."
            : (a === "alto" && b === "tenor") || (a === "tenor" && b === "alto")
              ? "Alto and tenor should usually stay within about an octave."
              : "Tenor and bass are spaced wider than a twelfth here—that is looser than typical SATB spacing.";
        return `${formatVoiceList(involvedVoices)} are farther apart than this checker allows. ${pair}`;
      }
      return "Two adjacent harmony lines are spaced wider than the usual SATB limits for that pair.";
    }
    case "range": {
      if (involvedVoices.length === 1) {
        return `This pitch sits outside the comfortable high/low band the checker uses for ${VOICE_LABEL[involvedVoices[0]]}.`;
      }
      return "This pitch is outside the usual choral range band for that voice in this checker.";
    }
    case "voiceOrder": {
      return (
        "The four parts are not stacked cleanly from high to low here—some line that should be lower is written above another, " +
        "so the checker marks a voice-order / crossing issue."
      );
    }
    default:
      return null;
  }
}

const LABEL_TO_RULE: Partial<Record<string, ScoreIssueRuleId>> = {
  "Range violation": "range",
  "Spacing violation": "spacing",
  "Voice order violation": "voiceOrder",
  "Parallel fifth": "parallelFifth",
  "Parallel octave": "parallelOctave",
  "Voice overlap": "voiceOverlap",
};

/** Hover tooltip for Theory Inspector score tint — plain language, optionally names the parts. */
export function laySummaryForIssueHighlight(h: ScoreIssueHighlight): string {
  const ruleId = h.ruleId ?? LABEL_TO_RULE[h.label];
  if (ruleId) {
    const fromRule = summaryFromRule({ ...h, ruleId });
    if (fromRule) return fromRule;
  }

  const t = h.label.trim();
  if (t.length > 0 && t.length <= 100) return t;
  if (t.length > 100) return `${t.slice(0, 97)}…`;
  return h.severity === "error"
    ? "Flagged as a hard rule issue by the checker."
    : "Flagged as a nuance or warning by the checker.";
}
