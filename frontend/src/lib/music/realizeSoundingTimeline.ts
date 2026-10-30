/**
 * Expand EditableScore into a sounding timeline with dynamics, articulations, ornaments, and repeats.
 */
import type { EditableScore, Measure, Note } from "./scoreTypes";
import { pitchLetterOctave, pitchStringToMidi, transposePitchString } from "./pitchMidi";
import { noteBeats, parseMeasureBeats } from "./scoreUtils";

export type SoundingEvent = {
  startBeat: number;
  pitch: string;
  /** RiffScore pitch key (letter+octave, accidentals stripped). */
  rsPitch: string;
  durationBeats: number;
  velocity: number;
  partName: string;
  partIndex: number;
  measureIndex: number;
};

const PITCH_RE = /^[A-G](?:#{1,2}|b{1,2})?\d+$/;

export const DYN_VEL: Record<string, number> = {
  ppp: 20,
  pp: 32,
  p: 44,
  mp: 60,
  mf: 76,
  f: 92,
  ff: 108,
  fff: 120,
  sfz: 118,
  fp: 100,
};

function isInstantDynamic(dyn: string | undefined): dyn is string {
  return !!dyn && dyn in DYN_VEL;
}

function articDurationFactor(note: Note, slurred: boolean): number {
  const arts = note.articulations ?? [];
  if (arts.includes("staccatissimo") && !slurred) return 0.25;
  if (arts.includes("a.") && !slurred) return 0.5;
  if (arts.includes("fermata")) return 2;
  if (arts.includes("a-") || slurred) return 1.08;
  return 1;
}

function articVelocityBoost(note: Note): number {
  const arts = note.articulations ?? [];
  if (arts.includes("a^")) return 22;
  if (arts.includes("a>")) return 18;
  return 0;
}

function neighborPitch(pitch: string, semitones: number): string | null {
  const midi = pitchStringToMidi(pitch);
  if (midi === null) return null;
  const next = midi + semitones;
  if (next < 0 || next > 127) return null;
  return transposePitchString(pitch, semitones);
}

function realizeOrnamentNotes(
  note: Note,
  soundingPitch: string,
  startBeat: number,
  dur: number,
  vel: number,
  partName: string,
  partIndex: number,
  measureIndex: number,
): SoundingEvent[] {
  if (!note.ornament || note.isRest) return [];
  const out: SoundingEvent[] = [];
  const mainDur = dur * 0.55;
  const graceDur = dur * 0.15;
  const base = { partName, partIndex, measureIndex };
  const push = (beat: number, pitch: string, durationBeats: number, velocity: number) => {
    out.push({
      startBeat: beat,
      pitch,
      rsPitch: pitchLetterOctave(pitch),
      durationBeats,
      velocity,
      ...base,
    });
  };
  if (note.ornament === "trill" || note.ornament === "trill-mark") {
    const upper = neighborPitch(soundingPitch, 2);
    if (upper) {
      push(startBeat, soundingPitch, graceDur, vel);
      push(startBeat + graceDur, upper, graceDur, vel - 6);
      push(startBeat + graceDur * 2, soundingPitch, mainDur, vel);
      return out;
    }
  }
  if (note.ornament === "mordent" || note.ornament === "inverted-mordent") {
    const neighbor = neighborPitch(soundingPitch, note.ornament === "mordent" ? -2 : 2);
    if (neighbor) {
      push(startBeat, soundingPitch, graceDur, vel);
      push(startBeat + graceDur, neighbor, graceDur, vel - 4);
      push(startBeat + graceDur * 2, soundingPitch, mainDur, vel);
      return out;
    }
  }
  if (note.ornament === "turn") {
    const u = neighborPitch(soundingPitch, 2);
    const l = neighborPitch(soundingPitch, -2);
    if (u && l) {
      push(startBeat, soundingPitch, graceDur, vel);
      push(startBeat + graceDur, u, graceDur, vel - 4);
      push(startBeat + graceDur * 2, soundingPitch, graceDur, vel);
      push(startBeat + graceDur * 3, l, graceDur, vel - 4);
      push(startBeat + graceDur * 4, soundingPitch, mainDur, vel);
      return out;
    }
  }
  return [];
}

type Walked = {
  note: Note;
  startBeat: number;
  writtenDur: number;
  measureIndex: number;
  partIndex: number;
  partName: string;
  soundingPitch: string;
  slurred: boolean;
};

function findNextInstantIndex(walked: Walked[], from: number): number | null {
  for (let i = from; i < walked.length; i++) {
    if (isInstantDynamic(walked[i]!.note.dynamics)) return i;
  }
  return null;
}

function lastIndexInMeasure(walked: Walked[], start: number, minSpan: number): number {
  const measureIndex = walked[start]!.measureIndex;
  let end = start;
  for (let i = start; i < walked.length; i++) {
    if (walked[i]!.measureIndex !== measureIndex && i - start >= minSpan) break;
    end = i;
    if (i - start >= 6) break;
  }
  return Math.max(end, Math.min(walked.length - 1, start + minSpan));
}

function applyLerp(
  walked: Walked[],
  vel: number[],
  start: number,
  end: number,
  from: number,
  to: number,
): void {
  if (end <= start) {
    vel[start] = to;
    return;
  }
  const b0 = walked[start]!.startBeat;
  const b1 = walked[end]!.startBeat;
  const span = Math.max(1e-6, b1 - b0);
  for (let i = start; i <= end; i++) {
    const t = (walked[i]!.startBeat - b0) / span;
    vel[i] = Math.round(from + (to - from) * t);
  }
}

function velocitiesForWalked(walked: Walked[]): number[] {
  const n = walked.length;
  const vel = new Array<number>(n).fill(76);
  if (n === 0) return vel;

  let current = 76;
  for (let i = 0; i < n; i++) {
    const d = walked[i]!.note.dynamics;
    if (d === "sfz") {
      vel[i] = DYN_VEL.sfz;
      continue;
    }
    if (d === "fp") {
      vel[i] = DYN_VEL.fp;
      current = DYN_VEL.p;
      continue;
    }
    if (isInstantDynamic(d)) current = DYN_VEL[d]!;
    vel[i] = current;
  }

  let openCresc: number | null = null;
  let openDim: number | null = null;
  for (let i = 0; i < n; i++) {
    const note = walked[i]!.note;
    if (note.lineStart === "cresc-hairpin") openCresc = i;
    if (note.lineStart === "decresc-hairpin") openDim = i;
    if (note.lineEnd === "cresc-hairpin" && openCresc != null) {
      const from = vel[openCresc]!;
      const next = findNextInstantIndex(walked, i);
      const to = next != null ? vel[next]! : Math.min(120, from + 28);
      applyLerp(walked, vel, openCresc, i, from, to);
      openCresc = null;
    }
    if (note.lineEnd === "decresc-hairpin" && openDim != null) {
      const from = vel[openDim]!;
      const next = findNextInstantIndex(walked, i);
      const to = next != null ? vel[next]! : Math.max(20, from - 28);
      applyLerp(walked, vel, openDim, i, from, to);
      openDim = null;
    }
  }
  if (openCresc != null) {
    const from = vel[openCresc]!;
    applyLerp(walked, vel, openCresc, n - 1, from, Math.min(120, from + 28));
  }
  if (openDim != null) {
    const from = vel[openDim]!;
    applyLerp(walked, vel, openDim, n - 1, from, Math.max(20, from - 28));
  }

  for (let i = 0; i < n; i++) {
    const d = walked[i]!.note.dynamics;
    if (d !== "cresc." && d !== "dim.") continue;
    const instant = findNextInstantIndex(walked, i + 1);
    const end = instant ?? lastIndexInMeasure(walked, i, 3);
    const from = vel[i]!;
    const to =
      instant != null
        ? vel[instant]!
        : d === "cresc."
          ? Math.min(120, from + 28)
          : Math.max(20, from - 28);
    applyLerp(walked, vel, i, end, from, to);
  }

  for (let i = 0; i < n; i++) {
    vel[i] = Math.min(127, Math.max(1, (vel[i] ?? 76) + articVelocityBoost(walked[i]!.note)));
  }
  return vel;
}

type RawEvent = SoundingEvent;

function collectRawEvents(score: EditableScore, beatsPerMeasureDefault = 4): RawEvent[] {
  const events: RawEvent[] = [];
  score.parts.forEach((part, partIndex) => {
    let partBeatCursor = 0;
    const name = part.name?.trim() || "Part";
    const walked: Walked[] = [];
    let octaveShift = 0;
    let slurred = false;

    part.measures.forEach((measure, measureIndex) => {
      const measureBeats = parseMeasureBeats(measure.timeSignature, beatsPerMeasureDefault);
      const measureStart = partBeatCursor;
      let currentBeat = measureStart;
      for (const note of measure.notes) {
        const writtenDur = noteBeats(note);
        if (note.lineStart === "8va") octaveShift = 12;
        if (note.lineStart === "8vb") octaveShift = -12;
        if (note.lineStart === "slur") slurred = true;
        const soundingPitch =
          !note.isRest && PITCH_RE.test(note.pitch) && octaveShift !== 0
            ? transposePitchString(note.pitch, octaveShift)
            : note.pitch;
        walked.push({
          note,
          startBeat: currentBeat,
          writtenDur,
          measureIndex,
          partIndex,
          partName: name,
          soundingPitch,
          slurred,
        });
        if (note.articulations?.includes("breath-mark")) currentBeat += 0.25;
        if (note.articulations?.includes("caesura")) currentBeat += 0.5;
        if (note.articulations?.includes("fermata")) currentBeat += 0.5;
        currentBeat += writtenDur;
        if (note.lineEnd === "8va" || note.lineEnd === "8vb") octaveShift = 0;
        if (note.lineEnd === "slur") slurred = false;
      }
      partBeatCursor = Math.max(measureStart + measureBeats, currentBeat);
    });

    events.push(...emitWalkedEvents(walked));
  });
  return events;
}

function isTied(note: Note): boolean {
  return note.tie === "start" || note.tie === "continue" || note.tie === "stop";
}

function emitWalkedEvents(walked: Walked[]): RawEvent[] {
  const events: RawEvent[] = [];
  const vels = velocitiesForWalked(walked);
  const openTies = new Map<string, RawEvent>();

  const push = (
    item: Walked,
    startBeat: number,
    durationBeats: number,
    velocity: number,
  ): RawEvent => {
    const ev: RawEvent = {
      startBeat,
      pitch: item.soundingPitch,
      rsPitch: pitchLetterOctave(item.soundingPitch),
      durationBeats,
      velocity,
      partName: item.partName,
      partIndex: item.partIndex,
      measureIndex: item.measureIndex,
    };
    events.push(ev);
    return ev;
  };

  walked.forEach((item, i) => {
    const note = item.note;
    if (note.isRest || !PITCH_RE.test(item.soundingPitch)) return;
    const vel = vels[i] ?? 76;
    const dur = isTied(note)
      ? item.writtenDur
      : item.writtenDur * articDurationFactor(note, item.slurred);
    const tieKey = `${item.partIndex}:${item.soundingPitch}`;

    if (note.tie === "stop" || note.tie === "continue") {
      const prev = openTies.get(tieKey);
      if (prev) {
        prev.durationBeats += item.writtenDur;
        if (note.tie === "stop") openTies.delete(tieKey);
        return;
      }
    }

    if (note.ornament) {
      events.push(
        ...realizeOrnamentNotes(
          note,
          item.soundingPitch,
          item.startBeat,
          dur,
          vel,
          item.partName,
          item.partIndex,
          item.measureIndex,
        ),
      );
      return;
    }

    if (note.dynamics === "fp" && !isTied(note)) {
      const attack = Math.max(0.08, dur * 0.22);
      push(item, item.startBeat, attack, Math.max(vel, DYN_VEL.fp));
      push(item, item.startBeat + attack, Math.max(0.05, dur - attack), DYN_VEL.p);
      return;
    }

    const ev = push(item, item.startBeat, dur, vel);
    if (note.tie === "start" || note.tie === "continue") openTies.set(tieKey, ev);
  });

  return events;
}

function measureTimeline(measures: Measure[]): {
  starts: number[];
  lengths: number[];
  total: number;
} {
  const starts: number[] = [];
  const lengths: number[] = [];
  let beat = 0;
  for (const m of measures) {
    starts.push(beat);
    const len = parseMeasureBeats(m.timeSignature, 4);
    lengths.push(len);
    beat += len;
  }
  return { starts, lengths, total: beat };
}

function expandRepeats(score: EditableScore, raw: RawEvent[]): RawEvent[] {
  const ref = score.parts[0];
  if (!ref) return raw;
  const measures = ref.measures;
  const { starts, lengths, total: totalBeats } = measureTimeline(measures);
  let segnoBeat: number | null = null;
  let codaBeat: number | null = null;
  let fineEnd: number | null = null;
  for (let i = 0; i < measures.length; i++) {
    const m = measures[i]!;
    if (m.repeatMark === "segno") segnoBeat = starts[i]!;
    if (m.repeatMark === "coda") codaBeat = starts[i]!;
    if (m.repeatMark === "fine") fineEnd = starts[i]! + lengths[i]!;
  }

  let ranges: Array<{ start: number; end: number }> | null = null;

  for (let i = 0; i < measures.length; i++) {
    const m = measures[i]!;
    const jumpEnd = starts[i]! + lengths[i]!;
    if (m.repeatMark === "dc") {
      ranges = [
        { start: 0, end: jumpEnd },
        { start: 0, end: fineEnd ?? totalBeats },
      ];
      break;
    }
    if (m.repeatMark === "ds" && segnoBeat !== null) {
      ranges = [
        { start: 0, end: jumpEnd },
        { start: segnoBeat, end: fineEnd ?? codaBeat ?? totalBeats },
      ];
      if (codaBeat !== null) ranges.push({ start: codaBeat, end: totalBeats });
      break;
    }
  }

  if (!ranges) {
    let startIdx = measures.findIndex((m) => m.barline === "start-repeat");
    let endIdx = measures.findIndex((m) => m.barline === "end-repeat");
    if (endIdx < 0 && startIdx >= 0) endIdx = measures.length - 1;
    if (endIdx >= 0) {
      if (startIdx < 0 || startIdx > endIdx) startIdx = 0;
      const loopStart = starts[startIdx]!;
      const loopEnd = starts[endIdx]! + lengths[endIdx]!;
      ranges = [{ start: 0, end: loopEnd }];
      ranges.push({ start: loopStart, end: loopEnd });
      if (loopEnd < totalBeats) ranges.push({ start: loopEnd, end: totalBeats });
    } else {
      ranges = [{ start: 0, end: totalBeats }];
    }
  }

  const out: RawEvent[] = [];
  let offset = 0;
  for (const range of ranges) {
    for (const ev of raw) {
      if (ev.startBeat >= range.start && ev.startBeat < range.end) {
        out.push({ ...ev, startBeat: ev.startBeat - range.start + offset });
      }
    }
    offset += range.end - range.start;
  }
  return out.length > 0 ? out : raw;
}

export function realizeSoundingTimeline(
  score: EditableScore,
  beatsPerMeasure = 4,
): SoundingEvent[] {
  const raw = collectRawEvents(score, beatsPerMeasure);
  const expanded = expandRepeats(score, raw);
  return expanded
    .map(
      (ev): SoundingEvent => ({
        startBeat: ev.startBeat,
        pitch: ev.pitch,
        rsPitch: ev.rsPitch,
        durationBeats: ev.durationBeats,
        velocity: ev.velocity,
        partName: ev.partName,
        partIndex: ev.partIndex,
        measureIndex: ev.measureIndex,
      }),
    )
    .sort((a, b) => a.startBeat - b.startBeat || a.partIndex - b.partIndex);
}
