/**
 * SATB solver result → MusicXML (SATB grand staff)
 * Builds timewise MusicXML that preserves source melody rhythm when available.
 */

import type { SolverResult } from "./solver.js";
import type { ParsedScore, Voice } from "./types.js";
import { pitchToMidi, midiToPitch, getVoiceRange } from "./types.js";

const DIVISIONS = 8;
const DEFAULT_BEATS_PER_MEASURE = 4;
const DEFAULT_BEAT_TYPE = 4;
const DEFAULT_CHORD_SPAN = 2;

/** "C4" → { step, alter, octave } for MusicXML pitch */
function pitchToMusicXML(pitch: string): { step: string; alter: number; octave: number } {
  const midi = pitchToMidi(pitch);
  const octave = Math.floor(midi / 12) - 1;
  const pc = ((midi % 12) + 12) % 12;
  const steps = ["C", "D", "E", "F", "G", "A", "B"];
  const stepIndex = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc];
  const alters: Record<number, number> = {
    1: 1, 3: 1, 6: 1, 8: 1, 10: 1,
  };
  const alter = alters[pc] ?? 0;
  return { step: steps[stepIndex], alter, octave };
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface TimedEvent {
  pitch?: string;
  startBeat: number;
  duration: number;
}

interface MeasureSegment {
  pitch?: string;
  startBeat: number;
  duration: number;
}

function tonicToFifths(tonic: string, mode: "major" | "minor"): number {
  const major: Record<string, number> = {
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7, F: -1, "A#": -2, "D#": -3, "G#": -4,
  };
  const minor: Record<string, number> = {
    A: 0, E: 1, B: 2, "F#": 3, "C#": 4, "G#": 5, "D#": 6, "A#": 7, D: -1, G: -2, C: -3, F: -4,
  };
  return (mode === "minor" ? minor[tonic] : major[tonic]) ?? 0;
}

function clampDurationBeats(duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.round(duration * DIVISIONS) / DIVISIONS;
}

function beatSpanToNotation(duration: number): Array<{ duration: number; type: string; dots?: number }> {
  const values = [
    { duration: 4, type: "whole" },
    { duration: 3, type: "half", dots: 1 },
    { duration: 2, type: "half" },
    { duration: 1.5, type: "quarter", dots: 1 },
    { duration: 1, type: "quarter" },
    { duration: 0.75, type: "eighth", dots: 1 },
    { duration: 0.5, type: "eighth" },
    { duration: 0.25, type: "16th" },
  ];
  const pieces: Array<{ duration: number; type: string; dots?: number }> = [];
  let remaining = clampDurationBeats(duration);

  while (remaining > 0.0001) {
    const match = values.find((value) => remaining >= value.duration - 0.0001);
    if (!match) {
      pieces.push({ duration: remaining, type: "16th" });
      break;
    }
    pieces.push(match);
    remaining = clampDurationBeats(remaining - match.duration);
  }

  return pieces;
}

function noteXML(pitch: string | undefined, durationBeats: number): string {
  return beatSpanToNotation(durationBeats)
    .map(({ duration, type, dots }) => {
      const durationValue = Math.max(1, Math.round(duration * DIVISIONS));
      const dotsXml = dots ? "\n  <dot/>" : "";
      if (!pitch) {
        return `<note>
  <rest/>
  <duration>${durationValue}</duration>
  <type>${type}</type>${dotsXml}
</note>`;
      }
      const { step, alter, octave } = pitchToMusicXML(pitch);
      const alterEl = alter !== 0 ? `\n    <alter>${alter}</alter>` : "";
      return `<note>
  <pitch>
    <step>${step}</step>${alterEl}
    <octave>${octave}</octave>
  </pitch>
  <duration>${durationValue}</duration>
  <type>${type}</type>${dotsXml}
</note>`;
    })
    .join("\n");
}

function getChordBoundaries(result: SolverResult, totalBeats: number, beatsPerMeasure: number): number[] {
  const beats = result.slots.map((slot, index) => slot.chord.beat ?? index * DEFAULT_CHORD_SPAN);
  const fallbackEnd = beats.length > 0 ? beats[beats.length - 1] + DEFAULT_CHORD_SPAN : beatsPerMeasure;
  beats.push(Math.max(totalBeats, fallbackEnd));
  return beats;
}

