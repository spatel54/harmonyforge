/**
 * Chord inference: when no chords in file, infer diatonic progression.
 * Genre affects candidates and transition preferences (HFLitReview: classical vs jazz vs pop).
 */
import { parseChord } from "./chordParser.js";
const MAJOR_TRIADS = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const MINOR_TRIADS = ["i", "ii°", "III", "iv", "v", "VI", "VII"];
/** Jazz: 7th chords as foundational unit */
const MAJOR_JAZZ = ["I", "ii7", "iii7", "IV", "V7", "vi7", "viiø7"];
const MINOR_JAZZ = ["i7", "iiø7", "III7", "iv7", "v7", "VI7", "VII7"];
/** Pop: cyclical schemas, plagal motion, modal borrowing (bVII, bVI) */
const MAJOR_POP = ["I", "ii", "iii", "IV", "V", "vi", "vii°", "bVII"];
const MINOR_POP = ["i", "ii°", "III", "iv", "v", "VI", "VII", "bVI"];
const TRANSITION_BONUS = {
    I: ["ii", "iii", "IV", "V", "vi"],
    ii: ["V", "vii°"],
    iii: ["vi", "IV"],
    IV: ["I", "ii", "V", "vii°"],
    V: ["I", "vi"],
    vi: ["ii", "IV", "V"],
    "vii°": ["I", "iii"],
    i: ["ii°", "III", "iv", "v", "VI", "VII"],
    "ii°": ["v", "VII"],
    III: ["VI", "iv"],
    iv: ["i", "ii°", "v", "VII"],
    v: ["i", "VI"],
    VI: ["ii°", "iv", "v"],
    VII: ["i", "III"],
};
/** Jazz ii–V–I and pop cyclical schemas (I–vi–IV–V, vi–IV–I–V) */
const JAZZ_TRANSITION_BONUS = {
    ...TRANSITION_BONUS,
    ii7: ["V7", "viiø7"],
    V7: ["I", "vi7"],
};
const POP_TRANSITION_BONUS = {
    ...TRANSITION_BONUS,
    I: ["vi", "IV", "V"],
    vi: ["IV", "I", "V"],
    IV: ["I", "V", "vi"],
    V: ["I", "vi"],
    bVII: ["I", "IV"],
    bVI: ["i", "V"],
};
function pitchToPc(pitch) {
    const match = pitch.match(/^([A-G])(#?)/);
    if (!match)
        return 0;
    const step = match[1];
    const sharp = match[2] === "#" ? 1 : 0;
    const base = {
        C: 0,
        D: 2,
        E: 4,
        F: 5,
        G: 7,
        A: 9,
        B: 11,
    }[step] ?? 0;
    return (base + sharp) % 12;
}
function getActiveMelodyNote(melody, beat) {
    const sorted = [...melody].sort((a, b) => a.beat - b.beat);
    for (let i = 0; i < sorted.length; i++) {
        const note = sorted[i];
        const nextBeat = sorted[i + 1]?.beat;
        const endBeat = note.duration !== undefined
            ? note.beat + note.duration
            : nextBeat ?? Number.POSITIVE_INFINITY;
        if (beat >= note.beat && beat < endBeat)
            return note;
    }
    return [...sorted].reverse().find((note) => note.beat <= beat);
}
function getMelodySlice(melody, startBeat, endBeat) {
    return melody.filter((note) => {
        const noteEnd = note.duration !== undefined ? note.beat + note.duration : note.beat;
        return (note.beat >= startBeat && note.beat < endBeat) || (note.beat <= startBeat && noteEnd > startBeat);
    });
}
function getChordStepSize(parsed) {
    const beatsPerMeasure = parsed.timeSignature?.beats ?? 4;
    if (beatsPerMeasure >= 4)
        return 2;
    if (beatsPerMeasure === 3)
        return 1.5;
    return Math.max(1, beatsPerMeasure);
}
/** Default cap on inferred chord slots (long scores widen the grid). Override with HF_MAX_CHORD_SLOTS. */
export const DEFAULT_MAX_CHORD_SLOTS = 128;
/** Minimum beats per chord when widening the grid (floor at one beat). */
const MIN_BEATS_PER_CHORD_WHEN_ADAPTIVE = 1;
export function resolveMaxChordSlots() {
    const raw = process.env.HF_MAX_CHORD_SLOTS;
    if (raw == null || raw === "")
        return DEFAULT_MAX_CHORD_SLOTS;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 8)
        return DEFAULT_MAX_CHORD_SLOTS;
    return Math.min(n, 512);
}
/**
 * Base grid step from meter, then widen if the score would exceed max chord slots (keeps SATB solver tractable).
 */
export function resolveAdaptiveBeatsPerChord(parsed, lastBeat, maxSlots = resolveMaxChordSlots()) {
    let beatsPerChord = getChordStepSize(parsed);
    if (lastBeat <= 0)
        return beatsPerChord;
    const estimatedSlots = Math.ceil(lastBeat / beatsPerChord);
    if (estimatedSlots <= maxSlots)
        return beatsPerChord;
    return Math.max(lastBeat / maxSlots, MIN_BEATS_PER_CHORD_WHEN_ADAPTIVE);
}
/** Infer chords from melody with melody-compatible diatonic selection. Genre affects candidates and transitions. */
export function inferChords(parsed, mood, genre) {
    const melody = parsed.melody;
    if (melody.length === 0)
        return [{ roman: "I", beat: 0 }];
    const lastBeat = parsed.totalBeats ?? Math.max(...melody.map((n) => {
        const end = n.beat + (n.duration ?? 0);
        return end > n.beat ? end : n.beat;
    }), 0);
    const useMinor = mood !== undefined ? mood === "minor" : parsed.key.mode === "minor";
    const candidates = (() => {
        if (genre === "jazz")
            return useMinor ? [...MINOR_JAZZ] : [...MAJOR_JAZZ];
        if (genre === "pop")
            return useMinor ? [...MINOR_POP] : [...MAJOR_POP];
        return useMinor ? [...MINOR_TRIADS] : [...MAJOR_TRIADS];
    })();
    const transitionBonus = genre === "jazz" ? JAZZ_TRANSITION_BONUS : genre === "pop" ? POP_TRANSITION_BONUS : TRANSITION_BONUS;
    const chords = [];
    const beatsPerChord = resolveAdaptiveBeatsPerChord(parsed, lastBeat);
    let beat = 0;
    let previousRoman;
    while (beat < lastBeat || chords.length === 0) {
        const endBeat = Math.min(beat + beatsPerChord, lastBeat || beat + beatsPerChord);
        const activeNote = getActiveMelodyNote(melody, beat);
        const activePc = activeNote ? pitchToPc(activeNote.pitch) : undefined;
        const windowPitchClasses = new Set(getMelodySlice(melody, beat, endBeat).map((note) => pitchToPc(note.pitch)));
        const ranked = candidates
            .map((roman) => {
            const parsedChord = parseChord(roman, {
                tonic: parsed.key.tonic,
                mode: useMinor ? "minor" : "major",
            });
            const chordTones = new Set(parsedChord.chordTones);
            const containsActive = activePc === undefined || chordTones.has(activePc);
            let score = containsActive ? 20 : -100;
            for (const pitchClass of windowPitchClasses) {
                score += chordTones.has(pitchClass) ? 4 : -2;
            }
            if (previousRoman) {
                if (roman === previousRoman)
                    score += 2;
                if (transitionBonus[previousRoman]?.includes(roman))
                    score += 3;
            }
            else if (roman === (useMinor ? "i" : "I")) {
                score += 2;
            }
            return { roman, score };
        })
            .sort((a, b) => b.score - a.score);
        const selected = ranked[0]?.roman ?? (useMinor ? "i" : "I");
        chords.push({ roman: selected, beat });
        previousRoman = selected;
        beat += beatsPerChord;
    }
    return chords;
}
/**
 * When MusicXML embeds more harmony symbols than the solver cap, keep an evenly spaced subset
 * in beat order (always includes first and last slots) so SATB search stays tractable.
 */
export function downsampleChordSlotsToMax(chords, maxSlots) {
    if (chords.length <= maxSlots)
        return chords;
    const indexed = chords.map((c, i) => ({ c, i }));
    indexed.sort((a, b) => {
        const ba = a.c.beat ?? a.i;
        const bb = b.c.beat ?? b.i;
        if (ba !== bb)
            return ba - bb;
        return a.i - b.i;
    });
    const sorted = indexed.map((x) => x.c);
    const idxSet = new Set();
    const denom = Math.max(1, maxSlots - 1);
    for (let j = 0; j < maxSlots; j++) {
        const idx = Math.round((j / denom) * (sorted.length - 1));
        idxSet.add(idx);
    }
    return Array.from(idxSet)
        .sort((a, b) => a - b)
        .map((i) => sorted[i]);
}
/** Ensure ParsedScore has chords (use inferred if missing). Mood and genre affect inference. */
export function ensureChords(parsed, mood, genre) {
    if (parsed.chords && parsed.chords.length > 0) {
        const maxSlots = resolveMaxChordSlots();
        const chords = parsed.chords.length > maxSlots
            ? downsampleChordSlotsToMax(parsed.chords, maxSlots)
            : parsed.chords;
        return { ...parsed, chords };
    }
    const chords = inferChords(parsed, mood, genre);
    const key = mood !== undefined
        ? { ...parsed.key, mode: mood }
        : parsed.key;
    return { ...parsed, key, chords };
}
