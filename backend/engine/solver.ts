/**
 * HarmonyForge Logic Core — Backtracking SATB constraint solver
 */

import { midiToPitch, pitchToMidi } from "./types.js";
import type { LeadSheet, MelodyNote, ParsedChord, SATBVoices, Genre } from "./types.js";
import { parseChord } from "./chordParser.js";
import { checkVoiceLeading, checkVoiceLeadingRelaxed } from "./constraints.js";
import { getVoiceRange } from "./types.js";

/** Get all MIDI values for a pitch class within a range */
function pcInRange(pc: number, minMidi: number, maxMidi: number): number[] {
  const result: number[] = [];
  const basePc = ((pc % 12) + 12) % 12;
  let midi = Math.ceil((minMidi - basePc) / 12) * 12 + basePc;
  while (midi <= maxMidi) {
    if (midi >= minMidi) result.push(midi);
    midi += 12;
  }
  return result;
}

/** Build SATB from MIDI values */
function toVoices(b: number, t: number, a: number, s: number): SATBVoices {
  return {
    bass: midiToPitch(b),
    tenor: midiToPitch(t),
    alto: midiToPitch(a),
    soprano: midiToPitch(s),
  };
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

function normalizePitchForSoprano(pitch: string): string {
  const midi = pitchToMidi(pitch);
  const range = getVoiceRange("Soprano");
  const pitchClass = mod12(midi);
  const options: number[] = [];

  for (let candidate = range.min; candidate <= range.max; candidate++) {
    if (mod12(candidate) === pitchClass) {
      options.push(candidate);
    }
  }

  if (options.length === 0) return pitch;

  const best = options.reduce((closest, candidate) => {
    const candidateDistance = Math.abs(candidate - midi);
    const closestDistance = Math.abs(closest - midi);
    if (candidateDistance !== closestDistance) {
      return candidateDistance < closestDistance ? candidate : closest;
    }
    return candidate > closest ? candidate : closest;
  });

  return midiToPitch(best);
}

function getActiveMelodyPitchAtBeat(melody: MelodyNote[], beat: number): string | undefined {
  if (melody.length === 0) return undefined;

  const sorted = [...melody].sort((a, b) => a.beat - b.beat);

  for (let i = 0; i < sorted.length; i++) {
    const note = sorted[i];
    const nextBeat = sorted[i + 1]?.beat;
    const explicitEnd = note.duration !== undefined ? note.beat + note.duration : undefined;
    const endBeat = explicitEnd ?? nextBeat ?? Number.POSITIVE_INFINITY;
    if (beat >= note.beat && beat < endBeat) {
      return note.pitch;
    }
  }

  const lastStarted = [...sorted].reverse().find((note) => note.beat <= beat);
  return lastStarted?.pitch;
}

/** Chord tones for assignment. For triads: [r,t,f,r] (double root). Diminished: [r,t,f,t]. 7th: [r,t,f,7] no double. */
function getTonesToAssign(parsed: ParsedChord): number[] {
  const { rootPc, thirdPc, fifthPc, seventhPc, chordTones } = parsed;
  if (seventhPc !== undefined) {
    return [rootPc, thirdPc, fifthPc, seventhPc];
  }
  // Triad: double root for major/minor, double third for diminished
  const isDim = chordTones[1] - chordTones[0] === 3 && chordTones[2] - chordTones[0] === 6;
  if (isDim) {
    return [rootPc, thirdPc, fifthPc, thirdPc];
  }
  return [rootPc, thirdPc, fifthPc, rootPc];
}

/** Generate candidate voicings by iterating over chord tones in range */
function getCandidatesSimple(
  parsed: ParsedChord,
  fixedSoprano?: string
): SATBVoices[] {
  const tones = getTonesToAssign(parsed);
  const bassRange = getVoiceRange("Bass");
  const tenorRange = getVoiceRange("Tenor");
  const altoRange = getVoiceRange("Alto");
  const sopranoRange = getVoiceRange("Soprano");

  const candidates: SATBVoices[] = [];
  const bassMidis = pcInRange(parsed.bassPc, bassRange.min, bassRange.max);

  for (const b of bassMidis) {
    const uniqueTones = [...new Set(tones)];
    const tenorMidis = uniqueTones.flatMap((pc) =>
      pcInRange(pc, tenorRange.min, tenorRange.max)
    );
    const altoMidis = uniqueTones.flatMap((pc) =>
      pcInRange(pc, altoRange.min, altoRange.max)
    );
    const sopranoMidis = fixedSoprano
      ? [pitchToMidi(normalizePitchForSoprano(fixedSoprano))]
      : uniqueTones.flatMap((pc) =>
          pcInRange(pc, sopranoRange.min, sopranoRange.max)
        );

    for (const s of sopranoMidis) {
      for (const a of altoMidis) {
        if (a >= s) continue;
        if (s - a > 12) continue;
        for (const t of tenorMidis) {
          if (t >= a) continue;
          if (a - t > 12) continue;
          if (t <= b) continue;
          if (t - b > 19) continue;

          const pcs = [b % 12, t % 12, a % 12, s % 12];
          const chordToneSet = new Set(parsed.chordTones.map((pc) => mod12(pc)));
          if (!pcs.every((pc) => chordToneSet.has(mod12(pc)))) continue;

          const requiredPcs = parsed.seventhPc !== undefined
            ? [parsed.rootPc, parsed.thirdPc, parsed.seventhPc]
            : [parsed.rootPc, parsed.thirdPc];
          if (!requiredPcs.every((pc) => pcs.includes(mod12(pc)))) continue;

          candidates.push(toVoices(b, t, a, s));
        }
      }
    }
  }

  return [...new Map(candidates.map((v) => [JSON.stringify(v), v])).values()];
}

/** Memoized wrapper: same slot + fixed soprano → same candidate list (sort order applied per pass). */
type CandidateGetter = (
  slotIndex: number,
  pc: ParsedChord,
  fixedSoprano: string | undefined,
) => SATBVoices[];

function createCandidateCache(): CandidateGetter {
  const cache = new Map<string, SATBVoices[]>();
  return (slotIndex: number, pc: ParsedChord, fixedSoprano: string | undefined) => {
    const key = `${slotIndex}\0${fixedSoprano ?? ""}`;
    let list = cache.get(key);
    if (!list) {
      list = getCandidatesSimple(pc, fixedSoprano);
      cache.set(key, list);
    }
    return list;
  };
}

function candidateMotionScore(prev: SATBVoices | null, curr: SATBVoices): number {
  if (!prev) return 0;
  const keys: (keyof SATBVoices)[] = ["soprano", "alto", "tenor", "bass"];
  let total = 0;
  for (const k of keys) {
    const d = Math.abs(pitchToMidi(curr[k]) - pitchToMidi(prev[k]));
    total += d;
  }
  return total;
}

type VoiceLeadingCheck = (prev: SATBVoices | null, curr: SATBVoices) => boolean;

export class SolverBudgetExceededError extends Error {
  readonly code = "SOLVER_BUDGET_EXCEEDED" as const;
  constructor(message = "SATB search exceeded the configured time or node budget") {
    super(message);
    this.name = "SolverBudgetExceededError";
  }
}

const DEFAULT_SOLVER_MAX_NODES = 3_000_000;

export function resolveSolverMaxNodes(): number {
  const raw = process.env.HF_SOLVER_MAX_NODES;
  if (raw == null || raw === "") return DEFAULT_SOLVER_MAX_NODES;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 10_000) return DEFAULT_SOLVER_MAX_NODES;
  return Math.min(n, 50_000_000);
}

