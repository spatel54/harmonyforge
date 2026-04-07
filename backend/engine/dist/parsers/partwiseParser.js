/**
 * Fallback parser for score-partwise MusicXML.
 * Used when musicxml-interfaces fails (e.g. xsltproc not installed on macOS).
 * Uses fast-xml-parser — no DTD loading, no external deps.
 */
import { XMLParser } from "fast-xml-parser";
import { pitchToMidi } from "../types.js";
const PITCH_CLASSES = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];
function pitchToStr(step, alter, octave) {
    const basePc = {
        C: 0,
        D: 2,
        E: 4,
        F: 5,
        G: 7,
        A: 9,
        B: 11,
    }[step.toUpperCase()];
    if (basePc === undefined)
        return "C4";
    const pcIdx = (basePc + Math.round(alter) + 12) % 12;
    const pc = PITCH_CLASSES[pcIdx < 0 ? pcIdx + 12 : pcIdx];
    return `${pc}${octave}`;
}
function fifthsToKey(fifths, mode) {
    const majorTonics = ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F"];
    const minorTonics = ["A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F", "C", "G", "D"];
    const idx = ((fifths % 12) + 12) % 12;
    const isMinor = mode === "minor";
    const tonic = (isMinor ? minorTonics[idx] : majorTonics[idx]) ?? "C";
    return { tonic, mode: isMinor ? "minor" : "major" };
}
function arr(x) {
    if (x == null)
        return [];
    return Array.isArray(x) ? x : [x];
}
function getNum(val, def) {
    if (val == null)
        return def;
    if (typeof val === "number" && !isNaN(val))
        return val;
    const n = parseInt(String(val), 10);
    return isNaN(n) ? def : n;
}
const parser = new XMLParser({
    ignoreDeclaration: true,
    ignoreAttributes: false,
    parseTagValue: true,
    trimValues: true,
    removeNSPrefix: true,
});
function findPartwiseRoot(obj) {
    if (obj["score-partwise"] && typeof obj["score-partwise"] === "object") {
        return obj["score-partwise"];
    }
    const key = Object.keys(obj).find((k) => k === "score-partwise" || k.endsWith(":score-partwise"));
    return key ? obj[key] : null;
}
function buildPartIdToName(partList) {
    const map = new Map();
    if (!partList || typeof partList !== "object")
        return map;
    for (const sp of arr(partList["score-part"])) {
        if (!sp || typeof sp !== "object")
            continue;
        const o = sp;
        const id = o["@_id"];
        const name = o["part-name"];
        if (typeof id === "string" && typeof name === "string")
            map.set(id, name);
    }
    return map;
}
function extractMelodyFromMeasures(measures) {
    if (measures.length === 0)
        return null;
    let divisions = 4;
    let keyContext = {
        tonic: "C",
        mode: "major",
    };
    let timeSignature = { beats: 4, beatType: 4 };
    const melodyNotes = [];
    let currentBeat = 0;
    for (const measure of measures) {
        const m = measure;
        const attrEl = m.attributes;
        if (attrEl && typeof attrEl === "object") {
            const d = getNum(attrEl.divisions, 4);
            if (!isNaN(d))
                divisions = d;
            const keyObj = attrEl.key;
            if (keyObj && typeof keyObj === "object") {
                const fifths = getNum(keyObj.fifths, 0);
                const mode = typeof keyObj.mode === "string" ? keyObj.mode : "";
                keyContext = fifthsToKey(fifths, mode || undefined);
            }
            const timeObj = attrEl.time;
            if (timeObj && typeof timeObj === "object") {
                timeSignature = {
                    beats: getNum(timeObj.beats, 4),
                    beatType: getNum(timeObj["beat-type"], 4),
                };
            }
        }
        const notes = arr(m.note);
        for (const note of notes) {
            const n = note;
            if (!n || typeof n !== "object")
                continue;
            if ("rest" in n && n.rest != null) {
                const dur = getNum(n.duration, 0);
                currentBeat += dur / divisions;
                continue;
            }
            if ("grace" in n && n.grace != null)
                continue;
            const pitch = n.pitch;
            if (!pitch || typeof pitch !== "object")
                continue;
            const step = typeof pitch.step === "string" ? pitch.step : "C";
            const alter = getNum(pitch.alter, 0);
            const octave = getNum(pitch.octave, 4);
            let dur = getNum(n.duration, divisions);
            if (dur <= 0)
                dur = divisions;
            const chord = n.chord;
            melodyNotes.push({
                pitch: pitchToStr(step, alter, octave),
                beat: currentBeat,
                duration: dur / divisions,
                measure: getNum(m["@_number"], melodyNotes.length + 1),
            });
            if (!chord)
                currentBeat += dur / divisions;
        }
    }
    if (melodyNotes.length === 0)
        return null;
    return {
        melodyNotes,
        currentBeat,
        divisions,
        keyContext,
        timeSignature,
        totalMeasures: measures.length,
    };
}
/** Mean MIDI pitch of extracted notes (for choosing melody part). */
function meanMidiOfNotes(notes) {
    if (notes.length === 0)
        return 0;
    let sum = 0;
    for (const n of notes) {
        sum += pitchToMidi(n.pitch);
    }
    return sum / notes.length;
}
/**
 * Parse score-partwise MusicXML into ParsedScore.
 * When multiple parts exist, picks the part with the highest mean pitch (tie: more notes)—better for melody vs bass on P1.
 * Handles namespaced XML, grace notes (skipped), chords (first pitch).
 */
export function parsePartwiseMusicXML(xml) {
    try {
        if (!xml || typeof xml !== "string")
            return null;
        const parsed = parser.parse(xml);
        if (!parsed || typeof parsed !== "object")
            return null;
        const root = findPartwiseRoot(parsed);
        if (!root || typeof root !== "object")
            return null;
        const parts = arr(root.part);
        if (parts.length === 0)
            return null;
        const partList = root["part-list"];
        const idToName = buildPartIdToName(partList);
        const candidates = [];
        for (const partEl of parts) {
            const p = partEl;
            const partId = typeof p["@_id"] === "string" ? p["@_id"] : "";
            const measures = arr(p.measure);
            const extracted = extractMelodyFromMeasures(measures);
            if (!extracted)
                continue;
            candidates.push({
                ...extracted,
                partId,
                meanMidi: meanMidiOfNotes(extracted.melodyNotes),
            });
        }
        if (candidates.length === 0)
            return null;
        candidates.sort((a, b) => b.meanMidi - a.meanMidi || b.melodyNotes.length - a.melodyNotes.length);
        const best = candidates[0];
        let melodyPartName;
        if (best.partId && idToName.has(best.partId)) {
            melodyPartName = idToName.get(best.partId);
        }
        else if (parts.length === 1) {
            const firstSp = partList ? arr(partList["score-part"])[0] : undefined;
            if (firstSp && typeof firstSp === "object") {
                const pn = firstSp["part-name"];
                if (typeof pn === "string")
                    melodyPartName = pn;
            }
        }
        return {
            key: best.keyContext,
            melody: best.melodyNotes,
            timeSignature: best.timeSignature,
            totalBeats: best.currentBeat,
            totalMeasures: best.totalMeasures,
            melodyPartName,
        };
    }
    catch {
        return null;
    }
}
