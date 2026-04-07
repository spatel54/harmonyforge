/**
 * Parse MusicXML (backend SATB format) → EditableScore.
 * Browser-safe: uses DOMParser.
 * Supports both score-timewise and score-partwise (e.g. MuseScore exports).
 */

import type { EditableScore, Note, Measure, Part } from "./scoreTypes";
import { generateId } from "./scoreTypes";
import { looksLikeMusicXml } from "./musicXmlMarkers";

/** Fallback when part name is generic SATB (engine default labels). */
const PART_CLEFS: Record<string, string> = {
  P1: "treble",
  P2: "treble",
  P3: "treble",
  P4: "bass",
};

/**
 * Clef from instrument / part name (checked before P1–P4 defaults so additive
 * scores with Viola / Cello / Bassoon on P2+ get correct clefs).
 */
/** `<sound tempo="…"/>` from the first measure that declares it (MusicXML). */
function extractSoundTempoBpm(measureEl: Element | null): number | undefined {
  if (!measureEl) return;
  const sounds =
    measureEl.querySelectorAll("sound").length > 0
      ? Array.from(measureEl.querySelectorAll("sound"))
      : findAllByLocalName(measureEl, "sound");
  for (const sound of sounds) {
    const t = sound.getAttribute("tempo");
    if (t) {
      const v = Number.parseFloat(t);
      if (Number.isFinite(v) && v > 0 && v < 1000) return v;
    }
  }
  return;
}

function clefFromInstrumentName(partName?: string): string | null {
  if (!partName) return null;
  const n = partName.toLowerCase();
  if (n.includes("tenor sax")) return "treble";
  if (n.includes("viola")) return "alto";
  if (
    n.includes("cello") ||
    n.includes("violoncello") ||
    n.includes("bassoon") ||
    n.includes("fagot") ||
    n.includes("contrabassoon") ||
    n.includes("trombone") ||
    n.includes("tuba") ||
    n.includes("double bass") ||
    n.includes("contrabass")
  ) {
    return "bass";
  }
  if (n.includes("bass voice")) return "bass";
  if (n.trim() === "bass") return "bass";
  if (n.includes("tenor voice")) return "tenor";
  return null;
}

/** MusicXML type (whole, half, quarter, etc.) → VexFlow duration */
const TYPE_TO_DURATION: Record<string, "w" | "h" | "q" | "8" | "16" | "32"> = {
  whole: "w",
  half: "h",
  quarter: "q",
  eighth: "8",
  "16th": "16",
  "32nd": "32",
};

/** Pitch step + alter → "C4", "F#5" format */
function pitchToStr(step: string, alter: number, octave: number): string {
  const steps = ["C", "D", "E", "F", "G", "A", "B"];
  const idx = steps.indexOf(step.toUpperCase());
  if (idx < 0) return "C4";
  const alterStr = alter > 0 ? "#".repeat(alter) : alter < 0 ? "b".repeat(-alter) : "";
  return `${steps[idx]}${alterStr}${octave}`;
}