/** 0 = no wall-clock limit. */
export function resolveSolverMaxMs(): number {
  const raw = process.env.HF_SOLVER_MAX_MS;
  if (raw == null || raw === "") return 0;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 600_000);
}

/**
 * Reserved for future tuning (e.g. auto-only-above-N). Does not gate greedy in `auto` mode:
 * greedy is always attempted first when mode is `auto` or `greedy`.
 */
const DEFAULT_GREEDY_THRESHOLD = 56;

export function resolveGreedyThreshold(): number {
  const raw = process.env.HF_GREEDY_THRESHOLD;
  if (raw == null || raw === "") return DEFAULT_GREEDY_THRESHOLD;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 4) return DEFAULT_GREEDY_THRESHOLD;
  return Math.min(n, 512);
}

/** auto: always try greedy first, then backtrack; greedy: same; backtrack|exact: skip greedy. */
export function resolveSolverMode(): "auto" | "greedy_first" | "backtrack_only" {
  const m = process.env.HF_SOLVER_MODE?.trim().toLowerCase();
  if (m === "backtrack" || m === "exact") return "backtrack_only";
  if (m === "greedy") return "greedy_first";
  return "auto";
}

type SolveOutcome =
  | { ok: true; voices: SATBVoices[] }
  | { ok: false; budgetExceeded: boolean };

/**
 * Linear-time voicing: first valid candidate per slot (same ordering as backtrack).
 * May return null where backtracking would find a solution.
 */
function solveGreedy(
  parsedChords: ParsedChord[],
  melodyPitches: (string | undefined)[] | undefined,
  check: VoiceLeadingCheck,
  getCand: CandidateGetter,
): SATBVoices[] | null {
  const result: SATBVoices[] = [];
  let prev: SATBVoices | null = null;
  for (let i = 0; i < parsedChords.length; i++) {
    let fixedSoprano = melodyPitches?.[i];
    const chordTones = new Set(parsedChords[i].chordTones.map((pc) => ((pc % 12) + 12) % 12));
    if (fixedSoprano) {
      const melodyPc = mod12(pitchToMidi(fixedSoprano));
      if (!chordTones.has(melodyPc)) {
        fixedSoprano = undefined;
      }
    }
    const candidates = getCand(i, parsedChords[i], fixedSoprano).slice().sort((a, b) => candidateMotionScore(prev, a) - candidateMotionScore(prev, b));
    const found = candidates.find((v) => check(prev, v));
    if (!found) return null;
    result.push(found);
    prev = found;
  }
  return result;
}

