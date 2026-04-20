/**
 * SATB solver result → MusicXML (SATB grand staff)
 * Builds timewise MusicXML that preserves source melody rhythm when available.
 */

import type { SolverResult } from "./solver";
import type { ParsedScore, RhythmDensity, Voice } from "./types";
import { pitchToMidi, midiToPitch, getVoiceRange } from "./types";

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

/** Indent measure/part inner XML without concatenating blocks before splitting (fewer large temporaries). */
function indentInnerMusicXml(attributes: string, noteXml: string, indent = "  "): string {
  const lines: string[] = [];
  if (attributes) lines.push(...attributes.split("\n"));
  lines.push(...noteXml.split("\n"));
  return lines.map((line) => indent + line).join("\n");
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

/**
 * Given a slot boundary [start, end), return the sub-spans for harmony events
 * under the selected rhythm density. Each span is a positive-duration segment
 * inside the slot. The harmony line will re-attack the slot's chord tone on
 * every span boundary, giving rhythmic variety that follows the source melody.
 */
function slotSpansForDensity(
  slotStart: number,
  slotEnd: number,
  density: RhythmDensity,
  source: ParsedScore | undefined,
): Array<{ startBeat: number; duration: number }> {
  const clampedStart = clampDurationBeats(slotStart);
  const clampedEnd = clampDurationBeats(slotEnd);
  const spanLen = clampDurationBeats(clampedEnd - clampedStart);
  if (spanLen <= 0) return [];
  if (density === "chordal") {
    return [{ startBeat: clampedStart, duration: spanLen }];
  }

  const melody = source?.melody ?? [];
  const onsetsInSlot: number[] = [];
  for (const note of melody) {
    const beat = clampDurationBeats(note.beat);
    if (beat >= clampedStart - 1e-4 && beat < clampedEnd - 1e-4) {
      onsetsInSlot.push(beat);
    }
  }

  if (density === "flowing") {
    const smallest = melody.reduce<number>((acc, n) => {
      const d = clampDurationBeats(n.duration ?? 0);
      if (d <= 0) return acc;
      return acc === 0 ? d : Math.min(acc, d);
    }, 0);
    const step = smallest > 0 ? smallest : 0.5;
    const extra: number[] = [];
    for (let t = clampedStart; t < clampedEnd - 1e-4; t = clampDurationBeats(t + step)) {
      extra.push(t);
    }
    for (const t of extra) {
      if (!onsetsInSlot.some((o) => Math.abs(o - t) < 1e-4)) onsetsInSlot.push(t);
    }
  }

  if (onsetsInSlot.length === 0) {
    return [{ startBeat: clampedStart, duration: spanLen }];
  }

  const onsets = [...new Set(onsetsInSlot.map((b) => clampDurationBeats(b)))].sort((a, b) => a - b);
  if (onsets[0] > clampedStart + 1e-4) {
    onsets.unshift(clampedStart);
  }
  const spans: Array<{ startBeat: number; duration: number }> = [];
  for (let i = 0; i < onsets.length; i++) {
    const start = onsets[i];
    const end = i + 1 < onsets.length ? onsets[i + 1] : clampedEnd;
    const duration = clampDurationBeats(end - start);
    if (duration > 0) spans.push({ startBeat: start, duration });
  }
  return spans;
}

function buildHarmonyEvents(
  result: SolverResult,
  voice: keyof SolverResult["slots"][number]["voices"],
  source?: ParsedScore,
  density: RhythmDensity = "mixed",
): TimedEvent[] {
  const beatsPerMeasure = source?.timeSignature?.beats ?? DEFAULT_BEATS_PER_MEASURE;
  const totalBeats = source?.totalBeats ?? result.slots.length * beatsPerMeasure;
  const boundaries = getChordBoundaries(result, totalBeats, beatsPerMeasure);

  const events: TimedEvent[] = [];
  for (let index = 0; index < result.slots.length; index++) {
    const slot = result.slots[index];
    const pitch = slot.voices[voice];
    const spans = slotSpansForDensity(boundaries[index], boundaries[index + 1], density, source);
    for (const span of spans) {
      events.push({ pitch, startBeat: span.startBeat, duration: span.duration });
    }
  }
  return events;
}

/** Build unique harmony events for instrument at groupIndex within voice group (HFLitReview: divisi, different chord tones) */
function buildHarmonyEventsForInstrument(
  result: SolverResult,
  targetVoice: Voice,
  groupIndex: number,
  source?: ParsedScore,
  density: RhythmDensity = "mixed",
): TimedEvent[] {
  const rotation = VOICE_SOURCE_ROTATION[targetVoice];
  const { voice, semitones } = rotation[groupIndex % rotation.length]!;
  const beatsPerMeasure = source?.timeSignature?.beats ?? DEFAULT_BEATS_PER_MEASURE;
  const totalBeats = source?.totalBeats ?? result.slots.length * beatsPerMeasure;
  const boundaries = getChordBoundaries(result, totalBeats, beatsPerMeasure);

  const events: TimedEvent[] = [];
  for (let index = 0; index < result.slots.length; index++) {
    const slot = result.slots[index]!;
    const basePitch = slot.voices[voice];
    const transposed = semitones !== 0 ? transposePitch(basePitch!, semitones) : basePitch!;
    const clamped = clampPitchToRange(transposed, targetVoice);
    const spans = slotSpansForDensity(boundaries[index]!, boundaries[index + 1]!, density, source);
    for (const span of spans) {
      events.push({ pitch: clamped, startBeat: span.startBeat, duration: span.duration });
    }
  }
  return events;
}

/**
 * Layout of variable-length measures. Each entry is { start, end } in beats.
 * When `pickupBeats` is zero the layout is uniform; otherwise measure 0 is
 * shortened to the pickup length and every subsequent measure remains full.
 */
interface MeasureLayout {
  starts: number[];
  lengths: number[];
}

function buildMeasureLayout(
  totalMeasures: number,
  beatsPerMeasure: number,
  pickupBeats: number,
): MeasureLayout {
  const starts: number[] = [];
  const lengths: number[] = [];
  let cursor = 0;
  for (let i = 0; i < totalMeasures; i++) {
    starts.push(cursor);
    const len = i === 0 && pickupBeats > 0
      ? clampDurationBeats(pickupBeats)
      : beatsPerMeasure;
    lengths.push(len);
    cursor = clampDurationBeats(cursor + len);
  }
  return { starts, lengths };
}

function splitEventsByMeasure(
  events: TimedEvent[],
  totalMeasures: number,
  beatsPerMeasure: number,
  layout?: MeasureLayout,
): MeasureSegment[][] {
  const measures = Array.from({ length: totalMeasures }, () => [] as MeasureSegment[]);
  const actualLayout = layout ?? buildMeasureLayout(totalMeasures, beatsPerMeasure, 0);

  const findMeasureIndex = (cursor: number): number => {
    for (let i = totalMeasures - 1; i >= 0; i--) {
      if (cursor + 1e-4 >= actualLayout.starts[i]!) return i;
    }
    return 0;
  };

  for (const event of events) {
    let remaining = clampDurationBeats(event.duration);
    let cursor = event.startBeat;

    while (remaining > 0.0001) {
      const measureIndex = Math.max(0, Math.min(totalMeasures - 1, findMeasureIndex(cursor)));
      const measureStart = actualLayout.starts[measureIndex]!;
      const measureLen = actualLayout.lengths[measureIndex]!;
      const measureEnd = measureStart + measureLen;
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

/**
 * MusicXML clef from part display name (align with frontend musicxmlParser).
 *
 * Notation correctness (per Iter1 §2 user-study feedback): the tenor voice
 * must render as *treble clef 8vb* (G line 2 with clef-octave-change=-1) in
 * vocal SATB output — not an unqualified G-clef (which MuseScore and some
 * renderers may redraw as a mezzo-soprano C-clef when pitches drift).
 * See Aldwell & Schachter, §SATB engraving; Open Music Theory "Vocal clefs".
 */
/**
 * Concert-pitch → written-pitch transposition for transposing instruments
 * (ADR 003 vertical slice).
 *
 * MusicXML `<transpose>` spec: `diatonic` is the step interval, `chromatic` the
 * sounding → written semitone offset (e.g. Bb clarinet = -2 semitones,
 * -1 step; the written note is a major 2nd higher than the sounding pitch).
 *
 * The solver/generator continues to work in concert pitch; only the output
 * XML carries the transpose element so MuseScore / OSMD render written pitch
 * to the player while audio playback uses the sounding notes.
 */
export interface TransposeSpec {
  diatonic: number;
  chromatic: number;
  octaveChange?: number;
}

const TRANSPOSING_INSTRUMENTS: Array<{ test: RegExp; transpose: TransposeSpec }> = [
  // Bb clarinet / Bb trumpet / Bb soprano sax: sounds a major 2nd below written.
  // Written is +2 semitones from concert; in MusicXML <transpose> the chromatic
  // value is the sounding-to-written offset from the *written* to *concert* direction.
  // Convention: chromatic = -2 means the written note sounds a M2 lower.
  { test: /\b(b[- ]?flat|bb)\s+clarinet\b|^clarinet( in b(b|-?flat))?$|^clarinet$/i, transpose: { diatonic: -1, chromatic: -2 } },
  { test: /\b(b[- ]?flat|bb)\s+trumpet\b|^trumpet( in b(b|-?flat))?$|^trumpet$/i, transpose: { diatonic: -1, chromatic: -2 } },
  { test: /\bsoprano\s+sax(ophone)?\b/i, transpose: { diatonic: -1, chromatic: -2 } },
  // A clarinet: sounds a minor 3rd below written.
  { test: /\bclarinet in a\b/i, transpose: { diatonic: -2, chromatic: -3 } },
  // Eb alto sax: sounds a major 6th below written.
  { test: /\b(alto\s+sax(ophone)?|e[- ]?flat alto)\b/i, transpose: { diatonic: -5, chromatic: -9 } },
  // F horn: sounds a perfect 5th below written.
  { test: /\b(french\s+)?horn( in f)?\b/i, transpose: { diatonic: -4, chromatic: -7 } },
];

export function resolveInstrumentTranspose(partName: string): TransposeSpec | null {
  for (const entry of TRANSPOSING_INSTRUMENTS) {
    if (entry.test.test(partName)) return entry.transpose;
  }
  return null;
}

function transposeXml(spec: TransposeSpec | null): string {
  if (!spec) return "";
  const oct = spec.octaveChange != null ? `\n    <octave-change>${spec.octaveChange}</octave-change>` : "";
  return `\n  <transpose>
    <diatonic>${spec.diatonic}</diatonic>
    <chromatic>${spec.chromatic}</chromatic>${oct}
  </transpose>`;
}

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
  if (n.includes("tenor voice")) return { sign: "G", line: 2, octaveChange: -1 };

  if (voice === "Bass") return { sign: "F", line: 4 };
  if (voice === "Tenor") return { sign: "G", line: 2, octaveChange: -1 };
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
  const transposition = resolveInstrumentTranspose(partName);
  const transposeBlock = transposeXml(transposition);

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
  </clef>${transposeBlock}
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
  /** Harmony rhythm density; default "mixed" (subdivide slot spans on melody onsets). */
  rhythmDensity?: RhythmDensity;
}

/** Build MusicXML string from SATB result. Outputs only parts with selected instruments. */
export function satbToMusicXML(
  result: SolverResult,
  instruments?: Record<Voice, string[]>,
  source?: ParsedScore,
  options?: SatbToMusicXMLOptions
): string {
  const density: RhythmDensity = options?.rhythmDensity ?? "mixed";
  const beatsPerMeasure = source?.timeSignature?.beats ?? DEFAULT_BEATS_PER_MEASURE;
  const beatType = source?.timeSignature?.beatType ?? DEFAULT_BEAT_TYPE;
  const pickupBeats = Math.max(0, clampDurationBeats(source?.pickupBeats ?? 0));
  const hasPickup = pickupBeats > 0 && pickupBeats < beatsPerMeasure;
  const totalBeats = source?.totalBeats
    ?? Math.max(...result.slots.map((slot, index) => slot.chord.beat ?? index * DEFAULT_CHORD_SPAN), 0) + beatsPerMeasure;
  const totalMeasures = source?.totalMeasures
    ?? Math.max(1, Math.ceil(totalBeats / beatsPerMeasure));

  const layout = buildMeasureLayout(totalMeasures, beatsPerMeasure, hasPickup ? pickupBeats : 0);

  const sopranoEvents = buildSopranoEvents(result, source);
  const altoEvents = buildHarmonyEvents(result, "alto", source, density);
  const tenorEvents = buildHarmonyEvents(result, "tenor", source, density);
  const bassEvents = buildHarmonyEvents(result, "bass", source, density);
  const allPartEvents = [sopranoEvents, altoEvents, tenorEvents, bassEvents].map((events) =>
    splitEventsByMeasure(events, totalMeasures, beatsPerMeasure, layout)
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
          buildHarmonyEventsForInstrument(result, p.voice, p.groupIndex, source, density),
          totalMeasures,
          beatsPerMeasure,
          layout,
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

  /**
   * Pickup measures (anacrusis) — per Iter2 §1: emit measure 0 with
   * `implicit="yes"` so downstream renderers show it as a short pre-downbeat
   * bar, and number subsequent bars 1..N as usual.
   */
  const measureNumber = (mIdx: number): string => {
    if (!hasPickup) return String(mIdx + 1);
    return mIdx === 0 ? "0" : String(mIdx);
  };
  const measureAttrs = (mIdx: number): string => {
    if (hasPickup && mIdx === 0) return ` number="0" implicit="yes"`;
    return ` number="${measureNumber(mIdx)}"`;
  };

  if (format === "partwise") {
    const parts = partIds.map((id, i) => {
      const measureEls = Array.from({ length: totalMeasures }, (_, mIdx) => {
        const attributes = mIdx === 0 ? `${attributesXML(id, activeVoices[i], partNames[i] ?? "", source, beatsPerMeasure, beatType)}\n` : "";
        const measureBeats = layout.lengths[mIdx]!;
        const note = measureContentXML(partEvents[i][mIdx] ?? [], measureBeats);
        return `  <measure${measureAttrs(mIdx)}>
${indentInnerMusicXml(attributes, note)}
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
      const measureBeats = layout.lengths[mIdx]!;
      const note = measureContentXML(partEvents[i][mIdx] ?? [], measureBeats);
      return `  <part id="${id}">
${indentInnerMusicXml(attributes, note)}
  </part>`;
    });
    return `  <measure${measureAttrs(mIdx)}>
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
  const pickupBeats = Math.max(0, clampDurationBeats(source.pickupBeats ?? 0));
  const hasPickup = pickupBeats > 0 && pickupBeats < beatsPerMeasure;
  const layout = buildMeasureLayout(totalMeasures, beatsPerMeasure, hasPickup ? pickupBeats : 0);

  const events: TimedEvent[] = melody.map((note) => ({
    pitch: note.pitch,
    startBeat: note.beat,
    duration: clampDurationBeats(note.duration ?? 1),
  }));
  const measureSegs = splitEventsByMeasure(events, totalMeasures, beatsPerMeasure, layout);

  const partLabel = esc(source.melodyPartName ?? "Melody");
  const workTitle = esc(source.melodyPartName ?? "Score");
  const displayName = source.melodyPartName ?? "Melody";

  const measureEls = Array.from({ length: totalMeasures }, (_, mIdx) => {
    const attributes =
      mIdx === 0
        ? `${attributesXML("P1", "Soprano", displayName, source, beatsPerMeasure, beatType)}\n`
        : "";
    const measureBeats = layout.lengths[mIdx]!;
    const note = measureContentXML(measureSegs[mIdx] ?? [], measureBeats);
    const attrs = hasPickup && mIdx === 0 ? ` number="0" implicit="yes"` : ` number="${mIdx + (hasPickup ? 0 : 1)}"`;
    return `  <measure${attrs}>
${indentInnerMusicXml(attributes, note)}
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
