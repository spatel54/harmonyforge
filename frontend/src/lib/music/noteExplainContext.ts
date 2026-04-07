/**
 * Deterministic “score facts” for Theory Inspector note explanations.
 * Used to ground LLM copy in the actual melody + surrounding harmony, not engine axioms alone.
 */

import type { AuditedSlot } from "./theoryInspectorSlots";
import { buildMeasureFocusFacts } from "./regionExplainContext";
import type { EditableScore, Measure, Note } from "./scoreTypes";
import type { VoiceKey } from "./theoryRules";
import { getNoteById, noteBeats, parseMeasureBeats } from "./scoreUtils";

const SATB_ORDER: VoiceKey[] = ["soprano", "alto", "tenor", "bass"];

const DURATION_HUMAN: Record<string, string> = {
  w: "whole note",
  h: "half note",
  q: "quarter note",
  "8": "eighth note",
  "16": "sixteenth note",
  "32": "thirty-second note",
};

/**
 * Human-readable rhythm string for tutor FACT lines (duration + meter; paired with pitch in FACT lines).
 */
export function describeNotationForTutor(
  note: Note,
  measureQuarterBeats: number,
): string {
  const human = DURATION_HUMAN[note.duration] ?? `note type ${note.duration}`;
  const beats = noteBeats(note);
  const dots =
    note.dots && note.dots > 0 ? `; dotted (${note.dots} dot(s))` : "";
  const tie = note.tie ? `; tie: ${note.tie}` : "";
  return (
    `notated as ${human} (code ${note.duration})${dots}${tie}; ` +
    `spans ${beats} quarter-note beat(s); measure capacity ${measureQuarterBeats} quarter-note beat(s) (time signature on this bar)`
  );
}

/**
 * One loud FACT line so the tutor cannot claim duration is missing (also used in follow-up turns).
 */
/**
 * Single machine-obvious line: the model must treat this as visible notation.
 */
export function formatScoreDigestLine(params: {
  measureNumber1Based: number;
  beatInBar: number;
  note: Note;
  measureQuarterBeats: number;
  timeSignature?: string;
}): string {
  const { note, measureNumber1Based, beatInBar, measureQuarterBeats, timeSignature } =
    params;
  const human = DURATION_HUMAN[note.duration] ?? String(note.duration);
  const beats = noteBeats(note);
  const sound = note.isRest ? "REST" : note.pitch;
  const ts =
    timeSignature?.trim() ||
    `${measureQuarterBeats} quarter-note beats per bar (no explicit timeSignature string)`;
  return (
    `SCORE_DIGEST: bar=${measureNumber1Based} beatInBar=${beatInBar.toFixed(3)} ` +
    `sound=${sound} writtenDuration=${human} durationCode=${note.duration} quarterNoteSpan=${beats} ` +
    `barQuarterCapacity=${measureQuarterBeats} timeSignature=${ts}`
  );
}

/** Digest for a `getNoteById` hit (SATB / any single-note explain). */
export function formatScoreDigestForFoundHit(hit: {
  measure: Measure;
  note: Note;
  measureIdx: number;
  noteIdx: number;
}): string {
  const mb = parseMeasureBeats(hit.measure.timeSignature);
  const beat = startBeatOfNoteIndex(hit.measure, hit.noteIdx);
  return formatScoreDigestLine({
    measureNumber1Based: hit.measureIdx + 1,
    beatInBar: beat,
    note: hit.note,
    measureQuarterBeats: mb,
    timeSignature: hit.measure.timeSignature,
  });
}

export function formatAuthoritativeDurationFact(
  note: Note,
  measureQuarterBeats: number,
  timeSignature?: string,
): string {
  const human =
    DURATION_HUMAN[note.duration] ?? `unknown type (${String(note.duration)})`;
  const beats = noteBeats(note);
  const dots =
    note.dots && note.dots > 0 ? `; dotted (${note.dots} dot(s))` : "";
  const tie = note.tie ? `; tie: ${note.tie}` : "";
  const tsLabel =
    timeSignature?.trim() || `${measureQuarterBeats} quarter-note beats per bar (no explicit timeSignature string on measure)`;
  const head = note.isRest ? "Clicked REST" : `Clicked pitch ${note.pitch}`;
  return (
    `FACT: AUTHORITATIVE NOTATION — ${head}: **${human}** (code ${note.duration})${dots}${tie}; ` +
    `spans **${beats}** quarter-note beat(s); bar capacity **${measureQuarterBeats}** qn beats; time signature **${tsLabel}**.`
  );
}