function buildSopranoEvents(result: SolverResult, source?: ParsedScore): TimedEvent[] {
  if (source?.melody?.length) {
    return source.melody.map((note) => ({
      pitch: note.pitch,
      startBeat: note.beat,
      duration: clampDurationBeats(note.duration ?? 1),
    }));
  }

  const beatsPerMeasure = source?.timeSignature?.beats ?? DEFAULT_BEATS_PER_MEASURE;
  const totalBeats = source?.totalBeats ?? result.slots.length * beatsPerMeasure;
  const boundaries = getChordBoundaries(result, totalBeats, beatsPerMeasure);
  return result.slots.map((slot, index) => ({
    pitch: slot.voices.soprano,
    startBeat: boundaries[index],
    duration: boundaries[index + 1] - boundaries[index],
  }));
}

function transposePitch(pitch: string, semitones: number): string {
  return midiToPitch(pitchToMidi(pitch) + semitones);
}

/** Clamp pitch to voice range (MIDI) */
function clampPitchToRange(pitch: string, voice: Voice): string {
  const midi = pitchToMidi(pitch);
  const { min, max } = getVoiceRange(voice);
  const clamped = Math.max(min, Math.min(max, midi));
  return midiToPitch(clamped);
}

/**
 * Per HFLitReview: divisi, different chord tones, octave displacement.
 * For N instruments in same voice group, assign N distinct chord tones.
 * Rotation: inst 0 → primary voice; inst 1 → secondary (different chord tone); etc.
 */
const VOICE_SOURCE_ROTATION: Record<Voice, Array<{ voice: keyof SolverResult["slots"][number]["voices"]; semitones: number }>> = {
  Soprano: [
    { voice: "alto", semitones: 0 },
    { voice: "tenor", semitones: 12 },
    { voice: "bass", semitones: 24 },
    { voice: "soprano", semitones: 0 },
  ],
  Alto: [
    { voice: "alto", semitones: 0 },
    { voice: "tenor", semitones: 0 },
    { voice: "bass", semitones: 12 },
    { voice: "soprano", semitones: -12 },
  ],
  Tenor: [
    { voice: "tenor", semitones: 0 },
    { voice: "alto", semitones: -12 },
    { voice: "bass", semitones: 12 },
    { voice: "soprano", semitones: -24 },
  ],
  Bass: [
    { voice: "bass", semitones: 0 },
    { voice: "tenor", semitones: -12 },
    { voice: "alto", semitones: -24 },
    { voice: "soprano", semitones: -36 },
  ],
};

function buildHarmonyEvents(
  result: SolverResult,
  voice: keyof SolverResult["slots"][number]["voices"],
  source?: ParsedScore
): TimedEvent[] {
  const beatsPerMeasure = source?.timeSignature?.beats ?? DEFAULT_BEATS_PER_MEASURE;
  const totalBeats = source?.totalBeats ?? result.slots.length * beatsPerMeasure;
  const boundaries = getChordBoundaries(result, totalBeats, beatsPerMeasure);

  return result.slots.map((slot, index) => ({
    pitch: slot.voices[voice],
    startBeat: boundaries[index],
    duration: boundaries[index + 1] - boundaries[index],
  }));
}

/** Build unique harmony events for instrument at groupIndex within voice group (HFLitReview: divisi, different chord tones) */
function buildHarmonyEventsForInstrument(
  result: SolverResult,
  targetVoice: Voice,
  groupIndex: number,
  source?: ParsedScore
): TimedEvent[] {
  const rotation = VOICE_SOURCE_ROTATION[targetVoice];
  const { voice, semitones } = rotation[groupIndex % rotation.length]!;
  const beatsPerMeasure = source?.timeSignature?.beats ?? DEFAULT_BEATS_PER_MEASURE;
  const totalBeats = source?.totalBeats ?? result.slots.length * beatsPerMeasure;
  const boundaries = getChordBoundaries(result, totalBeats, beatsPerMeasure);

  return result.slots.map((slot, index) => {
    const basePitch = slot.voices[voice];
    const transposed = semitones !== 0 ? transposePitch(basePitch!, semitones) : basePitch;
    const clamped = clampPitchToRange(transposed!, targetVoice);
    return {
      pitch: clamped,
      startBeat: boundaries[index],
      duration: boundaries[index + 1]! - boundaries[index]!,
    };
  });
}

