/**
 * Parse MIDI → ParsedScore (canonical format)
 * Uses @tonejs/midi for parsing.
 * Format 1: track 0 may be meta-only; uses first track with notes.
 * Extracts key and time signature from header when available.
 *
 * @tonejs/midi is CommonJS (`exports.Midi`). Node ESM `import { Midi }` fails under `tsx`.
 * Resolve via `createRequire` anchored at `backend/package.json` (cwd is `backend/` for dev, Jest, CLI).
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { midiToPitch } from "../types.js";
const nodeRequire = createRequire(join(process.cwd(), "package.json"));
const { Midi } = nodeRequire("@tonejs/midi");
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
/** Prefer the track whose notes sit highest on average (typical melody); tie-break by note count. */
function pickMelodyTrack(tracks) {
    const withNotes = tracks.filter((t) => (t.notes ?? []).length > 0);
    if (withNotes.length === 0)
        return null;
    if (withNotes.length === 1)
        return withNotes[0] ?? null;
    const scored = withNotes.map((t) => {
        const notes = t.notes ?? [];
        const sum = notes.reduce((s, n) => s + n.midi, 0);
        return { t, mean: sum / notes.length, n: notes.length };
    });
    scored.sort((a, b) => b.mean - a.mean || b.n - a.n);
    return scored[0].t;
}
/** Extract melody from the best candidate track; key/time from header */
export function parseMIDI(buffer) {
    try {
        const midi = new Midi(buffer);
        const tracks = midi.tracks;
        if (tracks.length === 0)
            return null;
        const track = pickMelodyTrack(tracks);
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