/** Backtracking solver with configurable voice-leading check and safety budget. */
function solve(
  parsedChords: ParsedChord[],
  melodyPitches: (string | undefined)[] | undefined,
  check: VoiceLeadingCheck,
  maxNodes: number,
  deadlineMs: number,
  getCand: CandidateGetter,
): SolveOutcome {
  const result: SATBVoices[] = [];
  let nodes = 0;

  function overBudget(): boolean {
    if (nodes >= maxNodes) return true;
    if (deadlineMs > 0 && Date.now() >= deadlineMs) return true;
    return false;
  }

  function backtrack(i: number): boolean {
    nodes += 1;
    if (overBudget()) return false;
    if (i >= parsedChords.length) return true;

    let fixedSoprano = melodyPitches?.[i];
    const chordTones = new Set(parsedChords[i].chordTones.map((pc) => ((pc % 12) + 12) % 12));
    if (fixedSoprano) {
      const melodyPc = mod12(pitchToMidi(fixedSoprano));
      if (!chordTones.has(melodyPc)) {
        fixedSoprano = undefined;
      }
    }
    const prev = i > 0 ? result[i - 1] : null;
    const candidates = getCand(i, parsedChords[i], fixedSoprano)
      .slice()
      .sort((a, b) => candidateMotionScore(prev, a) - candidateMotionScore(prev, b));

    for (const v of candidates) {
      if (!check(prev, v)) continue;
      result.push(v);
      if (backtrack(i + 1)) return true;
      result.pop();
    }
    return false;
  }

  const ok = backtrack(0);
  if (ok) return { ok: true, voices: result };
  if (overBudget() || nodes >= maxNodes) return { ok: false, budgetExceeded: true };
  return { ok: false, budgetExceeded: false };
}

export interface SolverResult {
  slots: Array<{ chord: { roman: string; duration?: string; beat?: number }; voices: SATBVoices }>;
}

/** Options for generation: genre affects voice-leading strictness (classical=strict, jazz/pop=relaxed) */
export interface GenerateSATBOptions {
  genre?: Genre;
  /** Override env HF_SOLVER_MAX_NODES for tests. */
  maxNodes?: number;
  /** Override env HF_SOLVER_MAX_MS (0 = no limit). */
  maxMs?: number;
  /** Skip greedy first pass (tests / deterministic backtrack-only). */
  skipGreedy?: boolean;
}

/** Main entry: generate SATB from lead sheet */
export function generateSATB(
  leadSheet: LeadSheet,
  options?: GenerateSATBOptions
): SolverResult | null {
  const { key, chords, melody } = leadSheet;
  const parsedChords: ParsedChord[] = [];

  for (const slot of chords) {
    try {
      parsedChords.push(parseChord(slot.roman, key));
    } catch {
      return null;
    }
  }

  let melodyPitches: (string | undefined)[] | undefined;
  if (melody && melody.length > 0 && chords.length > 0) {
    melodyPitches = chords.map((c, i) => {
      const beat = c.beat ?? i;
      return getActiveMelodyPitchAtBeat(melody, beat);
    });
  }

  const useRelaxedFirst = options?.genre === "jazz" || options?.genre === "pop";
  const strictCheck = useRelaxedFirst ? checkVoiceLeadingRelaxed : checkVoiceLeading;
  const fallbackCheck = useRelaxedFirst ? checkVoiceLeading : checkVoiceLeadingRelaxed;

  const maxNodes = options?.maxNodes ?? resolveSolverMaxNodes();
  const maxMs = options?.maxMs ?? resolveSolverMaxMs();
  const deadlineMs = maxMs > 0 ? Date.now() + maxMs : 0;

  const getCand = createCandidateCache();
  const mode = resolveSolverMode();
  const useGreedyFirst =
    !options?.skipGreedy && (mode === "greedy_first" || mode === "auto");

  const tryGreedy = (check: VoiceLeadingCheck): SATBVoices[] | null =>
    solveGreedy(parsedChords, melodyPitches, check, getCand);

  let solution: SATBVoices[] | null = null;
  if (useGreedyFirst) {
    solution = tryGreedy(strictCheck) ?? tryGreedy(fallbackCheck);
  }

  const run = (check: VoiceLeadingCheck): SolveOutcome =>
    solve(parsedChords, melodyPitches, check, maxNodes, deadlineMs, getCand);

  let outcome: SolveOutcome;
  if (solution) {
    outcome = { ok: true, voices: solution };
  } else {
    outcome = run(strictCheck);
  }
  if (!outcome.ok && outcome.budgetExceeded) {
    throw new SolverBudgetExceededError();
  }
  if (!outcome.ok) {
    outcome = run(fallbackCheck);
  }
  if (!outcome.ok) {
    if (outcome.budgetExceeded) throw new SolverBudgetExceededError();
    return null;
  }

  const voices = outcome.voices;
  return {
    slots: chords.map((chord, i) => ({
      chord: {
        roman: chord.roman,
        duration: chord.duration,
        beat: chord.beat,
      },
      voices: voices[i],
    })),
  };
}
