/**
 * HarmonyForge Logic Core — Backtracking SATB constraint solver
 */
import { midiToPitch, pitchToMidi } from "./types.js";
import { parseChord } from "./chordParser.js";
import { checkVoiceLeading, checkVoiceLeadingRelaxed } from "./constraints.js";
import { getVoiceRange } from "./types.js";
/** Get all MIDI values for a pitch class within a range */
function pcInRange(pc, minMidi, maxMidi) {
    const result = [];
    const basePc = ((pc % 12) + 12) % 12;
    let midi = Math.ceil((minMidi - basePc) / 12) * 12 + basePc;
    while (midi <= maxMidi) {
        if (midi >= minMidi)
            result.push(midi);
        midi += 12;
    }
    return result;
}
/** Build SATB from MIDI values */
function toVoices(b, t, a, s) {
    return {
        bass: midiToPitch(b),
        tenor: midiToPitch(t),
        alto: midiToPitch(a),
        soprano: midiToPitch(s),
    };
}
function mod12(n) {
    return ((n % 12) + 12) % 12;
}
function normalizePitchForSoprano(pitch) {
    const midi = pitchToMidi(pitch);
    const range = getVoiceRange("Soprano");
    const pitchClass = mod12(midi);
    const options = [];
    for (let candidate = range.min; candidate <= range.max; candidate++) {
        if (mod12(candidate) === pitchClass) {
            options.push(candidate);
        }
    }
    if (options.length === 0)
        return pitch;
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
function getActiveMelodyPitchAtBeat(melody, beat) {
    if (melody.length === 0)
        return undefined;
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
function getTonesToAssign(parsed) {
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
function getCandidatesSimple(parsed, fixedSoprano) {
    const tones = getTonesToAssign(parsed);
    const bassRange = getVoiceRange("Bass");
    const tenorRange = getVoiceRange("Tenor");
    const altoRange = getVoiceRange("Alto");
    const sopranoRange = getVoiceRange("Soprano");
    const candidates = [];
    const bassMidis = pcInRange(parsed.bassPc, bassRange.min, bassRange.max);
    for (const b of bassMidis) {
        const uniqueTones = [...new Set(tones)];
        const tenorMidis = uniqueTones.flatMap((pc) => pcInRange(pc, tenorRange.min, tenorRange.max));
        const altoMidis = uniqueTones.flatMap((pc) => pcInRange(pc, altoRange.min, altoRange.max));
        const sopranoMidis = fixedSoprano
            ? [pitchToMidi(normalizePitchForSoprano(fixedSoprano))]
            : uniqueTones.flatMap((pc) => pcInRange(pc, sopranoRange.min, sopranoRange.max));
        for (const s of sopranoMidis) {
            for (const a of altoMidis) {
                if (a >= s)
                    continue;
                if (s - a > 12)
                    continue;
                for (const t of tenorMidis) {
                    if (t >= a)
                        continue;
                    if (a - t > 12)
                        continue;
                    if (t <= b)
                        continue;
                    if (t - b > 19)
                        continue;
                    const pcs = [b % 12, t % 12, a % 12, s % 12];
                    const chordToneSet = new Set(parsed.chordTones.map((pc) => mod12(pc)));
                    if (!pcs.every((pc) => chordToneSet.has(mod12(pc))))
                        continue;
                    const requiredPcs = parsed.seventhPc !== undefined
                        ? [parsed.rootPc, parsed.thirdPc, parsed.seventhPc]
                        : [parsed.rootPc, parsed.thirdPc];
                    if (!requiredPcs.every((pc) => pcs.includes(mod12(pc))))
                        continue;
                    candidates.push(toVoices(b, t, a, s));
                }
            }
        }
    }
    return [...new Map(candidates.map((v) => [JSON.stringify(v), v])).values()];
}
/** Backtracking solver with configurable voice-leading check */
function solve(parsedChords, melodyPitches, check = checkVoiceLeading) {
    const result = [];
    /**
     * Candidate ordering heuristic (not a species-counterpoint cost function).
     * Pedagogical lineage: Fux, *Gradus ad Parnassum* (Mann ed.) and Open Music Theory stress conjunct motion
     * and linear independence; contrary motion toward perfect consonances avoids concealed parallels in strict
     * counterpoint. This engine does **not** encode Fux interval arithmetic or species rules—it only ranks
     * voicings by **sum of absolute MIDI semitone motion** across S/A/T/B vs the previous chord (parsimony proxy).
     * Lower score = tried first during backtracking.
     */
    function candidateMotionScore(prev, curr) {
        if (!prev)
            return 0;
        const keys = ["soprano", "alto", "tenor", "bass"];
        let total = 0;
        for (const k of keys) {
            const d = Math.abs(pitchToMidi(curr[k]) - pitchToMidi(prev[k]));
            total += d;
        }
        return total;
    }
    function backtrack(i) {
        if (i >= parsedChords.length)
            return true;
        let fixedSoprano = melodyPitches?.[i];
        const chordTones = new Set(parsedChords[i].chordTones.map((pc) => ((pc % 12) + 12) % 12));
        if (fixedSoprano) {
            const melodyPc = mod12(pitchToMidi(fixedSoprano));
            if (!chordTones.has(melodyPc)) {
                fixedSoprano = undefined;
            }
        }
        const prev = i > 0 ? result[i - 1] : null;
        const candidates = getCandidatesSimple(parsedChords[i], fixedSoprano)
            .sort((a, b) => candidateMotionScore(prev, a) - candidateMotionScore(prev, b));
        for (const v of candidates) {
            if (!check(prev, v))
                continue;
            result.push(v);
            if (backtrack(i + 1))
                return true;
            result.pop();
        }
        return false;
    }
    if (backtrack(0))
        return result;
    return null;
}
/** Main entry: generate SATB from lead sheet */
export function generateSATB(leadSheet, options) {
    const { key, chords, melody } = leadSheet;
    const parsedChords = [];
    for (const slot of chords) {
        try {
            parsedChords.push(parseChord(slot.roman, key));
        }
        catch {
            return null;
        }
    }
    let melodyPitches;
    if (melody && melody.length > 0 && chords.length > 0) {
        melodyPitches = chords.map((c, i) => {
            const beat = c.beat ?? i;
            return getActiveMelodyPitchAtBeat(melody, beat);
        });
    }
    const useRelaxedFirst = options?.genre === "jazz" || options?.genre === "pop";
    const strictCheck = useRelaxedFirst ? checkVoiceLeadingRelaxed : checkVoiceLeading;
    const fallbackCheck = useRelaxedFirst ? checkVoiceLeading : checkVoiceLeadingRelaxed;
    let solution = solve(parsedChords, melodyPitches, strictCheck);
    if (!solution) {
        solution = solve(parsedChords, melodyPitches, fallbackCheck);
    }
    if (!solution)
        return null;
    return {
        slots: chords.map((chord, i) => ({
            chord: {
                roman: chord.roman,
                duration: chord.duration,
                beat: chord.beat,
            },
            voices: solution[i],
        })),
    };
}
