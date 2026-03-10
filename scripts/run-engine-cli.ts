/**
 * CLI to run HarmonyForge engine: input MusicXML → output MusicXML with melody + harmonies
 *
 * Usage:
 *   npx tsx scripts/run-engine-cli.ts
 *   npx tsx scripts/run-engine-cli.ts --input input/foo.xml --output output/foo_out.xml
 *   npx tsx scripts/run-engine-cli.ts -i input/foo.xml -o output/foo_out.xml --mood minor
 *   npx tsx scripts/run-engine-cli.ts --instruments "Soprano:Flute,Bass:Cello"
 *
 * Options:
 *   -i, --input <path>    Input MusicXML (default: input/月亮代表我的心.xml)
 *   -o, --output <path>   Output path (default: output/<name>_flute_cello.xml)
 *   --mood <major|minor>  Key mode (default: major)
 *   --instruments <spec>  Comma-separated Voice:Instrument (e.g. "Soprano:Flute,Bass:Cello")
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { parseMusicXML } from "../engine/parsers/musicxmlParser.js";
import { ensureChords } from "../engine/chordInference.js";
import { generateSATB } from "../engine/solver.js";
import { satbToMusicXML } from "../engine/satbToMusicXML.js";
import type { Voice } from "../engine/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const DEFAULT_INPUT = join(ROOT, "input", "月亮代表我的心.xml");
const DEFAULT_INSTRUMENTS: Record<Voice, string[]> = {
  Soprano: ["Flute"],
  Alto: [],
  Tenor: [],
  Bass: ["Cello"],
};

function parseArgs(): {
  input: string;
  output: string;
  mood: "major" | "minor";
  instruments: Record<Voice, string[]>;
} {
  const args = process.argv.slice(2);
  let input = DEFAULT_INPUT;
  let output = "";
  let mood: "major" | "minor" = "major";
  let instruments: Record<Voice, string[]> = { ...DEFAULT_INSTRUMENTS };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-i" || a === "--input") {
      input = args[++i] ?? input;
    } else if (a === "-o" || a === "--output") {
      output = args[++i] ?? output;
    } else if (a === "--mood") {
      const m = args[++i];
      if (m === "minor" || m === "major") mood = m;
    } else if (a === "--instruments") {
      const spec = args[++i] ?? "";
      instruments = { Soprano: [], Alto: [], Tenor: [], Bass: [] };
      for (const pair of spec.split(",")) {
        const [voice, inst] = pair.split(":").map((s) => s.trim());
        if (voice && inst) {
          const v = voice as Voice;
          if (["Soprano", "Alto", "Tenor", "Bass"].includes(v)) {
            instruments[v] = [inst];
          }
        }
      }
    }
  }

  if (!output) {
    const base = input.replace(/\.(xml|musicxml)$/i, "").split(/[/\\]/).pop() ?? "output";
    const suffix = Object.values(instruments).flat().filter(Boolean).join("_").toLowerCase() || "flute_cello";
    output = join(ROOT, "output", `${base}_${suffix}.xml`);
  }

  return { input, output, mood, instruments };
}

function main(): number {
  const { input, output, mood, instruments } = parseArgs();

  let xml: string;
  try {
    xml = readFileSync(input, "utf-8");
  } catch (e) {
    console.error(`Error reading ${input}:`, e);
    return 1;
  }

  const parsed = parseMusicXML(xml);
  if (!parsed || parsed.melody.length === 0) {
    console.error("Could not parse file or no melody found");
    return 1;
  }

  const withChords = ensureChords(parsed, mood);
  const result = generateSATB({
    key: withChords.key,
    chords: withChords.chords,
    melody: withChords.melody,
  });

  if (!result) {
    console.error("Could not find valid SATB arrangement");
    return 1;
  }

  const musicXML = satbToMusicXML(result, instruments, withChords, {
    format: "partwise",
    version: "2.0",
    additiveHarmonies: true,
  });

  try {
    writeFileSync(output, musicXML, "utf-8");
  } catch (e) {
    console.error(`Error writing ${output}:`, e);
    return 1;
  }

  console.log(`Success: wrote ${output}`);
  return 0;
}

process.exit(main());