function splitEventsByMeasure(
  events: TimedEvent[],
  totalMeasures: number,
  beatsPerMeasure: number
): MeasureSegment[][] {
  const measures = Array.from({ length: totalMeasures }, () => [] as MeasureSegment[]);

  for (const event of events) {
    let remaining = clampDurationBeats(event.duration);
    let cursor = event.startBeat;

    while (remaining > 0.0001) {
      const measureIndex = Math.max(0, Math.min(totalMeasures - 1, Math.floor(cursor / beatsPerMeasure)));
      const measureStart = measureIndex * beatsPerMeasure;
      const measureEnd = measureStart + beatsPerMeasure;
      const localStart = clampDurationBeats(cursor - measureStart);
      const span = Math.min(remaining, clampDurationBeats(measureEnd - cursor));

      if (span > 0) {
        measures[measureIndex].push({
          pitch: event.pitch,
          startBeat: localStart,
          duration: span,
        });
      }

      cursor += span;
      remaining = clampDurationBeats(remaining - span);
    }
  }

  return measures;
}

/** MusicXML clef from part display name (align with frontend musicxmlParser). */
function clefXmlForPart(partName: string, voice: Voice): { sign: string; line: number; octaveChange?: number } {
  const n = partName.toLowerCase();
  if (n.includes("tenor sax")) return { sign: "G", line: 2 };
  if (n.includes("viola")) return { sign: "C", line: 3 };
  if (
    n.includes("cello") ||
    n.includes("violoncello") ||
    n.includes("bassoon") ||
    n.includes("fagot") ||
    n.includes("contrabassoon") ||
    n.includes("trombone") ||
    n.includes("tuba") ||
    n.includes("double bass") ||
    n.includes("contrabass")
  ) {
    return { sign: "F", line: 4 };
  }
  if (n.includes("bass voice") || n.trim() === "bass") return { sign: "F", line: 4 };
  if (n.includes("tenor voice")) return { sign: "C", line: 4 };

  if (voice === "Bass") return { sign: "F", line: 4 };
  if (voice === "Tenor") return { sign: "G", line: 2 };
  if (voice === "Alto") return { sign: "G", line: 2 };
  return { sign: "G", line: 2 };
}

function measureContentXML(segments: MeasureSegment[], beatsPerMeasure: number): string {
  const sorted = [...segments].sort((a, b) => a.startBeat - b.startBeat);
  const xml: string[] = [];
  let cursor = 0;

  for (const segment of sorted) {
    const gap = clampDurationBeats(segment.startBeat - cursor);
    if (gap > 0) xml.push(noteXML(undefined, gap));
    xml.push(noteXML(segment.pitch, segment.duration));
    cursor = clampDurationBeats(segment.startBeat + segment.duration);
  }

  const trailing = clampDurationBeats(beatsPerMeasure - cursor);
  if (trailing > 0) xml.push(noteXML(undefined, trailing));
  return xml.join("\n");
}

function attributesXML(
  partId: string,
  voice: Voice,
  partName: string,
  source: ParsedScore | undefined,
  beatsPerMeasure: number,
  beatType: number
): string {
  const clef = clefXmlForPart(partName, voice);
  const octaveEl =
    clef.octaveChange != null
      ? `\n    <clef-octave-change>${clef.octaveChange}</clef-octave-change>`
      : "";
  const fifths = source ? tonicToFifths(source.key.tonic, source.key.mode) : 0;
  const mode = source?.key.mode ?? "major";

  return `<attributes>
  <divisions>${DIVISIONS}</divisions>
  <key>
    <fifths>${fifths}</fifths>
    <mode>${mode}</mode>
  </key>
  <time>
    <beats>${beatsPerMeasure}</beats>
    <beat-type>${beatType}</beat-type>
  </time>
  <clef>
    <sign>${clef.sign}</sign>
    <line>${clef.line}</line>${octaveEl}
  </clef>
</attributes>`;
}

const DEFAULT_PARTS: Record<Voice, string> = {
  Soprano: "Soprano",
  Alto: "Alto",
  Tenor: "Tenor",
  Bass: "Bass",
};

