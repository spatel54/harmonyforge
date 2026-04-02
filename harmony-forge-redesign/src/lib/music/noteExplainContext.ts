/**
 * Deterministic “score facts” for Theory Inspector note explanations.
 * Used to ground LLM copy in the actual melody + surrounding harmony, not engine axioms alone.
 */

import type { EditableScore, Measure } from "./scoreTypes";
import type { VoiceKey } from "./theoryRules";
import { noteBeats } from "./scoreUtils";

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

function describeSimpleInterval(semitonesAbs: number): string {
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

/**
 * Four-part aligned score: melody = soprano at this slice; full vertical + motion.
 */
export function buildSatbNoteContextLines(
  auditedSlots: AuditedSlotLike[],
  slotIndex: number,
  voice: VoiceKey,
): string[] {
  const slot = auditedSlots[slotIndex];
  if (!slot) return [];

  const { soprano, alto, tenor, bass } = slot.voices;
  const lines: string[] = [];
  lines.push(`FACT: At this moment the top line (treated as the melody for this layout) sounds ${soprano}.`);
  lines.push(
    `FACT: All four parts at this same moment (high → low): ${soprano}, ${alto}, ${tenor}, ${bass}.`,
  );
  lines.push(
    `FACT: Pitch classes present at this moment (unordered): ${uniquePitchClassNames([soprano, alto, tenor, bass])}.`,
  );

  const melMidi = pitchToMidi(soprano);
  const clickedMidi = pitchToMidi(slot.voices[voice]);
  const semisMelodyToClicked = clickedMidi - melMidi;
  const abs = Math.abs(semisMelodyToClicked);
  lines.push(
    `FACT: Your clicked note ${slot.voices[voice]} is ${abs} semitones ${semisMelodyToClicked < 0 ? "below" : semisMelodyToClicked > 0 ? "above" : "at the same pitch as"} the melody note ${soprano} (${describeSimpleInterval(abs)}).`,
  );

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
        `FACT: Melody moved from ${prev.voices.soprano} to ${soprano} between the previous moment and this one.`,
      );
    }
  }

  return lines;
}

/**
 * Additive / non-SATB: align by measure + beat where the harmony note starts; snapshot every staff.
 */
export function buildAdditiveNoteContextLines(
  score: EditableScore,
  measureIdx: number,
  harmonyNoteIdx: number,
  harmonyPartId: string,
): string[] {
  const hp = score.parts.find((p) => p.id === harmonyPartId);
  const hMeas = hp?.measures[measureIdx];
  if (!hp || !hMeas) return [];

  const beat = startBeatOfNoteIndex(hMeas, harmonyNoteIdx);
  const lines: string[] = [];
  lines.push(
    `FACT: This harmony note starts at beat offset ${beat.toFixed(3)} within measure ${measureIdx + 1} (0 = downbeat).`,
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
    const role = i === 0 ? "input melody (first staff)" : "harmony";
    lines.push(`FACT: ${role} — part "${part.name}": at that beat, sounding ${label}.`);
  }

  const cur = hMeas.notes[harmonyNoteIdx];
  if (cur && !cur.isRest) {
    if (harmonyNoteIdx > 0) {
      const prev = hMeas.notes[harmonyNoteIdx - 1]!;
      lines.push(
        `FACT: On this harmony part, the note immediately before in the measure is ${prev.isRest ? "a rest" : prev.pitch}.`,
      );
    }
    if (harmonyNoteIdx < hMeas.notes.length - 1) {
      const next = hMeas.notes[harmonyNoteIdx + 1]!;
      lines.push(
        `FACT: On this harmony part, the note immediately after in the measure is ${next.isRest ? "a rest" : next.pitch}.`,
      );
    }
  }

  return lines;
}
