/**
 * Parse MusicXML → ParsedScore (canonical format)
 * Supports score-partwise and score-timewise. Uses fast-xml-parser (no DTD loading).
 * Falls back to musicxml-interfaces only when custom parsers fail.
 *
 * `musicxml-interfaces` initializes an `XSLTProcessor` at module load time,
 * which is only available in a browser-like DOM. We therefore import it
 * lazily and tolerate load failures: the custom partwise/timewise parsers
 * cover the real-world inputs the app produces and ingests.
 */

import { createRequire } from "node:module";
import { parsePartwiseMusicXML } from "./partwiseParser";
import { parseTimewiseMusicXML } from "./timewiseParser";
import { hasScorePartwiseMarker, hasScoreTimewiseMarker } from "./musicXmlMarkers";
import type { ParsedScore, PitchClass } from "../types";
import type { Key, Note, Attributes, Harmony } from "musicxml-interfaces";

type MusicXmlInterfacesModule = typeof import("musicxml-interfaces");
let cachedMxInterfaces: MusicXmlInterfacesModule | null | undefined;

function getMusicXmlInterfaces(): MusicXmlInterfacesModule | null {
  if (cachedMxInterfaces !== undefined) return cachedMxInterfaces;
  try {
    const require = createRequire(import.meta.url);
    cachedMxInterfaces = require("musicxml-interfaces") as MusicXmlInterfacesModule;
  } catch {
    cachedMxInterfaces = null;
  }
  return cachedMxInterfaces;
}

const PITCH_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function pitchToStr(pitch: { step?: string; alter?: number; octave: number }): string {
  if (!pitch.step) return "C4";
  const step = pitch.step.toUpperCase();
  const alter = pitch.alter ?? 0;
  const basePc = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }[step];
  if (basePc === undefined) return "C4";
  const pcIdx = (basePc + Math.round(alter) + 12) % 12;
  const pc = PITCH_CLASSES[pcIdx < 0 ? pcIdx + 12 : pcIdx];
  return `${pc}${pitch.octave}`;
}

function fifthsToKey(fifths: number, mode?: string): { tonic: PitchClass; mode: "major" | "minor" } {
  const majorTonics: PitchClass[] = ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F"];
  const minorTonics: PitchClass[] = ["A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F", "C", "G", "D"];
  const idx = ((fifths % 12) + 12) % 12;
  const isMinor = mode === "minor";
  const tonic = (isMinor ? minorTonics[idx] : majorTonics[idx]) ?? "C";
  return { tonic, mode: isMinor ? "minor" : "major" };
}

/** Extract Roman numeral from Harmony function if present */
function harmonyToRoman(harmony: Harmony): string | null {
  const fn = (harmony as { function?: { data?: string } }).function;
  if (fn?.data) return fn.data;
  return null;
}

export function parseMusicXML(xml: string): ParsedScore | null {
  if (!xml || typeof xml !== "string") return null;
  if (!xml.trim()) return null;

  const hasPartwise = hasScorePartwiseMarker(xml);
  const hasTimewise = hasScoreTimewiseMarker(xml);

  if (hasPartwise) {
    const partwise = parsePartwiseMusicXML(xml);
    if (partwise && partwise.melody.length > 0) return partwise;
  }
  if (hasTimewise) {
    const timewise = parseTimewiseMusicXML(xml);
    if (timewise && timewise.melody.length > 0) return timewise;
  }
  if (hasPartwise) {
    const partwise = parsePartwiseMusicXML(xml);
    if (partwise) return partwise;
  }
  if (hasTimewise) {
    const timewise = parseTimewiseMusicXML(xml);
    if (timewise) return timewise;
  }

  try {
    const mx = getMusicXmlInterfaces();
    if (!mx) return null;
    const score = mx.parseScore(xml);
    const measures = score.measures ?? [];
    if (measures.length === 0) return null;

    let divisions = 4;
    let keyContext: { tonic: PitchClass; mode: "major" | "minor" } = {
      tonic: "C",
      mode: "major",
    };
    let timeSignature = { beats: 4, beatType: 4 };
    const melodyNotes: Array<{
      pitch: string;
      beat: number;
      duration?: number;
      measure?: number;
    }> = [];
    const chordSlots: { roman: string; beat: number }[] = [];
    let currentBeat = 0;
    let measureCount = 0;

    for (const measure of measures) {
      measureCount += 1;
      const parts = measure.parts ?? {};
      const partIds = Object.keys(parts);
      const firstPartId = partIds[0];
      if (!firstPartId) continue;

      const elements = parts[firstPartId];
      if (!Array.isArray(elements)) continue;

      for (const el of elements) {
        if (!el || typeof el !== "object") continue;

        if ("divisions" in el) {
          const d = (el as Attributes).divisions;
          if (typeof d === "number") divisions = d;
        }
        if ("times" in el) {
          const time = (el as Attributes).times;
          const firstTime = Array.isArray(time) ? time[0] : time;
          const beatsValue = firstTime?.beats?.[0];
          const beatTypeValue = firstTime?.beatTypes?.[0];
          if (firstTime && beatsValue !== undefined) {
            timeSignature = {
              beats: parseInt(String(beatsValue), 10) || 4,
              beatType: parseInt(String(beatTypeValue ?? 4), 10) || 4,
            };
          }
        }
        if ("keySignatures" in el) {
          const keys = (el as Attributes).keySignatures;
          if (Array.isArray(keys) && keys.length > 0) {
            const k = keys[0] as Key;
            const fifths = k?.fifths;
            if (typeof fifths === "number") {
              keyContext = fifthsToKey(fifths, k.mode);
            }
          }
        }
        if ("pitch" in el && "duration" in el) {
          const note = el as Note & { chord?: unknown; rest?: unknown };
          if (note.rest) continue;
          const pitch = note.pitch;
          if (pitch && typeof pitch.octave === "number") {
            const dur = (note.duration ?? 1) / divisions;
            melodyNotes.push({
              pitch: pitchToStr(pitch),
              beat: currentBeat,
              duration: dur,
              measure: measureCount,
            });
            if (!note.chord) currentBeat += dur;
          }
        }
        if ("backup" in el) {
          const backup = (el as { backup?: number }).backup;
          if (typeof backup === "number") currentBeat -= backup / divisions;
        }
        if ("forward" in el) {
          const forward = (el as { forward?: number }).forward;
          if (typeof forward === "number") currentBeat += forward / divisions;
        }
        if ("root" in el || "function" in el) {
          const roman = harmonyToRoman(el as Harmony);
          if (roman) chordSlots.push({ roman, beat: currentBeat });
        }
      }
    }

    const chords = chordSlots.length > 0
      ? chordSlots.map((c) => ({ roman: c.roman, beat: c.beat }))
      : undefined;

    if (melodyNotes.length === 0) {
      if (hasTimewise) return parseTimewiseMusicXML(xml);
      return parsePartwiseMusicXML(xml);
    }

    return {
      key: keyContext,
      melody: melodyNotes,
      chords,
      timeSignature,
      totalBeats: currentBeat,
      totalMeasures: measureCount,
    };
  } catch {
    if (hasTimewise) return parseTimewiseMusicXML(xml);
    return parsePartwiseMusicXML(xml);
  }
}