function pitchToMidi(pitch: string): number {
  const m = pitch.match(/^([A-G])(#|b)?(\d+)$/);
  if (!m) return 60;
  const stepMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const step = m[1] ?? "C";
  const accidental = m[2] ?? "";
  const octave = parseInt(m[3] ?? "4", 10);
  let midi = 12 * (octave + 1) + (stepMap[step] ?? 0);
  if (accidental === "#") midi += 1;
  if (accidental === "b") midi -= 1;
  return midi;
}

function midiToPitch(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[pitchClass]}${octave}`;
}

function applyTransposition(pitch: string, semitones: number): string {
  if (!semitones) return pitch;
  return midiToPitch(pitchToMidi(pitch) + semitones);
}

/**
 * Extract metadata from MusicXML (work-title, part count, etc.).
 */
export function extractMusicXMLMetadata(xml: string): { title: string; meta: string } {
  if (typeof window === "undefined") return { title: "Score", meta: "" };
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) return { title: "Score", meta: "" };

  const root = doc.querySelector("score-timewise, score-partwise");
  if (!root) return { title: "Score", meta: "" };

  const workTitle =
    root.querySelector("work work-title")?.textContent?.trim() ??
    root.querySelector("movement-title")?.textContent?.trim() ??
    "Score";

  const partCount =
    root.querySelectorAll("part").length || root.querySelectorAll("score-part").length || 4;
  const partList = root.querySelector("part-list");
  const partNames: string[] = [];
  if (partList) {
    partList.querySelectorAll("score-part part-name").forEach((el) => {
      const name = el.textContent?.trim();
      if (name) partNames.push(name);
    });
  }
  const voices = partNames.length > 0 ? partNames.join(", ") : `${partCount} voices`;

  return {
    title: workTitle,
    meta: `${voices} • Page 1`,
  };
}

/** Find element by local name (handles XML namespaces) */
function findByLocalName(parent: Document | Element, localName: string): Element | null {
  const el = parent.getElementsByTagName(localName)[0];
  if (el) return el;
  const all = parent.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) return all[i];
  }
  return null;
}

/** Find all elements by local name (handles XML namespaces) */
function findAllByLocalName(parent: Document | Element, localName: string): Element[] {
  const list = parent.getElementsByTagName(localName);
  if (list.length > 0) return Array.from(list);
  const all = parent.getElementsByTagName("*");
  const out: Element[] = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) out.push(all[i]);
  }
  return out;
}

/**
 * Read MusicXML key signature (circle-of-fifths fifths) from one <attributes> block.
 * Returns undefined if this block has no <key>; 0 if <key> exists but <fifths> is empty.
 */
function readKeyFifthsFromAttributes(attributesEl: Element | null): number | undefined {
  if (!attributesEl) return undefined;
  const keyEl = attributesEl.querySelector("key") ?? findByLocalName(attributesEl, "key");
  if (!keyEl) return undefined;
  const fifthsEl = keyEl.querySelector("fifths") ?? findByLocalName(keyEl, "fifths");
  const text = fifthsEl?.textContent?.trim();
  if (text === undefined || text === "") return 0;
  const n = parseInt(text, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Apply all <attributes> in measure order; update running key when any block declares <key>. */
function advanceKeyFromMeasureAttributes(
  measureEl: Element,
  running: number | undefined,
): number | undefined {
  let next = running;
  const blocks = findAllByLocalName(measureEl, "attributes");
  for (const attr of blocks) {
    const k = readKeyFifthsFromAttributes(attr);
    if (k !== undefined) next = k;
  }
  return next;
}

/**
 * Parse MusicXML string into EditableScore.
 * Supports backend's timewise SATB format (P1–P4) and score-partwise (e.g. MuseScore).
 * Handles namespaced MusicXML (e.g. MuseScore 4.x exports).
 */
export function parseMusicXML(xml: string): EditableScore | null {
  if (typeof window === "undefined") return null;
  if (!xml || !xml.trim()) return null;
  if (!looksLikeMusicXml(xml)) {
    console.warn(
      "[parseMusicXML] Input does not look like MusicXML (expected score-partwise or score-timewise root)",
    );
    return null;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    console.error("[parseMusicXML] XML parse error:", parseError.textContent);
    return null;
  }

  const scoreTimewise = doc.querySelector("score-timewise") ?? findByLocalName(doc, "score-timewise");
  if (scoreTimewise) return parseTimewise(doc, scoreTimewise);

  const scorePartwise = doc.querySelector("score-partwise") ?? findByLocalName(doc, "score-partwise");
  if (scorePartwise) return parsePartwise(doc, scorePartwise);

  console.warn("[parseMusicXML] No score-timewise or score-partwise element found in MusicXML");
  return null;
}

function parseTimewise(_doc: Document, scoreTimewise: Element): EditableScore | null {
  const partList = scoreTimewise.querySelector("part-list") ?? findByLocalName(scoreTimewise, "part-list");
  const partIds: string[] = [];
  if (partList) {
    const scoreParts =
      partList.querySelectorAll("score-part").length > 0
        ? Array.from(partList.querySelectorAll("score-part"))
        : findAllByLocalName(partList, "score-part");
    scoreParts.forEach((sp) => {
      const id = sp.getAttribute("id");
      if (id) partIds.push(id);
    });
  }
  if (partIds.length === 0) {
    partIds.push("P1", "P2", "P3", "P4");
  }

  const measures =
    scoreTimewise.querySelectorAll("measure").length > 0
      ? Array.from(scoreTimewise.querySelectorAll("measure"))
      : findAllByLocalName(scoreTimewise, "measure");
  if (measures.length === 0) return null;

  const parts: Part[] = partIds.map((partId, partIndex) => {
    const partName = getPartName(partList, partId);
    return {
      id: partId,
      name: partName,
      clef: inferClef(partId, partIndex, partIds.length, partName),
      transposeSemitones: inferTransposition(partName),
      measures: [],
    };
  });

  let divisions = 4;
  let measureKeySig: number | undefined;

  for (let mIdx = 0; mIdx < measures.length; mIdx++) {
    const measureEl = measures[mIdx];
    const attrDivs = measureEl.querySelector("attributes > divisions");
    if (attrDivs) {
      divisions = parseInt(attrDivs.textContent ?? "4", 10);
    }

    measureKeySig = advanceKeyFromMeasureAttributes(measureEl, measureKeySig);

    for (let pIdx = 0; pIdx < partIds.length; pIdx++) {
      const partId = partIds[pIdx];
      let partEl = measureEl.querySelector(`part[id="${partId}"]`);
      if (!partEl) {
        const partCandidates = findAllByLocalName(measureEl, "part");
        partEl = partCandidates.find((p) => p.getAttribute("id") === partId) ?? null;
      }
      const notes = extractNotesFromElement(
        partEl,
        parts[pIdx]?.transposeSemitones ?? 0,
      );
      const beatsEl = measureEl.querySelector("attributes > time > beats") ?? findByLocalName(measureEl, "beats");
      const beatTypeEl = measureEl.querySelector("attributes > time > beat-type") ?? findByLocalName(measureEl, "beat-type");
      const timeSignature =
        beatsEl?.textContent?.trim() && beatTypeEl?.textContent?.trim()
          ? `${beatsEl.textContent.trim()}/${beatTypeEl.textContent.trim()}`
          : undefined;
      const measure: Measure = { id: generateId("m"), notes, timeSignature };
      if (measureKeySig !== undefined) measure.keySignature = measureKeySig;
      parts[pIdx].measures.push(measure);
    }
  }

  const bpm = extractSoundTempoBpm(measures[0] ?? null);
  return bpm !== undefined ? { parts, divisions, bpm } : { parts, divisions };
}

/**
 * Parse score-partwise (parts → measures → notes). Used by MuseScore and many exports.
 */
function parsePartwise(_doc: Document, scorePartwise: Element): EditableScore | null {
  const partList = scorePartwise.querySelector("part-list") ?? findByLocalName(scorePartwise, "part-list");
  const partEls =
    scorePartwise.querySelectorAll("part").length > 0
      ? Array.from(scorePartwise.querySelectorAll("part"))
      : findAllByLocalName(scorePartwise, "part");
  if (partEls.length === 0) return null;

  const parts: Part[] = [];
  let maxMeasures = 0;

  for (let pIdx = 0; pIdx < partEls.length; pIdx++) {
    const partEl = partEls[pIdx];
    const partId = partEl.getAttribute("id") ?? `P${pIdx + 1}`;
    const measures: Measure[] = [];
    const partName = getPartName(partList, partId);
    const measureEls =
      partEl.querySelectorAll("measure").length > 0
        ? Array.from(partEl.querySelectorAll("measure"))
        : findAllByLocalName(partEl, "measure");

    let partKeySig: number | undefined;
    for (const measureEl of measureEls) {
      partKeySig = advanceKeyFromMeasureAttributes(measureEl, partKeySig);
      const notes = extractNotesFromElement(
        measureEl,
        inferTransposition(partName),
      );
      const beatsEl = measureEl.querySelector("attributes > time > beats") ?? findByLocalName(measureEl, "beats");
      const beatTypeEl = measureEl.querySelector("attributes > time > beat-type") ?? findByLocalName(measureEl, "beat-type");
      const timeSignature =
        beatsEl?.textContent?.trim() && beatTypeEl?.textContent?.trim()
          ? `${beatsEl.textContent.trim()}/${beatTypeEl.textContent.trim()}`
          : undefined;
      const measure: Measure = { id: generateId("m"), notes, timeSignature };
      if (partKeySig !== undefined) measure.keySignature = partKeySig;
      measures.push(measure);
    }
    maxMeasures = Math.max(maxMeasures, measures.length);
    parts.push({
      id: partId,
      name: partName,
      clef: inferClef(partId, pIdx, partEls.length, partName),
      transposeSemitones: inferTransposition(partName),
      measures,
    });
  }

  if (maxMeasures === 0) return null;

  const divisions = 4;
  const firstMeasureEl =
    partEls[0]?.querySelector("measure") ?? findAllByLocalName(partEls[0]!, "measure")[0];
  const bpm = extractSoundTempoBpm(firstMeasureEl ?? null);
  return bpm !== undefined ? { parts, divisions, bpm } : { parts, divisions };
}

function inferClef(
  partId: string,
  partIndex: number,
  totalParts: number,
  partName?: string,
): string {
  const fromName = clefFromInstrumentName(partName);
  if (fromName) return fromName;
  if (PART_CLEFS[partId]) return PART_CLEFS[partId];
  const normalized = (partName ?? "").toLowerCase();
  if (normalized.includes("tenor")) return "tenor";
  if (totalParts >= 4 && partIndex === totalParts - 1) return "bass";
  return "treble";
}

function inferTransposition(partName: string): number {
  const normalized = partName.toLowerCase();
  if (
    normalized.includes("clarinet in b") ||
    normalized.includes("trumpet in b") ||
    normalized.includes("soprano sax") ||
    normalized.includes("tenor sax")
  ) {
    return -2;
  }
  if (normalized.includes("horn in f")) return -7;
  if (normalized.includes("alto sax")) return -9;
  return 0;
}

function extractNotesFromElement(
  container: Element | null,
  transposeSemitones = 0,
): Note[] {
  if (!container) return [];
  const notes: Note[] = [];
  const noteEls =
    container.querySelectorAll("note").length > 0
      ? Array.from(container.querySelectorAll("note"))
      : findAllByLocalName(container, "note");
  noteEls.forEach((noteEl) => {
    const rest = noteEl.querySelector("rest") ?? findByLocalName(noteEl, "rest");
    const typeEl = noteEl.querySelector("type") ?? findByLocalName(noteEl, "type");
    const typeStr = typeEl?.textContent?.trim() ?? "quarter";
    const duration = TYPE_TO_DURATION[typeStr] ?? "q";

    const dotEl = noteEl.querySelector("dot") ?? findByLocalName(noteEl, "dot");
    const dots = dotEl ? 1 : 0;

    if (rest) {
      notes.push({
        id: generateId("n"),
        pitch: "B4",
        duration,
        isRest: true,
        ...(dots > 0 && { dots }),
      });
      return;
    }

    const pitch = noteEl.querySelector("pitch") ?? findByLocalName(noteEl, "pitch");
    if (!pitch) return;

    const stepEl = pitch.querySelector("step") ?? findByLocalName(pitch, "step");
    const step = stepEl?.textContent?.trim() ?? "C";
    const alterEl = pitch.querySelector("alter") ?? findByLocalName(pitch, "alter");
    const alter = alterEl ? parseInt(alterEl.textContent ?? "0", 10) : 0;
    const octaveEl = pitch.querySelector("octave") ?? findByLocalName(pitch, "octave");
    const octave = octaveEl ? parseInt(octaveEl.textContent ?? "4", 10) : 4;

    notes.push({
      id: generateId("n"),
      pitch: applyTransposition(
        pitchToStr(step, alter, octave),
        transposeSemitones,
      ),
      duration,
      ...(dots > 0 && { dots }),
    });
  });
  return notes;
}

function getPartName(partList: Element | null, partId: string): string {
  if (!partList) return partId;
  const sp = partList.querySelector(`score-part[id="${partId}"]`);
  const nameEl = sp?.querySelector("part-name");
  return nameEl?.textContent ?? partId;
}