const VOICE_ORDER: Voice[] = ["Soprano", "Alto", "Tenor", "Bass"];

/** Options for MusicXML output format: partwise for MuseScore compatibility */
export interface SatbToMusicXMLOptions {
  format?: "timewise" | "partwise";
  version?: "2.0" | "3.0";
  /** When true and source has melody: output melody as first part, then add harmony parts (not replace) */
  additiveHarmonies?: boolean;
}

/** Build MusicXML string from SATB result. Outputs only parts with selected instruments. */
export function satbToMusicXML(
  result: SolverResult,
  instruments?: Record<Voice, string[]>,
  source?: ParsedScore,
  options?: SatbToMusicXMLOptions
): string {
  const beatsPerMeasure = source?.timeSignature?.beats ?? DEFAULT_BEATS_PER_MEASURE;
  const beatType = source?.timeSignature?.beatType ?? DEFAULT_BEAT_TYPE;
  const totalBeats = source?.totalBeats
    ?? Math.max(...result.slots.map((slot, index) => slot.chord.beat ?? index * DEFAULT_CHORD_SPAN), 0) + beatsPerMeasure;
  const totalMeasures = source?.totalMeasures
    ?? Math.max(1, Math.ceil(totalBeats / beatsPerMeasure));

  const sopranoEvents = buildSopranoEvents(result, source);
  const altoEvents = buildHarmonyEvents(result, "alto", source);
  const tenorEvents = buildHarmonyEvents(result, "tenor", source);
  const bassEvents = buildHarmonyEvents(result, "bass", source);
  const allPartEvents = [sopranoEvents, altoEvents, tenorEvents, bassEvents].map((events) =>
    splitEventsByMeasure(events, totalMeasures, beatsPerMeasure)
  );

  const additive = options?.additiveHarmonies && source?.melody?.length;
  let activeVoices: Voice[];
  let partIds: string[];
  let partNames: string[];
  let partEvents: MeasureSegment[][][];

  if (additive && instruments) {
    const melodyPartName = source.melodyPartName ?? "Melody";
    const harmonyParts: { voice: Voice; name: string; groupIndex: number }[] = [];
    for (const v of ["Soprano", "Alto", "Tenor", "Bass"] as Voice[]) {
      const insts = instruments[v];
      if (!insts || insts.length === 0) continue;
      const voiceForPart = v === "Soprano" ? "Alto" : v;
      for (let i = 0; i < insts.length; i++) {
        harmonyParts.push({ voice: voiceForPart, name: insts[i]!, groupIndex: i });
      }
    }
    activeVoices = ["Soprano", ...harmonyParts.map((p) => p.voice)];
    partIds = ["P1", ...harmonyParts.map((_, i) => `P${i + 2}`)];
    partNames = [melodyPartName, ...harmonyParts.map((p) => p.name)];
    partEvents = [
      allPartEvents[0],
      ...harmonyParts.map((p) =>
        splitEventsByMeasure(
          buildHarmonyEventsForInstrument(result, p.voice, p.groupIndex, source),
          totalMeasures,
          beatsPerMeasure
        )
      ),
    ];
  } else if (additive && !instruments) {
    activeVoices = ["Soprano"];
    partIds = ["P1"];
    partNames = [source!.melodyPartName ?? "Melody"];
    partEvents = [allPartEvents[0]];
  } else {
    activeVoices = VOICE_ORDER.filter(
      (v) => !instruments || !instruments[v] || instruments[v].length > 0
    );
    if (activeVoices.length === 0) {
      activeVoices = [...VOICE_ORDER];
    }
    partIds = activeVoices.map((_, i) => `P${i + 1}`);
    partNames = activeVoices.map(
      (v) => (instruments?.[v]?.[0] ?? DEFAULT_PARTS[v])
    );
    partEvents = activeVoices.map((v) => allPartEvents[VOICE_ORDER.indexOf(v)]);
  }

  const partList = partIds
    .map((id, i) => `  <score-part id="${id}">
    <part-name>${esc(partNames[i])}</part-name>
  </score-part>`)
    .join("\n");

  const format = options?.format ?? "timewise";
  const version = options?.version ?? "3.0";
  const workTitle = esc(source ? "HarmonyForge Arrangement" : "HarmonyForge SATB");

  if (format === "partwise") {
    const parts = partIds.map((id, i) => {
      const measureEls = Array.from({ length: totalMeasures }, (_, mIdx) => {
        const attributes = mIdx === 0 ? `${attributesXML(id, activeVoices[i], partNames[i] ?? "", source, beatsPerMeasure, beatType)}\n` : "";
        const note = measureContentXML(partEvents[i][mIdx] ?? [], beatsPerMeasure);
        return `  <measure number="${mIdx + 1}">
${`${attributes}${note}`.split("\n").map((l) => "  " + l).join("\n")}
  </measure>`;
      });
      return `  <part id="${id}">
${measureEls.join("\n")}
  </part>`;
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML ${version} Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="${version}">
  <work>
    <work-title>${workTitle}</work-title>
  </work>
  <part-list>
${partList}
  </part-list>
${parts.join("\n")}
</score-partwise>`;
  }

  const measures = Array.from({ length: totalMeasures }, (_, mIdx) => {
    const partEls = partIds.map((id, i) => {
      const attributes = mIdx === 0 ? `${attributesXML(id, activeVoices[i], partNames[i] ?? "", source, beatsPerMeasure, beatType)}\n` : "";
      const note = measureContentXML(partEvents[i][mIdx] ?? [], beatsPerMeasure);
      return `  <part id="${id}">
${`${attributes}${note}`.split("\n").map((l) => "  " + l).join("\n")}
  </part>`;
    });
    return `  <measure number="${mIdx + 1}">
${partEls.join("\n")}
  </measure>`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-timewise
  PUBLIC "-//Recordare//DTD MusicXML ${version} Timewise//EN"
  "http://www.musicxml.org/dtds/timewise.dtd">
<score-timewise version="${version}">
  <work>
    <work-title>${workTitle}</work-title>
  </work>
  <part-list>
${partList}
  </part-list>
${measures.join("\n")}
</score-timewise>`;
}

/**
 * Single-part partwise MusicXML 2.0 from ParsedScore (Document preview after PDF/MIDI/MXL intake).
 * No DOCTYPE so browsers avoid loading external DTDs.
 */
export function parsedScoreToPartwiseMelodyMusicXML(source: ParsedScore): string {
  const beatsPerMeasure = source.timeSignature?.beats ?? DEFAULT_BEATS_PER_MEASURE;
  const beatType = source.timeSignature?.beatType ?? DEFAULT_BEAT_TYPE;
  const melody = source.melody ?? [];
  if (melody.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="2.0"><part-list/><part id="P1"/></score-partwise>`;
  }

  const maxEndBeat = melody.reduce(
    (acc, n) => Math.max(acc, n.beat + clampDurationBeats(n.duration ?? 1)),
    0,
  );
  const totalBeats = source.totalBeats ?? Math.max(beatsPerMeasure, maxEndBeat);
  const totalMeasures = source.totalMeasures ?? Math.max(1, Math.ceil(totalBeats / beatsPerMeasure));

  const events: TimedEvent[] = melody.map((note) => ({
    pitch: note.pitch,
    startBeat: note.beat,
    duration: clampDurationBeats(note.duration ?? 1),
  }));
  const measureSegs = splitEventsByMeasure(events, totalMeasures, beatsPerMeasure);

  const partLabel = esc(source.melodyPartName ?? "Melody");
  const workTitle = esc(source.melodyPartName ?? "Score");
  const displayName = source.melodyPartName ?? "Melody";

  const measureEls = Array.from({ length: totalMeasures }, (_, mIdx) => {
    const attributes =
      mIdx === 0
        ? `${attributesXML("P1", "Soprano", displayName, source, beatsPerMeasure, beatType)}\n`
        : "";
    const note = measureContentXML(measureSegs[mIdx] ?? [], beatsPerMeasure);
    return `  <measure number="${mIdx + 1}">
${`${attributes}${note}`.split("\n").map((l) => "  " + l).join("\n")}
  </measure>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="2.0">
  <work><work-title>${workTitle}</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>${partLabel}</part-name></score-part>
  </part-list>
  <part id="P1">
${measureEls.join("\n")}
  </part>
</score-partwise>`;
}
