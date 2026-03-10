/**
 * Parser for score-timewise MusicXML.
 * Structure: measure → part → note (vs partwise: part → measure → note).
 * Uses fast-xml-parser — no DTD loading, handles namespaces.
 */
import { XMLParser } from "fast-xml-parser";
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
function findRoot(obj) {
    const key = Object.keys(obj).find((k) => k === "score-timewise" ||
        k === "score-partwise" ||
        k.endsWith(":score-timewise") ||
        k.endsWith(":score-partwise"));
    return key ? obj[key] : null;
}
const parser = new XMLParser({
    ignoreDeclaration: true,
    ignoreAttributes: false,
    parseTagValue: true,
    trimValues: true,
    removeNSPrefix: true,
});
/**
 * Parse score-timewise MusicXML into ParsedScore.
 * Extracts melody from the first part in each measure.
 */
export function parseTimewiseMusicXML(xml) {
    try {
        if (!xml || typeof xml !== "string")
            return null;
        const parsed = parser.parse(xml);
        if (!parsed || typeof parsed !== "object")
            return null;
        const root = parsed["score-timewise"] ?? findRoot(parsed);
        if (!root || typeof root !== "object")
            return null;
        const rootObj = root;
        if (!Object.keys(rootObj).some((k) => k.includes("measure") || k === "measure"))
            return null;
        let melodyPartName;
        const partList = rootObj["part-list"];
        if (partList && typeof partList === "object") {
            const scoreParts = arr(partList["score-part"]);
            const first = scoreParts[0];
            if (first && typeof first === "object") {
                const name = first["part-name"];
                if (typeof name === "string")
                    melodyPartName = name;
            }
        }
        const measures = arr(rootObj.measure);
        if (measures.length === 0)
            return null;
        const partIds = [];
        if (partList && typeof partList === "object") {
            const scoreParts = arr(partList["score-part"]);
            for (const sp of scoreParts) {
                if (sp && typeof sp === "object") {
                    const id = sp["@_id"];
                    if (typeof id === "string")
                        partIds.push(id);
                }
            }
        }
        const firstMeasure = measures[0];
        if (partIds.length === 0) {
            const firstParts = arr(firstMeasure.part);
            for (const p of firstParts) {
                if (p && typeof p === "object") {
                    const id = p["@_id"];
                    if (typeof id === "string")
                        partIds.push(id);
                }
            }
        }
        if (partIds.length === 0)
            partIds.push("P1");
        let divisions = 4;
        let keyContext = {
            tonic: "C",
            mode: "major",
        };
        let timeSignature = { beats: 4, beatType: 4 };
        const melodyNotes = [];
        let currentBeat = 0;
        for (let mIdx = 0; mIdx < measures.length; mIdx++) {
            const measure = measures[mIdx];
            const parts = arr(measure.part);
            const firstPart = parts.find((p) => p && p["@_id"] === partIds[0]) ?? parts[0];
            if (!firstPart || typeof firstPart !== "object")
                continue;
            const attrEl = firstPart.attributes ?? measure.attributes;
            if (attrEl && typeof attrEl === "object") {
                const attr = attrEl;
                const d = getNum(attr.divisions, 4);
                if (!isNaN(d))
                    divisions = d;
                const keyObj = attr.key;
                if (keyObj && typeof keyObj === "object") {
                    const k = keyObj;
                    const fifths = getNum(k.fifths, 0);
                    const mode = typeof k.mode === "string" ? k.mode : "";
                    keyContext = fifthsToKey(fifths, mode || undefined);
                }
                const timeObj = attr.time;
                if (timeObj && typeof timeObj === "object") {
                    const t = timeObj;
                    timeSignature = {
                        beats: getNum(t.beats, 4),
                        beatType: getNum(t["beat-type"], 4),
                    };
                }
            }
            const notes = arr(firstPart.note);
            for (const note of notes) {
                if (!note || typeof note !== "object")
                    continue;
                if ("rest" in note && note.rest != null) {
                    const dur = getNum(note.duration, 0);
                    currentBeat += dur / divisions;
                    continue;
                }
                if (note.grace != null)
                    continue;
                const pitch = note.pitch;
                if (!pitch || typeof pitch !== "object")
                    continue;
                const p = pitch;
                const step = typeof p.step === "string" ? p.step : "C";
                const alter = getNum(p.alter, 0);
                const octave = getNum(p.octave, 4);
                const dur = getNum(note.duration, divisions);
                const chord = note.chord;
                melodyNotes.push({
                    pitch: pitchToStr(step, alter, octave),
                    beat: currentBeat,
                    duration: dur / divisions,
                    measure: mIdx + 1,
                });
                if (!chord)
                    currentBeat += dur / divisions;
            }
        }
        if (melodyNotes.length === 0)
            return null;
        return {
            key: keyContext,
            melody: melodyNotes,
            timeSignature,
            totalBeats: currentBeat,
            totalMeasures: measures.length,
            melodyPartName,
        };
    }
    catch {
        return null;
    }
}
