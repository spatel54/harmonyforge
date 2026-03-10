/**
 * Parse MIDI → ParsedScore (canonical format)
 * Uses @tonejs/midi for parsing.
 * Format 1: track 0 may be meta-only; uses first track with notes.
 * Extracts key and time signature from header when available.
 */
import MidiModule from "@tonejs/midi";
import { midiToPitch } from "../types.js";
const PITCH_CLASSES = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
const FLAT_TO_SHARP = {
    Cb: "B", Gb: "F#", Db: "C#", Ab: "G#", Eb: "D#", Bb: "A#",
};
function keyToTonic(key) {
    const k = key.trim();
    if (PITCH_CLASSES.includes(k))
        return k;
    return FLAT_TO_SHARP[k] ?? "C";
}
/** Extract melody from first track with notes; key/time from header */
export function parseMIDI(buffer) {
    try {
        const MidiCtor = MidiModule;
        const midi = new MidiCtor(buffer);
        const tracks = midi.tracks;
        if (tracks.length === 0)
            return null;
        const track = tracks.find((t) => (t.notes ?? []).length > 0);
        if (!track)
            return null;
        const notes = track.notes ?? [];
        if (notes.length === 0)
            return null;
        const ppq = midi.header.ppq ?? 480;
        const melody = notes.map((n) => ({
            pitch: midiToPitch(Math.round(n.midi)),
            beat: n.ticks / ppq,
            duration: n.durationTicks / ppq,
        }));
        let key = { tonic: "C", mode: "major" };
        const keySigs = midi.header.keySignatures;
        if (keySigs && keySigs.length > 0) {
            const ks = keySigs[0];
            key = {
                tonic: keyToTonic(ks.key ?? "C"),
                mode: ks.scale === "minor" ? "minor" : "major",
            };
        }
        let timeSignature = { beats: 4, beatType: 4 };
        const timeSigs = midi.header.timeSignatures;
        if (timeSigs && timeSigs.length > 0) {
            const ts = timeSigs[0].timeSignature;
            if (Array.isArray(ts) && ts.length >= 2) {
                timeSignature = {
                    beats: Math.max(1, Math.round(ts[0])),
                    beatType: Math.max(1, Math.round(ts[1])),
                };
            }
        }
        return {
            key,
            melody,
            timeSignature,
            totalBeats: melody.length > 0
                ? Math.max(...melody.map((note) => note.beat + (note.duration ?? 0)))
                : 0,
        };
    }
    catch {
        return null;
    }
}
