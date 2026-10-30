/**
 * Coerce MusicXML / lead-sheet chord labels into engine Roman numerals.
 * File harmony often stores "C", "Am", "G7" in <function> or as kind@text —
 * parseChord only accepts Roman numerals, so uncoerced labels make generateSATB null.
 */

import type { KeyContext } from "./types";
import { parseChord } from "./chordParser";

const PC_NAMES: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  "E#": 5,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

/** Flat tonics that appear in UI / RiffScore key names but not PitchClass. */
const FLAT_TONIC_TO_SHARP: Record<string, KeyContext["tonic"]> = {
  Bb: "A#",
  Eb: "D#",
  Ab: "G#",
  Db: "C#",
  Gb: "F#",
  Cb: "B",
};

const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

const MAJOR_ROMANS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
const MINOR_ROMANS = ["i", "ii°", "III", "iv", "v", "VI", "VII"] as const;

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

function replaceMusicAccidentals(s: string): string {
  return s.replace(/♯/g, "#").replace(/♭/g, "b");
}

/** Normalize key tonic to a PitchClass the chord parser accepts. */
export function normalizeKeyTonic(tonic: string): KeyContext["tonic"] {
  const t = replaceMusicAccidentals(tonic.trim());
  if (FLAT_TONIC_TO_SHARP[t]) return FLAT_TONIC_TO_SHARP[t]!;
  const sharp = t as KeyContext["tonic"];
  const allowed: KeyContext["tonic"][] = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
  ];
  return allowed.includes(sharp) ? sharp : "C";
}

export function normalizeKeyContext(key: KeyContext): KeyContext {
  return { tonic: normalizeKeyTonic(key.tonic), mode: key.mode };
}

function parseLeadSheetRootAndQuality(symbol: string): {
  rootPc: number;
  hasSeventh: boolean;
  quality: "major" | "minor" | "diminished" | "half-diminished" | "augmented" | "dominant";
} | null {
  const raw = replaceMusicAccidentals(symbol.trim());
  if (!raw || raw === "?") return null;
  const head = raw.includes("/") ? raw.slice(0, raw.indexOf("/")).trim() : raw;
  const m = head.match(/^([A-Ga-g])([#b]?)(.*)$/);
  if (!m) return null;
  const rootName = `${(m[1] ?? "C").toUpperCase()}${m[2] ?? ""}`;
  const rootPc = PC_NAMES[rootName];
  if (rootPc === undefined) return null;

  let suf = (m[3] ?? "").trim();
  if (/^maj$/i.test(suf) || suf === "M" || /^major$/i.test(suf)) suf = "";
  if (/^min/i.test(suf)) suf = `m${suf.slice(3)}`;

  let hasSeventh = false;
  let quality: "major" | "minor" | "diminished" | "half-diminished" | "augmented" | "dominant" =
    "major";

  if (/^(maj7|ma7|Δ7|Δ)/i.test(suf)) {
    hasSeventh = true;
    quality = "major";
  } else if (/^(m7b5|ø7|ø)/i.test(suf)) {
    hasSeventh = true;
    quality = "half-diminished";
  } else if (/^(dim7|o7|°7)/i.test(suf)) {
    hasSeventh = true;
    quality = "diminished";
  } else if (/^(dim|o|°)/i.test(suf)) {
    quality = "diminished";
  } else if (/^(aug|\+)/i.test(suf)) {
    quality = "augmented";
  } else if (/^m7/i.test(suf) || /^min7/i.test(suf)) {
    hasSeventh = true;
    quality = "minor";
  } else if (suf === "7" || /^dom/i.test(suf)) {
    hasSeventh = true;
    quality = "dominant";
  } else if (suf === "m" || /^mi$/i.test(suf) || /^min$/i.test(suf)) {
    quality = "minor";
  } else if (suf === "") {
    quality = "major";
  } else if (/^7/.test(suf)) {
    hasSeventh = true;
    quality = "dominant";
  } else {
    // Unknown suffix — treat as major triad on root so generation can proceed.
    quality = "major";
  }

  return { rootPc, hasSeventh, quality };
}

function degreeFromRootPc(rootPc: number, key: KeyContext): number | null {
  const tonicPc = PC_NAMES[normalizeKeyTonic(key.tonic)];
  if (tonicPc === undefined) return null;
  const scale = key.mode === "minor" ? MINOR_SCALE : MAJOR_SCALE;
  const rel = mod12(rootPc - tonicPc);
  const idx = scale.indexOf(rel);
  return idx >= 0 ? idx + 1 : null;
}

function romanForDegree(
  degree: number,
  key: KeyContext,
  quality: "major" | "minor" | "diminished" | "half-diminished" | "augmented" | "dominant",
  hasSeventh: boolean,
): string {
  const base = (key.mode === "minor" ? MINOR_ROMANS : MAJOR_ROMANS)[degree - 1] ?? "I";
  if (quality === "dominant" || (hasSeventh && degree === 5 && quality === "major")) {
    return key.mode === "minor" ? "V7" : "V7";
  }
  if (quality === "half-diminished") {
    const stem = base.replace(/[°ø∅o7]/g, "");
    return `${stem}ø7`;
  }
  if (quality === "diminished" && hasSeventh) {
    const stem = base.replace(/[°ø∅o7]/g, "");
    return `${stem}°7`;
  }
  if (hasSeventh && quality === "minor") {
    const stem = base.replace(/[°ø∅o7]/g, "");
    return `${stem}7`;
  }
  if (hasSeventh && quality === "major") {
    // maj7 — engine parseRoman treats "7" as dominant-seventh interval; prefer triad.
    return base.replace(/[7]/g, "");
  }
  return base;
}

/**
 * Return a Roman numeral parseChord accepts, or null if the token cannot be mapped.
 * Accepts true Romans ("V7", "iiø7") and lead-sheet labels ("G7", "Am", "C").
 */
export function coerceChordRoman(raw: string, key: KeyContext): string | null {
  const token = replaceMusicAccidentals(raw.trim());
  if (!token) return null;
  const normKey = normalizeKeyContext(key);

  try {
    parseChord(token, normKey);
    return token;
  } catch {
    // fall through — may be lead-sheet
  }

  const parsed = parseLeadSheetRootAndQuality(token);
  if (!parsed) return null;
  const degree = degreeFromRootPc(parsed.rootPc, normKey);
  if (degree == null) {
    // Chromatic root: fall back to tonic so the solver still has a voicing.
    return normKey.mode === "minor" ? "i" : "I";
  }
  const roman = romanForDegree(degree, normKey, parsed.quality, parsed.hasSeventh);
  try {
    parseChord(roman, normKey);
    return roman;
  } catch {
    return normKey.mode === "minor" ? "i" : "I";
  }
}
