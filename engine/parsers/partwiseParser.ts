/**
 * Fallback parser for score-partwise MusicXML.
 * Used when musicxml-interfaces fails (e.g. xsltproc not installed on macOS).
 * Uses fast-xml-parser — no DTD loading, no external deps.
 */

import { XMLParser } from "fast-xml-parser";
import type { ParsedScore, PitchClass } from "../types.js";

const PITCH_CLASSES: PitchClass[] = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

function pitchToStr(step: string, alter: number, octave: number): string {
  const basePc = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }[step.toUpperCase()];
  if (basePc === undefined) return "C4";
  const pcIdx = (basePc + Math.round(alter) + 12) % 12;
  const pc = PITCH_CLASSES[pcIdx < 0 ? pcIdx + 12 : pcIdx];
  return `${pc}${octave}`;
}

function fifthsToKey(fifths: number, mode?: string): { tonic: PitchClass; mode: "major" | "minor" } {
  const majorTonics: PitchClass[] = ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F"];
  const minorTonics: PitchClass[] = ["A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F", "C", "G", "D"];
  const idx = ((fifths % 12) + 12) % 12;
  const isMinor = mode === "minor";
  const tonic = (isMinor ? minorTonics[idx] : majorTonics[idx]) ?? "C";
  return { tonic, mode: isMinor ? "minor" : "major" };
}

function arr<T>(x: T | T[] | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

function getNum(val: unknown, def: number): number {
  if (val == null) return def;
  if (typeof val === "number" && !isNaN(val)) return val;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? def : n;
}

const parser = new XMLParser({
  ignoreDeclaration: true,
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
  removeNSPrefix: true,
});

function findPartwiseRoot(obj: Record<string, unknown>): Record<string, unknown> | null {
  if (obj["score-partwise"] && typeof obj["score-partwise"] === "object") {
    return obj["score-partwise"] as Record<string, unknown>;
  }
  const key = Object.keys(obj).find(
    (k) => k === "score-partwise" || k.endsWith(":score-partwise")
  );
  return key ? (obj[key] as Record<string, unknown>) : null;
}

/**
 * Parse score-partwise MusicXML into ParsedScore.
 * Extracts melody from the first part.
 * Handles namespaced XML, grace notes (skipped), chords (first pitch).
 */
export function parsePartwiseMusicXML(xml: string): ParsedScore | null {
  try {
    if (!xml || typeof xml !== "string") return null;
    const parsed = parser.parse(xml);
    if (!parsed || typeof parsed !== "object") return null;

    const root = findPartwiseRoot(parsed as Record<string, unknown>);
    if (!root || typeof root !== "object") return null;

    const parts = arr(root.part);
    if (parts.length === 0) return null;

    let melodyPartName: string | undefined;
    const partList = root["part-list"] as Record<string, unknown> | undefined;
    if (partList && typeof partList === "object") {
      const scoreParts = arr(partList["score-part"]);
      const first = scoreParts[0];
      if (first && typeof first === "object") {
        const name = (first as { "part-name"?: string })["part-name"];
        if (typeof name === "string") melodyPartName = name;
      }
    }

    const firstPart = parts[0] as Record<string, unknown> | undefined;
    const measures = arr(firstPart?.measure);
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
    let currentBeat = 0;

    for (const measure of measures) {
      const m = measure as Record<string, unknown>;
      const attrEl = m.attributes as Record<string, unknown> | undefined;
      if (attrEl && typeof attrEl === "object") {
        const d = getNum(attrEl.divisions, 4);
        if (!isNaN(d)) divisions = d;
        const keyObj = attrEl.key as Record<string, unknown> | undefined;
        if (keyObj && typeof keyObj === "object") {
          const fifths = getNum(keyObj.fifths, 0);
          const mode = typeof keyObj.mode === "string" ? keyObj.mode : "";
          keyContext = fifthsToKey(fifths, mode || undefined);
        }
        const timeObj = attrEl.time as Record<string, unknown> | undefined;
        if (timeObj && typeof timeObj === "object") {
          timeSignature = {
            beats: getNum(timeObj.beats, 4),
            beatType: getNum(timeObj["beat-type"], 4),
          };
        }
      }

      const notes = arr(m.note);
      for (const note of notes) {
        const n = note as Record<string, unknown>;
        if (!n || typeof n !== "object") continue;
        if ("rest" in n && n.rest != null) {
          const dur = getNum(n.duration, 0);
          currentBeat += dur / divisions;
          continue;
        }
        if ("grace" in n && n.grace != null) continue;

        const pitch = n.pitch as Record<string, unknown> | undefined;
        if (!pitch || typeof pitch !== "object") continue;

        const step = typeof pitch.step === "string" ? pitch.step : "C";
        const alter = getNum(pitch.alter, 0);
        const octave = getNum(pitch.octave, 4);

        let dur = getNum(n.duration, divisions);
        if (dur <= 0) dur = divisions;
        const chord = n.chord;

        melodyNotes.push({
          pitch: pitchToStr(step, alter, octave),
          beat: currentBeat,
          duration: dur / divisions,
          measure: getNum(m["@_number"], melodyNotes.length + 1),
        });
        if (!chord) currentBeat += dur / divisions;
      }
    }

    if (melodyNotes.length === 0) return null;

    return {
      key: keyContext,
      melody: melodyNotes,
      timeSignature,
      totalBeats: currentBeat,
      totalMeasures: measures.length,
      melodyPartName,
    };
  } catch {
    return null;
  }
}
