/**
 * Expand EditableScore into a sounding timeline with dynamics, articulations, ornaments, and repeats.
 */
import type { EditableScore, Note } from "./scoreTypes";
import { noteBeats, parseMeasureBeats } from "./scoreUtils";
import { pitchStringToMidi } from "./pitchMidi";

export type SoundingEvent = {
  startBeat: number;
  pitch: string;
  durationBeats: number;
  velocity: number;
  partName: string;
  partIndex: number;
};

const PITCH_RE = /^[A-G](?:#{1,2}|b{1,2})?\d+$/;

const DYN_VEL: Record<string, number> = {
  ppp: 28,
  pp: 40,
  p: 52,
  mp: 64,
  mf: 76,
  f: 88,
  ff: 100,
  fff: 112,
  sfz: 108,
  fp: 96,
};

function velocityForDynamic(dyn: string | undefined, fallback: number): number {
  if (!dyn) return fallback;
  if (dyn in DYN_VEL) return DYN_VEL[dyn]!;
  if (dyn === "cresc." || dyn === "dim.") return fallback;
  return fallback;
}

function articDurationFactor(note: Note): number {
  const arts = note.articulations ?? [];
  if (arts.includes("staccatissimo")) return 0.25;
  if (arts.includes("a.")) return 0.5;
  if (arts.includes("fermata")) return 1.35;
  return 1;
}

function articVelocityBoost(note: Note): number {
  const arts = note.articulations ?? [];
  if (arts.includes("a^") || arts.includes("a>")) return 12;
  return 0;
}

function neighborPitch(pitch: string, semitones: number): string | null {
  const midi = pitchStringToMidi(pitch);
  if (midi === null) return null;
  const next = midi + semitones;
  if (next < 0 || next > 127) return null;
  const steps = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(next / 12) - 1;
  const pc = ((next % 12) + 12) % 12;
  return `${steps[pc]}${octave}`;
}

function realizeOrnamentNotes(note: Note, startBeat: number, dur: number, vel: number, partName: string, partIndex: number): SoundingEvent[] {
  if (!note.ornament || note.isRest) return [];
  const out: SoundingEvent[] = [];
  const mainDur = dur * 0.55;
  const graceDur = dur * 0.15;
  const base = { partName, partIndex };
  if (note.ornament === "trill" || note.ornament === "trill-mark") {
    const upper = neighborPitch(note.pitch, 2);
    if (upper) {
      out.push({ startBeat, pitch: note.pitch, durationBeats: graceDur, velocity: vel, ...base });
      out.push({ startBeat: startBeat + graceDur, pitch: upper, durationBeats: graceDur, velocity: vel - 6, ...base });
      out.push({ startBeat: startBeat + graceDur * 2, pitch: note.pitch, durationBeats: mainDur, velocity: vel, ...base });
      return out;
    }
  }
  if (note.ornament === "mordent" || note.ornament === "inverted-mordent") {
    const neighbor = neighborPitch(note.pitch, note.ornament === "mordent" ? -2 : 2);
    if (neighbor) {
      out.push({ startBeat, pitch: note.pitch, durationBeats: graceDur, velocity: vel, ...base });
      out.push({ startBeat: startBeat + graceDur, pitch: neighbor, durationBeats: graceDur, velocity: vel - 4, ...base });
      out.push({ startBeat: startBeat + graceDur * 2, pitch: note.pitch, durationBeats: mainDur, velocity: vel, ...base });
      return out;
    }
  }
  if (note.ornament === "turn") {
    const u = neighborPitch(note.pitch, 2);
    const l = neighborPitch(note.pitch, -2);
    if (u && l) {
      out.push({ startBeat, pitch: note.pitch, durationBeats: graceDur, velocity: vel, ...base });
      out.push({ startBeat: startBeat + graceDur, pitch: u, durationBeats: graceDur, velocity: vel - 4, ...base });
      out.push({ startBeat: startBeat + graceDur * 2, pitch: note.pitch, durationBeats: graceDur, velocity: vel, ...base });
      out.push({ startBeat: startBeat + graceDur * 3, pitch: l, durationBeats: graceDur, velocity: vel - 4, ...base });
      out.push({ startBeat: startBeat + graceDur * 4, pitch: note.pitch, durationBeats: mainDur, velocity: vel, ...base });
      return out;
    }
  }
  return [];
}

type RawEvent = SoundingEvent & { measureIndex: number };

function collectRawEvents(score: EditableScore, beatsPerMeasureDefault = 4): RawEvent[] {
  const events: RawEvent[] = [];
  score.parts.forEach((part, partIndex) => {
    let partBeatCursor = 0;
    let currentVel = 76;
    const name = part.name?.trim() || "Part";
    part.measures.forEach((measure, measureIndex) => {
      const measureBeats = parseMeasureBeats(measure.timeSignature, beatsPerMeasureDefault);
      const measureStart = partBeatCursor;
      let currentBeat = measureStart;
      for (const note of measure.notes) {
        const writtenDur = noteBeats(note);
        if (note.dynamics) currentVel = velocityForDynamic(note.dynamics, currentVel);
        const vel = Math.min(127, currentVel + articVelocityBoost(note));
        const dur = writtenDur * articDurationFactor(note);

        if (!note.isRest && PITCH_RE.test(note.pitch)) {
          if (note.ornament) {
            events.push(
              ...realizeOrnamentNotes(note, currentBeat, dur, vel, name, partIndex).map((e) => ({
                ...e,
                measureIndex,
              })),
            );
          } else {
            events.push({
              startBeat: currentBeat,
              pitch: note.pitch,
              durationBeats: dur,
              velocity: vel,
              partName: name,
              partIndex,
              measureIndex,
            });
          }
        }

        if (note.articulations?.includes("breath-mark")) currentBeat += 0.08;
        if (note.articulations?.includes("caesura")) currentBeat += 0.2;

        currentBeat += writtenDur;
      }
      partBeatCursor = Math.max(measureStart + measureBeats, currentBeat);
    });
  });
  return events;
}

function expandRepeats(score: EditableScore, raw: RawEvent[]): RawEvent[] {
  const ref = score.parts[0];
  if (!ref) return raw;
  const measures = ref.measures;
  let segnoBeat: number | null = null;
  let codaBeat: number | null = null;
  let fineBeat: number | null = null;
  let cursor = 0;
  for (let i = 0; i < measures.length; i++) {
    const m = measures[i]!;
    const len = parseMeasureBeats(m.timeSignature, 4);
    if (m.repeatMark === "segno") segnoBeat = cursor;
    if (m.repeatMark === "coda") codaBeat = cursor;
    if (m.repeatMark === "fine") fineBeat = cursor;
    cursor += len;
  }

  const totalBeats = cursor;
  const ranges: Array<{ start: number; end: number }> = [{ start: 0, end: totalBeats }];

  for (let i = 0; i < measures.length; i++) {
    const m = measures[i]!;
    const start = raw.find((e) => e.measureIndex === i)?.startBeat ?? 0;
    if (m.barline === "start-repeat") {
      const endMeasure = measures.findIndex((mm, idx) => idx > i && mm.barline === "end-repeat");
      if (endMeasure >= 0) {
        const endBeat =
          raw.find((e) => e.measureIndex === endMeasure)?.startBeat ??
          totalBeats;
        ranges.push({ start, end: endBeat + parseMeasureBeats(measures[endMeasure]?.timeSignature, 4) });
      }
    }
    if (m.repeatMark === "dc") {
      const dcEnd = start + parseMeasureBeats(m.timeSignature, 4);
      ranges.length = 0;
      ranges.push({ start: 0, end: dcEnd });
      ranges.push({ start: 0, end: fineBeat ?? totalBeats });
      break;
    }
    if (m.repeatMark === "ds" && segnoBeat !== null) {
      const dsEnd = start + parseMeasureBeats(m.timeSignature, 4);
      ranges.length = 0;
      ranges.push({ start: 0, end: dsEnd });
      ranges.push({ start: segnoBeat, end: fineBeat ?? codaBeat ?? totalBeats });
      if (codaBeat !== null) ranges.push({ start: codaBeat, end: totalBeats });
      break;
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
        durationBeats: ev.durationBeats,
        velocity: ev.velocity,
        partName: ev.partName,
        partIndex: ev.partIndex,
      }),
    )
    .sort((a, b) => a.startBeat - b.startBeat);
}
