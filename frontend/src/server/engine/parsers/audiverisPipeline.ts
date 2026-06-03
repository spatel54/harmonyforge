/**
 * PDF / image → MusicXML via Audiveris batch CLI (see scripts/audiveris/convert.sh).
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, basename } from "node:path";
import type { ParsedScore } from "../types";
import { mergeParsedScores } from "./mergeParsedScores";
import { parseMusicXML } from "./musicxmlParser";
import { parseMXL } from "./mxlParser";

const LOG_PREVIEW = 800;
const DETAIL_OUTPUT_MAX = 1_800;
/** Audiveris batch on a full score can take several minutes on first run. */
export const DEFAULT_AUDIVERIS_MS = 900_000;

const USE_COMPRESSION_FALSE =
  "org.audiveris.omr.sheet.BookManager.useCompression=false";
const USE_COMPRESSION_TRUE =
  "org.audiveris.omr.sheet.BookManager.useCompression=true";

const MIN_JAVA_VERSION = 25;

const JAVA_HOME_CANDIDATES = [
  "/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home",
  "/usr/local/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home",
  "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home",
  "/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home",
];

function resolveJavaHome(): string | undefined {
  const fromEnv = process.env.JAVA_HOME?.trim();
  if (fromEnv && existsSync(join(fromEnv, "bin", "java"))) return fromEnv;

  for (const home of JAVA_HOME_CANDIDATES) {
    if (existsSync(join(home, "bin", "java"))) return home;
  }

  if (process.platform === "darwin") {
    for (const version of ["25", "26", "27"]) {
      const result = spawnSync("/usr/libexec/java_home", ["-v", version], {
        encoding: "utf-8",
      });
      const home = result.stdout?.trim();
      if (result.status === 0 && home && existsSync(join(home, "bin", "java"))) {
        return home;
      }
    }
  }

  return undefined;
}