const PC_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

function pitchToMidi(pitch: string): number {
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return 60;
  const step = m[1] ?? "C";
  const octNum = parseInt(m[3] ?? "4", 10);
  const stepSemi: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  let semitones = (stepSemi[step] ?? 0) + (octNum - 4) * 12;
  if (m[2] === "#") semitones += 1;
  if (m[2] === "b") semitones -= 1;
  return 60 + semitones;
}

function uniquePitchClassNames(pitches: string[]): string {
  const pcs = [...new Set(pitches.map((p) => ((pitchToMidi(p) % 12) + 12) % 12))].sort(
    (a, b) => a - b,
  );
  return pcs.map((pc) => PC_NAMES[pc] ?? "?").join(", ");
}

/** Exported for tests. */
export function describeSimpleInterval(semitonesAbs: number): string {
  const withinOctave = semitonesAbs % 12;
  const octaves = Math.floor(semitonesAbs / 12);
  const names: Record<number, string> = {
    0: "unison / octave",
    1: "minor second",
    2: "major second",
    3: "minor third",
    4: "major third",
    5: "perfect fourth",
    6: "tritone",
    7: "perfect fifth",
    8: "minor sixth",
    9: "major sixth",
    10: "minor seventh",
    11: "major seventh",
  };
  const core = names[withinOctave] ?? `${withinOctave} semitones`;
  return octaves > 0 ? `${core} (spanning ${octaves} extra octave(s) overall)` : core;
}

/** Beat offset of note `noteIdx` within the measure (for aligning parts at the same moment). */
export function startBeatOfNoteIndex(measure: Measure, noteIdx: number): number {
  let b = 0;
  for (let i = 0; i < noteIdx; i++) {
    b += noteBeats(measure.notes[i]!);
  }
  return b;
}

/** Note or rest sounding at the start of [beat, beat+epsilon) in this measure. */
export function soundingNoteAtBeatStart(
  measure: Measure,
  beat: number,
): { kind: "hit"; note: Note } | { kind: "none" } {
  let cursor = 0;
  for (const note of measure.notes) {
    const len = noteBeats(note);
    if (beat >= cursor - 0.0001 && beat < cursor + len - 0.0001) {
      return { kind: "hit", note };
    }
    cursor += len;
  }
  return { kind: "none" };
}

/** Pitch or rest sounding at the start of [beat, beat+epsilon) in this measure. */
export function soundingPitchAtBeatStart(
  measure: Measure,
  beat: number,
): { kind: "pitch"; pitch: string } | { kind: "rest" } | { kind: "none" } {
  const sn = soundingNoteAtBeatStart(measure, beat);
  if (sn.kind === "none") return { kind: "none" };
  const { note } = sn;
  if (note.isRest) return { kind: "rest" };
  return { kind: "pitch", pitch: note.pitch };
}

export interface AuditedSlotLike {
  voices: Record<VoiceKey, string>;
}

export interface SatbNoteContextOptions {
  /** Part names for each SATB role (e.g. instrument / staff name from the score). */
  voiceStaffNames?: Partial<Record<VoiceKey, string>>;
}

function staffLabel(voice: VoiceKey, opts?: SatbNoteContextOptions): string {
  const n = opts?.voiceStaffNames?.[voice];
  return n ? `"${n}" (${voice})` : voice;
}

/**
 * Per-voice rhythm + pitch FACTs at one SATB chord moment (from live score note ids).
 */
export function buildSatbRhythmContextLines(
  score: EditableScore,
  auditedSlots: AuditedSlot[],
  slotIndex: number,
  opts?: SatbNoteContextOptions,
): string[] {
  const slot = auditedSlots[slotIndex];
  if (!slot) return [];

  const lines: string[] = [
    "FACT: Notation at this chord moment (rhythm + pitch per voice — part of the full vertical snapshot):",
  ];

  for (const vk of SATB_ORDER) {
    const id = slot.noteIds[vk];
    if (!id) continue;
    const hit = getNoteById(score, id);
    if (!hit) continue;
    const { note, measure } = hit;
    const meter = parseMeasureBeats(measure.timeSignature);
    const label = staffLabel(vk, opts);
    if (note.isRest) {
      lines.push(`FACT: ${label}: rest — ${describeNotationForTutor(note, meter)}`);
    } else {
      lines.push(
        `FACT: ${label}: pitch ${note.pitch} — ${describeNotationForTutor(note, meter)}`,
      );
    }
  }

  return lines;
}

