/**
 * HarmonyForge Logic Core — Shared types and pitch helpers
 * SATB ranges: conventional choral clamps (Aldwell & Schachter / Open Music Theory pedagogy); see Taxonomy.md §1.6.
 */
// ─── SATB Ranges (MIDI note numbers) per Taxonomy.md §1.6 ─────────────────────
const RANGES = {
    Soprano: { min: 60, max: 79 }, // C4–G5
    Alto: { min: 55, max: 74 }, // G3–D5
    Tenor: { min: 48, max: 67 }, // C3–G4
    Bass: { min: 41, max: 62 }, // F2–D4
};
const PITCH_CLASSES = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
];
/** Parse "C4" or "G#3" → MIDI note number */
export function pitchToMidi(pitch) {
    const match = pitch.match(/^([A-G]#?)(-?\d+)$/);
    if (!match)
        throw new Error(`Invalid pitch: ${pitch}`);
    const [, pc, oct] = match;
    const pcIndex = PITCH_CLASSES.indexOf(pc);
    if (pcIndex < 0)
        throw new Error(`Unknown pitch class: ${pc}`);
    const octave = parseInt(oct, 10);
    return 12 * (octave + 1) + pcIndex;
}
/** MIDI note number → "C4" or "G#3" */
export function midiToPitch(midi) {
    const octave = Math.floor(midi / 12) - 1;
    const pcIndex = ((midi % 12) + 12) % 12;
    return `${PITCH_CLASSES[pcIndex]}${octave}`;
}
/** Check if pitch (as "C4" or MIDI) is within voice range */
export function inRange(voice, pitch) {
    const midi = typeof pitch === "string" ? pitchToMidi(pitch) : pitch;
    const range = RANGES[voice];
    return midi >= range.min && midi <= range.max;
}
/** Get valid MIDI range for a voice */
export function getVoiceRange(voice) {
    return { ...RANGES[voice] };
}
/** Get pitch class (0–11) from pitch string */
export function pitchToPc(pitch) {
    const match = pitch.match(/^([A-G]#?)/);
    if (!match)
        throw new Error(`Invalid pitch: ${pitch}`);
    const pc = match[1];
    const idx = PITCH_CLASSES.indexOf(pc);
    if (idx < 0)
        throw new Error(`Unknown pitch class: ${pc}`);
    return idx;
}
