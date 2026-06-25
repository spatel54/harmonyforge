/**
 * Roman numeral → lead-sheet chord symbol and MusicXML <harmony> helpers.
 * Shared by engine export and client MusicXML round-trip.
 */

import type { KeyContext } from "@/server/engine/types";
import { parseChord, parseRoman } from "@/server/engine/chordParser";

const PC_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const PC_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

function spellPitchClass(pc: number, key: KeyContext): string {
  const useFlats = key.mode === "minor" || ["F", "Bb", "Eb", "Ab", "Db", "Gb"].includes(key.tonic);
  const names = useFlats ? PC_FLAT : PC_SHARP;
  return names[((pc % 12) + 12) % 12] ?? "C";
}

const ROOT_RE = /^([A-Ga-g])([#b♯♭]?)(.*)$/;

/**
 * Lead-sheet labels: major triads = root only (C, not CM); minor = lowercase m (Am, Dm).
 * Also normalizes detect/MusicXML variants (C major, Cmin, CMaj → C).
 */
export function normalizeLeadSheetChordSymbol(symbol: string): string {
  const trimmed = symbol.trim();
  if (!trimmed || trimmed === "?") return trimmed;

  const slashIdx = trimmed.indexOf("/");
  const head = slashIdx >= 0 ? trimmed.slice(0, slashIdx) : trimmed;

  const m = head.match(ROOT_RE);
  if (!m) return trimmed;

  const step = (m[1] ?? "C").toUpperCase();
  const acc = m[2] ?? "";
  const root = `${step}${acc}`;
  const rawSuffix = (m[3] ?? "").trim();

  if (rawSuffix === "M" || /^maj$/i.test(rawSuffix)) {
    return root;
  }
  if (/^major$/i.test(rawSuffix)) {
    return root;
  }

  let suffix = rawSuffix;
  if (/^min/i.test(suffix)) {
    suffix = `m${suffix.slice(3)}`;
  } else if (suffix.length > 0 && suffix[0] === "M" && !/^maj/i.test(suffix)) {
    suffix = `m${suffix.slice(1)}`;
  }

  return `${root}${suffix}`;
}

/** Map engine Roman numeral + key to RiffScore-style symbol (e.g. C, Dm, G7, Am). */
export function romanToChordSymbol(roman: string, key: KeyContext): string {
  const { quality, hasSeventh } = parseRoman(roman);
  const parsed = parseChord(roman, key);
  const root = spellPitchClass(parsed.rootPc, key);

  if (quality === "half-diminished") return `${root}m7b5`;
  if (quality === "diminished") return hasSeventh ? `${root}dim7` : `${root}dim`;
  if (hasSeventh) {
    if (quality === "major" && /^V/i.test(roman.trim())) return `${root}7`;
    if (quality === "major") return `${root}maj7`;
    return `${root}m7`;
  }
  if (quality === "minor") return `${root}m`;
  if (quality === "augmented") return `${root}+`;
  return root;
}

export interface HarmonyXmlParts {
  symbol: string;
  rootStep: string;
  rootAlter: number;
  kind: string;
  kindText: string;
}

/** Parse a display symbol into MusicXML harmony fields. */
export function chordSymbolToHarmonyParts(symbol: string): HarmonyXmlParts {
  const trimmed = normalizeLeadSheetChordSymbol(symbol.trim());
  const m = trimmed.match(ROOT_RE);
  const step = (m?.[1] ?? "C").toUpperCase();
  const accChar = m?.[2] ?? "";
  let rootAlter = 0;
  if (accChar === "#" || accChar === "♯") rootAlter = 1;
  if (accChar === "b" || accChar === "♭") rootAlter = -1;
  const rawSuffix = m?.[3] ?? "";
  const suffix = rawSuffix.toLowerCase();

  let kind = "major";
  let kindText = trimmed;
  if (suffix.includes("m7b5") || suffix.includes("ø")) {
    kind = "half-diminished";
    kindText = trimmed;
  } else if (suffix.includes("dim")) {
    kind = "diminished";
    kindText = trimmed;
  } else if (suffix.includes("maj7") || suffix.includes("ma7")) {
    kind = "major-seventh";
    kindText = trimmed;
  } else if (suffix === "7" || suffix.endsWith("7") && !suffix.startsWith("m")) {
    kind = "dominant";
    kindText = trimmed;
  } else if (suffix.includes("m7")) {
    kind = "minor-seventh";
    kindText = trimmed;
  } else if (rawSuffix === "M") {
    kind = "major";
    kindText = trimmed;
  } else if (
    (rawSuffix.length > 0 && rawSuffix[0] === "m") ||
    suffix.includes("min")
  ) {
    kind = "minor";
    kindText = trimmed;
  } else if (suffix.includes("+") || suffix.includes("aug")) {
    kind = "augmented";
    kindText = trimmed;
  } else if (suffix) {
    kindText = trimmed;
  }

  return { symbol: trimmed, rootStep: step, rootAlter, kind, kindText };
}

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** MusicXML &lt;harmony&gt; block (no leading measure indent). */
export function chordSymbolToHarmonyXml(symbol: string): string {
  const { rootStep, rootAlter, kind, kindText } = chordSymbolToHarmonyParts(symbol);
  const alterEl = rootAlter !== 0 ? `\n      <root-alter>${rootAlter}</root-alter>` : "";
  return `<harmony>
      <root>
        <root-step>${rootStep}</root-step>${alterEl}
      </root>
      <kind text="${escXml(kindText)}">${kind}</kind>
    </harmony>`;
}

/** Read harmony element → display symbol (prefer kind@text, else build from root/kind). */
export function harmonyElementToSymbol(harmonyEl: Element): string {
  const kindEl = harmonyEl.querySelector("kind") ?? harmonyEl.getElementsByTagName("kind")[0];
  const textAttr = kindEl?.getAttribute("text")?.trim();
  if (textAttr) return normalizeLeadSheetChordSymbol(textAttr);

  const rootEl = harmonyEl.querySelector("root") ?? harmonyEl.getElementsByTagName("root")[0];
  const step =
    rootEl?.querySelector("root-step")?.textContent?.trim() ??
    rootEl?.getElementsByTagName("root-step")[0]?.textContent?.trim() ??
    "C";
  const alterText =
    rootEl?.querySelector("root-alter")?.textContent?.trim() ??
    rootEl?.getElementsByTagName("root-alter")[0]?.textContent?.trim();
  const alter = alterText ? parseInt(alterText, 10) : 0;
  const acc = alter > 0 ? "#" : alter < 0 ? "b" : "";
  const kind = kindEl?.textContent?.trim() ?? "major";

  const base = `${step}${acc}`;
  if (kind === "minor") return `${base}m`;
  if (kind === "dominant") return `${base}7`;
  if (kind === "major-seventh") return `${base}maj7`;
  if (kind === "minor-seventh") return `${base}m7`;
  if (kind === "diminished") return `${base}dim`;
  if (kind === "half-diminished") return `${base}m7b5`;
  if (kind === "augmented") return `${base}+`;
  return normalizeLeadSheetChordSymbol(base);
}

/** Global quarter-note beat → RiffScore quant (16 per quarter). */
export function beatToRiffQuant(beat: number): number {
  return Math.max(0, Math.round(beat * 16));
}