/**
 * Four-part aligned score: melody = soprano at this slice; full vertical + motion.
 */
export function buildSatbNoteContextLines(
  auditedSlots: AuditedSlotLike[],
  slotIndex: number,
  voice: VoiceKey,
  opts?: SatbNoteContextOptions,
): string[] {
  const slot = auditedSlots[slotIndex];
  if (!slot) return [];

  const { soprano, alto, tenor, bass } = slot.voices;
  const lines: string[] = [];
  lines.push(
    `FACT: At this moment ${staffLabel("soprano", opts)} sounds ${soprano} (top line = input melody for this four-staff layout).`,
  );
  lines.push(
    `FACT: All four staves at this same moment (high → low) — ${staffLabel("soprano", opts)}: ${soprano}; ${staffLabel("alto", opts)}: ${alto}; ${staffLabel("tenor", opts)}: ${tenor}; ${staffLabel("bass", opts)}: ${bass}.`,
  );
  lines.push(
    `FACT: Pitch classes present at this moment (unordered): ${uniquePitchClassNames([soprano, alto, tenor, bass])}.`,
  );

  const clickedPitch = slot.voices[voice];
  const clickedMidi = pitchToMidi(clickedPitch);
  const melMidi = pitchToMidi(soprano);
  const semisMelodyToClicked = clickedMidi - melMidi;
  const absMel = Math.abs(semisMelodyToClicked);
  lines.push(
    `FACT: Your clicked note on ${staffLabel(voice, opts)} (${clickedPitch}) is ${absMel} semitones ${semisMelodyToClicked < 0 ? "below" : semisMelodyToClicked > 0 ? "above" : "at the same pitch as"} the melody note on ${staffLabel("soprano", opts)} (${soprano}) (${describeSimpleInterval(absMel)}).`,
  );

  for (const other of SATB_ORDER) {
    if (other === voice) continue;
    const op = slot.voices[other];
    const d = Math.abs(clickedMidi - pitchToMidi(op));
    lines.push(
      `FACT: Interval from clicked ${staffLabel(voice, opts)} (${clickedPitch}) to ${staffLabel(other, opts)} (${op}): ${d} semitone${d === 1 ? "" : "s"} (${describeSimpleInterval(d)}).`,
    );
  }

  if (slotIndex > 0) {
    const prev = auditedSlots[slotIndex - 1];
    if (prev) {
      const was = prev.voices[voice];
      const now = slot.voices[voice];
      const d = pitchToMidi(now) - pitchToMidi(was);
      lines.push(
        `FACT: On the line you clicked, the previous chord moment had ${was}; now it is ${now} (${d === 0 ? "same pitch" : d > 0 ? `${d} semitones higher` : `${-d} semitones lower`}).`,
      );
      lines.push(
        `FACT: Melody on ${staffLabel("soprano", opts)} moved from ${prev.voices.soprano} to ${soprano} between the previous moment and this one.`,
      );
    }
  }

  if (slotIndex < auditedSlots.length - 1) {
    const nextSlot = auditedSlots[slotIndex + 1];
    if (nextSlot) {
      const now = slot.voices[voice];
      const nxt = nextSlot.voices[voice];
      const d = pitchToMidi(nxt) - pitchToMidi(now);
      lines.push(
        `FACT: On the line you clicked, this chord moment is ${now}; the next chord moment is ${nxt} (${d === 0 ? "same pitch" : d > 0 ? `${d} semitones higher` : `${-d} semitones lower`}).`,
      );
      lines.push(
        `FACT: Melody on ${staffLabel("soprano", opts)} will move from ${soprano} to ${nextSlot.voices.soprano} at the next chord moment.`,
      );
    }
  }

  return lines;
}

/** Tutor FACT when the user changed pitch since generation. */
export function buildPitchEditDeltaFact(
  originalPitch: string,
  currentPitch: string,
): string | null {
  if (originalPitch === currentPitch) return null;
  const a = pitchToMidi(originalPitch);
  const b = pitchToMidi(currentPitch);
  const d = b - a;
  const abs = Math.abs(d);
  return `FACT: Pitch edit — HarmonyForge originally wrote ${originalPitch}; the score now shows ${currentPitch} (${abs} semitone${abs === 1 ? "" : "s"} ${d > 0 ? "higher" : "lower"} than the generated pitch).`;
}

