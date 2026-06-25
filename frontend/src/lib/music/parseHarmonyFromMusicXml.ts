/**
 * Extract global chord symbols from MusicXML <harmony> elements on the first part.
 */

import type { ChordSymbolEntry, EditableScore, Note } from "./scoreTypes";
import { generateId } from "./scoreTypes";
import { finalizeChordTrack } from "./chordSymbolDetect";
import { beatToRiffQuant, harmonyElementToSymbol } from "./chordSymbolFormat";
import { measureLengthBeats } from "./scoreUtils";

const TYPE_TO_BEATS: Record<string, number> = {
  w: 4,
  h: 2,
  q: 1,
  "8": 0.5,
  "16": 0.25,
  "32": 0.125,
};

function findAllByLocalName(parent: Element, localName: string): Element[] {
  const list = parent.getElementsByTagName(localName);
  if (list.length > 0) return Array.from(list);
  const all = parent.getElementsByTagName("*");
  const out: Element[] = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i]!.localName === localName) out.push(all[i]!);
  }
  return out;
}

function noteDurationBeatsFromXml(noteEl: Element): number {
  const rest = noteEl.querySelector("rest") ?? findAllByLocalName(noteEl, "rest")[0];
  const isChordTone = Boolean(noteEl.querySelector("chord") ?? findAllByLocalName(noteEl, "chord")[0]);
  if (rest || isChordTone) return 0;
  const typeEl = noteEl.querySelector("type") ?? findAllByLocalName(noteEl, "type")[0];
  const typeStr = typeEl?.textContent?.trim() ?? "quarter";
  const dotsEl = noteEl.querySelector("dot") ?? findAllByLocalName(noteEl, "dot")[0];
  const durKey =
    typeStr === "16th"
      ? "16"
      : typeStr === "32nd"
        ? "32"
        : typeStr === "eighth"
          ? "8"
          : typeStr === "half"
            ? "h"
            : typeStr === "whole"
              ? "w"
              : "q";
  const pseudo: Note = {
    id: "",
    pitch: "C4",
    duration: durKey as Note["duration"],
    dots: dotsEl ? 1 : 0,
  };
  return TYPE_TO_BEATS[pseudo.duration] ?? 1 * (pseudo.dots ? 1.5 : 1);
}

/** Walk measure children in document order; track beat offset for harmony placement. */
function extractHarmoniesFromMeasure(
  measureEl: Element,
  measureStartBeat: number,
): ChordSymbolEntry[] {
  const chords: ChordSymbolEntry[] = [];
  let beatInMeasure = 0;

  const visit = (el: Element) => {
    const local = el.localName?.toLowerCase() ?? el.tagName.toLowerCase();
    if (local === "harmony") {
      chords.push({
        id: generateId("c"),
        quant: beatToRiffQuant(measureStartBeat + beatInMeasure),
        symbol: harmonyElementToSymbol(el),
      });
      return;
    }
    if (local === "note") {
      beatInMeasure += noteDurationBeatsFromXml(el);
      return;
    }
    for (const child of Array.from(el.children)) visit(child);
  };

  for (const child of Array.from(measureEl.children)) visit(child);
  return chords;
}

/**
 * Parse chord symbols from first-part measure elements and attach to EditableScore.
 */
export function attachChordsFromFirstPartXml(
  score: EditableScore,
  firstPartMeasureElements: Element[],
): EditableScore {
  const chords: ChordSymbolEntry[] = [];
  let globalBeat = 0;

  for (let i = 0; i < firstPartMeasureElements.length; i++) {
    const measureEl = firstPartMeasureElements[i]!;
    chords.push(...extractHarmoniesFromMeasure(measureEl, globalBeat));
    globalBeat += measureLengthBeats(score, i);
  }

  if (chords.length === 0) return score;
  return { ...score, chords: finalizeChordTrack(score, chords) };
}
