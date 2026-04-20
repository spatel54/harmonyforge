/**
 * HarmonyForge Logic Core — Roman numeral chord parser
 * Maps Roman numerals to pitch classes given key context.
 * Supports: I, ii, iii, IV, V, vi, vii°, V7, ii7, iiø7, inversions (6, 6/4, 6/5, 4/3, 4/2)
 */

import type { KeyContext, ParsedChord } from "./types";

const PITCH_CLASSES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

/** Diatonic scale degrees in major: 1-based index → semitones from tonic */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
/** Diatonic scale degrees in natural minor */
const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

function tonicToPc(tonic: string): number {
  const idx = PITCH_CLASSES.indexOf(tonic as (typeof PITCH_CLASSES)[number]);
  if (idx < 0) throw new Error(`Invalid tonic: ${tonic}`);
  return idx;
}

/** Get scale degree (1–7) and quality from Roman numeral */
function parseRoman(roman: string): {
  degree: number;
  accidental: number;
  quality: "major" | "minor" | "diminished" | "half-diminished" | "augmented";
  hasSeventh: boolean;
  inversion: "root" | "6" | "64" | "65" | "43" | "42";
} {
  const s = roman.trim();
  let i = 0;

  // Optional accidental (b or # before numeral)
  let accidental = 0;
  if (s[i] === "b") {
    accidental = -1;
    i++;
  } else if (s[i] === "#") {
    accidental = 1;
    i++;
  }

  // Scale degree: I–VII (parse multi-char)
  const romanPart = s
    .slice(i)
    .replace(/[°ø∅o+#67\/\d\s]*$/, "")
    .toUpperCase();
  let degree = 0;
  let numChars = 0;
  if (romanPart.startsWith("VII")) {
    degree = 7;
    numChars = 3;
  } else if (romanPart.startsWith("VI")) {
    degree = 6;
    numChars = 2;
  } else if (romanPart.startsWith("IV")) {
    degree = 4;
    numChars = 2;
  } else if (romanPart.startsWith("V")) {
    degree = 5;
    numChars = 1;
  } else if (romanPart.startsWith("III")) {
    degree = 3;
    numChars = 3;
  } else if (romanPart.startsWith("II")) {
    degree = 2;
    numChars = 2;
  } else if (romanPart.startsWith("I")) {
    degree = 1;
    numChars = 1;
  }
  if (!degree) throw new Error(`Invalid Roman numeral: ${roman}`);
  i += numChars;

  // Lowercase = minor (for triads) — check first char of numeral
  const firstNumChar = s.slice(i - numChars, i - numChars + 1);
  const isLower = firstNumChar === firstNumChar.toLowerCase();
  let quality: "major" | "minor" | "diminished" | "half-diminished" | "augmented" =
    isLower ? "minor" : "major";

  // Suffixes: °, ø, +, 7
  let hasSeventh = false;
  while (i < s.length) {
    if (s[i] === "°" || s[i] === "o") {
      quality = "diminished";
      i++;
    } else if (s[i] === "ø" || (s[i] === "∅")) {
      quality = "half-diminished";
      hasSeventh = true;
      i++;
    } else if (s[i] === "+") {
      quality = "augmented";
      i++;
    } else if (s[i] === "7") {
      hasSeventh = true;
      if (quality === "diminished") quality = "half-diminished";
      i++;
    } else if (s[i] === "6") {
      if (s.slice(i, i + 3) === "6/4") {
        i += 3;
      return {
        degree,
        accidental,
        quality,
        hasSeventh,
        inversion: "64",
      };
      }
      if (s.slice(i, i + 3) === "6/5") {
        i += 3;
        hasSeventh = true;
        return {
          degree,
          accidental,
          quality,
          hasSeventh,
          inversion: "65",
        };
      }
      i++;
      return {
        degree,
        accidental,
        quality,
        hasSeventh,
        inversion: "6",
      };
    } else if (s[i] === "4") {
      if (s.slice(i, i + 3) === "4/3") {
        i += 3;
        hasSeventh = true;
        return {
          degree,
          accidental,
          quality,
          hasSeventh,
          inversion: "43",
        };
      }
      if (s.slice(i, i + 3) === "4/2") {
        i += 3;
        hasSeventh = true;
        return {
          degree,
          accidental,
          quality,
          hasSeventh,
          inversion: "42",
        };
      }
      i++;
    } else {
      break;
    }
  }

  return {
    degree,
    accidental,
    quality,
    hasSeventh,
    inversion: "root",
  };
}

/** Triad intervals from root: [root, third, fifth] in semitones */
function triadIntervals(quality: string): [number, number, number] {
  switch (quality) {
    case "major":
      return [0, 4, 7];
    case "minor":
      return [0, 3, 7];
    case "diminished":
      return [0, 3, 6];
    case "augmented":
      return [0, 4, 8];
    case "half-diminished":
      return [0, 3, 6]; // triad part
    default:
      return [0, 4, 7];
  }
}

/** Seventh chord: add 7th above root. Dominant 7 (X7) uses minor 7th. */
function seventhInterval(quality: string, isDominant7: boolean): number {
  if (quality === "major" && isDominant7) return 10; // dominant 7
  switch (quality) {
    case "major":
    case "augmented":
      return 11; // maj7
    case "minor":
    case "diminished":
      return 10; // min7
    case "half-diminished":
      return 10; // ø7
    default:
      return 10;
  }
}

/** Get root pitch class in key */
function degreeToRootPc(degree: number, key: KeyContext): number {
  const scale = key.mode === "major" ? MAJOR_SCALE : MINOR_SCALE;
  const d = ((degree - 1) % 7 + 7) % 7;
  const scaleIndex = d;
  const semitones = scale[scaleIndex];
  const tonicPc = tonicToPc(key.tonic);
  return mod12(tonicPc + semitones);
}

/** Parse Roman numeral to ParsedChord */
export function parseChord(roman: string, key: KeyContext): ParsedChord {
  const { degree, accidental, quality, hasSeventh, inversion } =
    parseRoman(roman);
  const rootPc = mod12(degreeToRootPc(degree, key) + accidental);
  const [r, t, f] = triadIntervals(quality);
  const root = mod12(rootPc + r);
  const third = mod12(rootPc + t);
  const fifth = mod12(rootPc + f);

  let seventhPc: number | undefined;
  let chordTones: number[];

  if (hasSeventh) {
    const seventh = seventhInterval(quality, hasSeventh);
    seventhPc = mod12(rootPc + seventh);
    chordTones = [root, third, fifth, seventhPc];
  } else {
    chordTones = [root, third, fifth];
  }

  // Bass note for inversions
  let bassPc: number;
  switch (inversion) {
    case "root":
      bassPc = root;
      break;
    case "6":
      bassPc = third;
      break;
    case "64":
      bassPc = fifth;
      break;
    case "65":
      bassPc = third;
      break;
    case "43":
      bassPc = fifth;
      break;
    case "42":
      bassPc = seventhPc!;
      break;
    default:
      bassPc = root;
  }

  return {
    rootPc: root,
    thirdPc: third,
    fifthPc: fifth,
    seventhPc,
    bassPc,
    chordTones,
  };
}