/**
 * One-line-per-staff roster: Melody (staff 1) vs generated staves when multiple parts.
 */
export function buildScorePartRosterLines(score: EditableScore): string[] {
  if (score.parts.length === 0) return [];
  if (score.parts.length === 1) {
    return [
      `FACT: Single staff — "${score.parts[0]!.name}" (no separate generated-harmony staves in this score).`,
    ];
  }
  const gen = score.parts.slice(1);
  const genSummary = gen.map((p, j) => `staff ${j + 2} "${p.name}"`).join("; ");
  return [
    `FACT: Staff 1: Melody (user input).`,
    `FACT: Generated harmony staves (${gen.length}): ${genSummary}.`,
  ];
}

/**
 * Intervals from the clicked pitch to every other staff that has a pitch at the same beat.
 * Order: input staff first (if not clicked), then generated staves in score order.
 */
export function buildCrossPartIntervalFacts(
  score: EditableScore,
  measureIdx: number,
  beat: number,
  clickedPartId: string,
  clickedPitch: string,
): string[] {
  const clickedIdx = score.parts.findIndex((p) => p.id === clickedPartId);
  if (clickedIdx < 0 || score.parts.length <= 1) return [];

  const clickedMidi = pitchToMidi(clickedPitch);
  const order: number[] = [];
  if (clickedIdx !== 0) order.push(0);
  for (let i = 1; i < score.parts.length; i++) {
    if (i !== clickedIdx) order.push(i);
  }

  const lines: string[] = [];
  for (const i of order) {
    const part = score.parts[i]!;
    const meas = part.measures[measureIdx];
    if (!meas) continue;
    const hit = soundingPitchAtBeatStart(meas, beat);
    if (hit.kind !== "pitch") continue;
    const otherMidi = pitchToMidi(hit.pitch);
    const raw = otherMidi - clickedMidi;
    const abs = Math.abs(raw);
    const role =
      i === 0
        ? `Melody (user input) — staff ${i + 1}`
        : `generated — staff ${i + 1} "${part.name}"`;
    lines.push(
      `FACT: Interval from clicked pitch ${clickedPitch} to ${role}, sounding ${hit.pitch}: ${abs} semitone${abs === 1 ? "" : "s"} (${describeSimpleInterval(abs)}).`,
    );
  }
  return lines;
}

/**
 * Additive / non-SATB: align by measure + beat where the clicked note starts; snapshot every staff.
 */
