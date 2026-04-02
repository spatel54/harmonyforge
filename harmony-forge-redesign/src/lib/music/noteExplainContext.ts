/**
 * Deterministic “score facts” for Theory Inspector note explanations.
 * Used to ground LLM copy in the actual melody + surrounding harmony, not engine axioms alone.
 */

import type { EditableScore, Measure } from "./scoreTypes";
import type { VoiceKey } from "./theoryRules";
import { noteBeats } from "./scoreUtils";

const SATB_ORDER: VoiceKey[] = ["soprano", "alto", "tenor", "bass"];

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

function startBeatOfNoteIndex(measure: Measure, noteIdx: number): number {
  let b = 0;
  for (let i = 0; i < noteIdx; i++) {
    b += noteBeats(measure.notes[i]!);
  }
  return b;
}

/** Pitch or rest sounding at the start of [beat, beat+epsilon) in this measure. */
export function soundingPitchAtBeatStart(
  measure: Measure,
  beat: number,
): { kind: "pitch"; pitch: string } | { kind: "rest" } | { kind: "none" } {
  let cursor = 0;
  for (const note of measure.notes) {
    const len = noteBeats(note);
    if (beat >= cursor - 0.0001 && beat < cursor + len - 0.0001) {
      if (note.isRest) return { kind: "rest" };
      return { kind: "pitch", pitch: note.pitch };
    }
    cursor += len;
  }
  return { kind: "none" };
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
 * One-line-per-staff roster: input (staff 1) vs generated staves, using part names from the score.
 */
export function buildScorePartRosterLines(score: EditableScore): string[] {
  if (score.parts.length === 0) return [];
  if (score.parts.length === 1) {
    return [
      `FACT: Single staff — "${score.parts[0]!.name}" (no separate generated-harmony staves in this score).`,
    ];
  }
  const input = score.parts[0]!;
  const gen = score.parts.slice(1);
  const genSummary = gen.map((p, j) => `staff ${j + 2} "${p.name}"`).join("; ");
  return [
    `FACT: Staff 1 (input / user score): "${input.name}".`,
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
        ? `input — staff ${i + 1} "${part.name}"`
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
  const staffNum = score.parts.findIndex((p) => p.id === clickedPartId) + 1;
  const lines: string[] = [];

  lines.push(...buildScorePartRosterLines(score));
  lines.push(
    `FACT: Clicked note aligns at beat ${beat.toFixed(3)} within measure ${measureIdx + 1} (0 = downbeat), on staff ${staffNum} "${hp.name}".`,
  );

  for (let i = 0; i < score.parts.length; i++) {
    const part = score.parts[i]!;
    const meas = part.measures[measureIdx];
    if (!meas) continue;
    const hit = soundingPitchAtBeatStart(meas, beat);
    const label =
      hit.kind === "pitch"
        ? hit.pitch
        : hit.kind === "rest"
          ? "rest"
          : "no note / out of range";
    const role =
      score.parts.length > 1 && i === 0
        ? `input (user) — staff ${i + 1} "${part.name}"`
        : score.parts.length > 1
          ? `generated — staff ${i + 1} "${part.name}"`
          : `staff ${i + 1} "${part.name}"`;
    lines.push(`FACT: At that beat, ${role}: sounding ${label}.`);
  }

  const cur = hMeas.notes[clickedNoteIdx];
  if (cur && !cur.isRest) {
    lines.push(
      ...buildCrossPartIntervalFacts(score, measureIdx, beat, clickedPartId, cur.pitch),
    );

    if (clickedNoteIdx > 0) {
      const prev = hMeas.notes[clickedNoteIdx - 1]!;
      lines.push(
        `FACT: On this staff ("${hp.name}"), the note immediately before in the measure is ${prev.isRest ? "a rest" : prev.pitch}.`,
      );
    }
    if (clickedNoteIdx < hMeas.notes.length - 1) {
      const next = hMeas.notes[clickedNoteIdx + 1]!;
      lines.push(
        `FACT: On this staff ("${hp.name}"), the note immediately after in the measure is ${next.isRest ? "a rest" : next.pitch}.`,
      );
    }
    if (clickedNoteIdx === 0 && measureIdx > 0) {
      const prevMeas = hp.measures[measureIdx - 1];
      if (prevMeas && prevMeas.notes.length > 0) {
        const last = prevMeas.notes[prevMeas.notes.length - 1]!;
        lines.push(
          `FACT: On this staff ("${hp.name}"), the sounding event immediately before across the barline is ${last.isRest ? "a rest" : last.pitch} (end of measure ${measureIdx}).`,
        );
      }
    }
    if (clickedNoteIdx === hMeas.notes.length - 1 && measureIdx < hp.measures.length - 1) {
      const nextMeas = hp.measures[measureIdx + 1];
      if (nextMeas && nextMeas.notes.length > 0) {
        const first = nextMeas.notes[0]!;
        lines.push(
          `FACT: On this staff ("${hp.name}"), the sounding event immediately after across the barline is ${first.isRest ? "a rest" : first.pitch} (start of measure ${measureIdx + 2}).`,
        );
      }
    }
  }

  return lines;
}