function parseJavaMajorVersion(output: string): number | null {
  const match = output.match(/version "(\d+)/);
  if (!match) return null;
  const major = Number.parseInt(match[1]!, 10);
  return Number.isFinite(major) ? major : null;
}

/** Preflight Java before spawning Audiveris (macOS `/usr/bin/java` stub fails opaquely). */
export function checkJavaForAudiveris(details: string[]): boolean {
  const env = audiverisSpawnEnv();
  const javaBin = env.JAVA_HOME ? join(env.JAVA_HOME, "bin", "java") : "java";
  const result = spawnSync(javaBin, ["-version"], {
    encoding: "utf-8",
    env,
    timeout: 10_000,
  });
  const output = [result.stderr, result.stdout].filter(Boolean).join("\n");

  if (result.error) {
    details.push(`java: could not run (${result.error.message})`);
    return false;
  }

  if (/unable to locate a java runtime/i.test(output)) {
    details.push(
      "java: no Java runtime found — install JDK 25+ (e.g. `brew install openjdk@25`) and re-run `make audiveris-setup`",
    );
    return false;
  }

  const major = parseJavaMajorVersion(output);
  if (major == null) {
    details.push(
      "java: could not detect Java version — install JDK 25+ (e.g. `brew install openjdk@25`) and re-run `make audiveris-setup`",
    );
    return false;
  }

  if (major < MIN_JAVA_VERSION) {
    details.push(
      `java: JDK ${MIN_JAVA_VERSION}+ required (found Java ${major}) — install e.g. \`brew install openjdk@25\` and re-run \`make audiveris-setup\``,
    );
    return false;
  }

  return true;
}

function resolveScriptRootDir(): string {
  const main = process.argv[1];
  if (typeof main === "string" && main.length > 0) {
    return dirname(main);
  }
  return process.cwd();
}

function findAudiverisByWalkingUp(fromDir: string): string | null {
  let dir = fromDir;
  for (let i = 0; i < 14; i++) {
    const candidate = join(
      dir,
      "scripts",
      "audiveris",
      "vendor",
      "audiveris",
      "app",
      "build",
      "install",
      "app",
      "bin",
      "Audiveris",
    );
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function resolveAudiverisBin(): string | null {
  const env = process.env.AUDIVERIS_BIN?.trim();
  if (env && existsSync(env)) return env;
  for (const start of [resolveScriptRootDir(), process.cwd()]) {
    const found = findAudiverisByWalkingUp(start);
    if (found) return found;
  }
  return null;
}

export function resolveTessdataPrefix(): string | undefined {
  const env = process.env.TESSDATA_PREFIX?.trim();
  if (env && existsSync(env)) return env;
  for (const start of [resolveScriptRootDir(), process.cwd()]) {
    let dir = start;
    for (let i = 0; i < 14; i++) {
      const candidate = join(dir, "scripts", "audiveris", "tessdata");
      if (existsSync(candidate)) return candidate;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return undefined;
}

function audiverisSpawnEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  const tess = resolveTessdataPrefix();
  if (tess) env.TESSDATA_PREFIX = tess;
  const javaHome = resolveJavaHome();
  if (javaHome) {
    env.JAVA_HOME = javaHome;
    const javaBin = join(javaHome, "bin");
    env.PATH = env.PATH?.includes(javaBin) ? env.PATH : `${javaBin}:${env.PATH ?? ""}`;
  }
  return env;
}

function logSpawnFailure(label: string, result: ReturnType<typeof spawnSync>): void {
  const errBits = [result.stderr, result.stdout]
    .filter(Boolean)
    .join("\n")
    .slice(0, LOG_PREVIEW);
  if (errBits) console.error(`[audiveris] ${label} failed:`, errBits);
}

function appendSpawnOutputExcerpt(
  label: string,
  result: ReturnType<typeof spawnSync>,
  details: string[],
): void {
  const combined = [result.stderr, result.stdout]
    .filter(Boolean)
    .join("\n")
    .trim()
    .replace(/\r\n/g, "\n");
  if (!combined.length) return;
  const excerpt = combined.slice(0, DETAIL_OUTPUT_MAX);
  const suffix = combined.length > DETAIL_OUTPUT_MAX ? "\n… (truncated)" : "";
  details.push(`${label} output:\n${excerpt}${suffix}`);
}

function sanitizeMusicXmlText(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => !/^<!DOCTYPE /i.test(line))
    .join("\n");
}

function collectScoreFiles(dir: string, ext: "xml" | "mxl"): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(`.${ext}`) && !e.name.toLowerCase().endsWith(".omr.xml"))
    .map((e) => join(dir, e.name))
    .sort();
}

function parseScoreFile(path: string): ParsedScore | null {
  try {
    if (/\.mxl$/i.test(path)) {
      const buf = readFileSync(path);
      const parsed = parseMXL(buf);
      return parsed && parsed.melody.length > 0 ? parsed : null;
    }
    const raw = readFileSync(path, "utf-8");
    const xml = sanitizeMusicXmlText(raw);
    const parsed = parseMusicXML(xml);
    return parsed && parsed.melody.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

function parseAudiverisWorkDir(workDir: string): ParsedScore | null {
  const mxlFiles = collectScoreFiles(workDir, "mxl");
  const xmlFiles = collectScoreFiles(workDir, "xml");
  // Phase-2 export produces compressed .mxl; prefer it over phase-1 .xml when both exist.
  const paths = mxlFiles.length > 0 ? mxlFiles : xmlFiles;
  if (paths.length === 0) return null;

  const parsedParts: ParsedScore[] = [];
  for (const p of paths) {
    const one = parseScoreFile(p);
    if (one) parsedParts.push(one);
  }
  return mergeParsedScores(parsedParts);
}

function runAudiverisBatch(
  bin: string,
  args: string[],
  timeoutMs: number,
  details: string[],
  label: string,
): boolean {
  const result = spawnSync(bin, args, {
    encoding: "utf-8",
    timeout: timeoutMs,
    maxBuffer: 50 * 1024 * 1024,
    env: audiverisSpawnEnv(),
  });
  if (result.error) {
    details.push(`${label}: could not run (${result.error.message})`);
    return false;
  }
  if (result.status !== 0) {
    logSpawnFailure(label, result);
    details.push(`${label}: exited with status ${result.status ?? "unknown"}`);
    appendSpawnOutputExcerpt(label, result, details);
    return false;
  }
  return true;
}

/**
 * Run the two-phase Audiveris workflow on a PDF or raster image path.
 */
export function tryAudiverisOnInputFile(
  inputPath: string,
  workDir: string,
  baseName: string,
  timeoutMs: number,
  details: string[],
): ParsedScore | null {
  const bin = resolveAudiverisBin();
  if (!bin) {
    details.push(
      "audiveris: binary not found — run `make audiveris-setup` from repo root or set AUDIVERIS_BIN",
    );
    return null;
  }

  if (!checkJavaForAudiveris(details)) {
    return null;
  }

  const bookWork = join(workDir, baseName);
  try {
    rmSync(bookWork, { recursive: true, force: true });
  } catch {
    // ignore
  }
  mkdirSync(bookWork, { recursive: true });

  const phaseTimeoutMs = Math.max(60_000, Math.floor(timeoutMs / 2));

  const importOk = runAudiverisBatch(
    bin,
    [
      "-batch",
      "-export",
      "-save",
      "-output",
      bookWork,
      "-constant",
      USE_COMPRESSION_FALSE,
      inputPath,
    ],
    phaseTimeoutMs,
    details,
    "audiveris import",
  );
  if (!importOk) return null;

  const omrFile = join(bookWork, `${baseName}.omr`);
  if (!existsSync(omrFile)) {
    details.push("audiveris: no .omr book produced after import");
    return null;
  }

  const exportOk = runAudiverisBatch(
    bin,
    [
      "-batch",
      "-export",
      "-output",
      bookWork,
      "-constant",
      USE_COMPRESSION_TRUE,
      omrFile,
    ],
    phaseTimeoutMs,
    details,
    "audiveris export",
  );
  if (!exportOk) return null;

  const parsed = parseAudiverisWorkDir(bookWork);
  if (!parsed) {
    details.push("audiveris: no MusicXML (.xml/.mxl) produced in output directory");
  }
  return parsed;
}

export function audiverisPipelineFailureMessage(details: string[]): string {
  const base =
    "PDF could not be converted to MusicXML. Setup: run `make audiveris-setup` from the repo root " +
    "(requires Java 25+), or set AUDIVERIS_BIN to the Audiveris CLI. " +
    "Self-hosted Docker images bundle Audiveris — see docs/deployment.md. " +
    "For fastest results, upload MusicXML, MXL, or MIDI directly.";
  if (details.length === 0) return base;
  return `${base}\n\nDetails:\n- ${details.join("\n- ")}`;
}

/**
 * Convert a PDF buffer to ParsedScore via Audiveris.
 */
export function tryAudiverisOnPdfBuffer(
  buffer: Buffer,
  timeoutMs: number = DEFAULT_AUDIVERIS_MS,
): { parsed: ParsedScore | null; details: string[] } {
  const details: string[] = [];
  const tmpDir = mkdtempSync(join(tmpdir(), "hf-audiveris-"));
  const pdfPath = join(tmpDir, "input.pdf");
  try {
    writeFileSync(pdfPath, buffer);
    const parsed = tryAudiverisOnInputFile(pdfPath, tmpDir, "input", timeoutMs, details);
    return { parsed, details };
  } catch (e) {
    console.error("[audiveris] pipeline error:", e);
    details.push(`unexpected error: ${e instanceof Error ? e.message : String(e)}`);
    return { parsed: null, details };
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

/**
 * Convert a PNG/JPG buffer to ParsedScore via Audiveris (when supported by local install).
 */
export function tryAudiverisOnImageBuffer(
  buffer: Buffer,
  ext: "png" | "jpg" | "jpeg",
  timeoutMs: number = DEFAULT_AUDIVERIS_MS,
): { parsed: ParsedScore | null; details: string[] } {
  const details: string[] = [];
  const tmpDir = mkdtempSync(join(tmpdir(), "hf-audiveris-img-"));
  const imagePath = join(tmpDir, `input.${ext === "jpeg" ? "jpg" : ext}`);
  try {
    writeFileSync(imagePath, buffer);
    const base = basename(imagePath).replace(/\.[^.]+$/, "") || "input";
    const parsed = tryAudiverisOnInputFile(imagePath, tmpDir, base, timeoutMs, details);
    return { parsed, details };
  } catch (e) {
    details.push(`unexpected error: ${e instanceof Error ? e.message : String(e)}`);
    return { parsed: null, details };
  } finally {
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