export function buildAdditiveNoteContextLines(
  score: EditableScore,
  measureIdx: number,
  clickedNoteIdx: number,
  clickedPartId: string,
): string[] {
  const hp = score.parts.find((p) => p.id === clickedPartId);
  const hMeas = hp?.measures[measureIdx];
  if (!hp || !hMeas) return [];

  const beat = startBeatOfNoteIndex(hMeas, clickedNoteIdx);
  const clickedEvt = hMeas.notes[clickedNoteIdx];
  const mbClick = parseMeasureBeats(hMeas.timeSignature);
  const staffNum = score.parts.findIndex((p) => p.id === clickedPartId) + 1;
  const lines: string[] = [];

  lines.push(
    "=== NOTATION PROVIDED TO YOU (deterministic export from the editor — this IS what you can read as the score) ===",
  );
  if (clickedEvt) {
    lines.push(
      formatScoreDigestLine({
        measureNumber1Based: measureIdx + 1,
        beatInBar: beat,
        note: clickedEvt,
        measureQuarterBeats: mbClick,
        timeSignature: hMeas.timeSignature,
      }),
    );
  }

  lines.push(...buildScorePartRosterLines(score));
  const clickedStaffLabel =
    score.parts.length > 1 && score.parts[0]?.id === clickedPartId
      ? "Melody"
      : hp.name;
  lines.push(
    `FACT: Clicked note aligns at beat ${beat.toFixed(3)} within measure ${measureIdx + 1} (0 = downbeat), on staff ${staffNum} "${clickedStaffLabel}".`,
  );

  if (clickedEvt) {
    lines.push(
      formatAuthoritativeDurationFact(clickedEvt, mbClick, hMeas.timeSignature),
    );
    lines.push(
      `FACT: Clicked event — ${clickedEvt.isRest ? "rest" : `pitch ${clickedEvt.pitch}`}; ${describeNotationForTutor(clickedEvt, mbClick)}`,
    );
  }

  for (let i = 0; i < score.parts.length; i++) {
    const part = score.parts[i]!;
    const meas = part.measures[measureIdx];
    if (!meas) continue;
    const sn = soundingNoteAtBeatStart(meas, beat);
    const mb = parseMeasureBeats(meas.timeSignature);
    const role =
      score.parts.length > 1 && i === 0
        ? `Melody (user input) — staff ${i + 1}`
        : score.parts.length > 1
          ? `generated — staff ${i + 1} "${part.name}"`
          : `staff ${i + 1} "${part.name}"`;
    if (sn.kind === "none") {
      lines.push(`FACT: At that beat, ${role}: no note / out of range.`);
      continue;
    }
    const n = sn.note;
    if (n.isRest) {
      lines.push(
        `FACT: At that beat, ${role}: rest — ${describeNotationForTutor(n, mb)}`,
      );
    } else {
      lines.push(
        `FACT: At that beat, ${role}: pitch ${n.pitch} — ${describeNotationForTutor(n, mb)}`,
      );
    }
  }

  lines.push(
    "",
    "=== NOTE_IDS_FOR_IDEA_ACTIONS (copy a noteId below **exactly** into <<<IDEA_ACTIONS>>> JSON; never invent ids) ===",
  );
  for (let i = 0; i < score.parts.length; i++) {
    const part = score.parts[i]!;
    const meas = part.measures[measureIdx];
    if (!meas) continue;
    const sn = soundingNoteAtBeatStart(meas, beat);
    if (sn.kind !== "hit") continue;
    const role =
      score.parts.length > 1 && i === 0
        ? `Melody (staff ${i + 1})`
        : `staff ${i + 1}`;
    lines.push(
      `FACT: NOTE_ID ${role} "${part.name}" pitch=${sn.note.isRest ? "REST" : sn.note.pitch} noteId=${sn.note.id}`,
    );
  }

  const cur = hMeas.notes[clickedNoteIdx];
  if (cur && !cur.isRest) {
    lines.push(
      ...buildCrossPartIntervalFacts(score, measureIdx, beat, clickedPartId, cur.pitch),
    );

    const mbLocal = parseMeasureBeats(hMeas.timeSignature);
    if (clickedNoteIdx > 0) {
      const prev = hMeas.notes[clickedNoteIdx - 1]!;
      lines.push(
        `FACT: On this staff ("${clickedStaffLabel}"), the event immediately before in the measure: ${prev.isRest ? "rest" : prev.pitch} — ${describeNotationForTutor(prev, mbLocal)}`,
      );
    }
    if (clickedNoteIdx < hMeas.notes.length - 1) {
      const next = hMeas.notes[clickedNoteIdx + 1]!;
      lines.push(
        `FACT: On this staff ("${clickedStaffLabel}"), the event immediately after in the measure: ${next.isRest ? "rest" : next.pitch} — ${describeNotationForTutor(next, mbLocal)}`,
      );
    }
    if (clickedNoteIdx === 0 && measureIdx > 0) {
      const prevMeas = hp.measures[measureIdx - 1];
      if (prevMeas && prevMeas.notes.length > 0) {
        const last = prevMeas.notes[prevMeas.notes.length - 1]!;
        const mbPrev = parseMeasureBeats(prevMeas.timeSignature);
        lines.push(
          `FACT: On this staff ("${clickedStaffLabel}"), the event immediately before across the barline: ${last.isRest ? "rest" : last.pitch} — ${describeNotationForTutor(last, mbPrev)} (end of measure ${measureIdx}).`,
        );
      }
    }
    if (clickedNoteIdx === hMeas.notes.length - 1 && measureIdx < hp.measures.length - 1) {
      const nextMeas = hp.measures[measureIdx + 1];
      if (nextMeas && nextMeas.notes.length > 0) {
        const first = nextMeas.notes[0]!;
        const mbNext = parseMeasureBeats(nextMeas.timeSignature);
        lines.push(
          `FACT: On this staff ("${clickedStaffLabel}"), the event immediately after across the barline: ${first.isRest ? "rest" : first.pitch} — ${describeNotationForTutor(first, mbNext)} (start of measure ${measureIdx + 2}).`,
        );
      }
    }
  }

  const { lines: measureLines } = buildMeasureFocusFacts(score, measureIdx);
  lines.push(
    "---",
    "FULL BAR (all staves; event order left-to-right in this measure — confirms rhythm against the whole bar):",
    ...measureLines,
  );

  return lines;
}
