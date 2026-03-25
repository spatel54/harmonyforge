/**
 * Extract note bounding boxes from a rendered RiffScore SVG container.
 * Maps visual note elements back to HarmonyForge note IDs.
 */

import type { NotePosition, EditableScore } from "./scoreTypes";
import type { IdMap } from "./riffscoreAdapter";

/**
 * Extract note positions from the RiffScore rendered SVG.
 *
 * RiffScore renders noteheads as SVG text elements using the Bravura (SMuFL) font,
 * or as ellipse/circle elements depending on version. We search for both patterns
 * and correlate by staff/measure/event ordering.
 */
export function extractNotePositions(
  container: HTMLElement,
  score: EditableScore,
  rsToHf: IdMap,
): NotePosition[] {
  const positions: NotePosition[] = [];
  const svg = container.querySelector("svg");
  if (!svg) return positions;

  const containerRect = container.getBoundingClientRect();

  // Strategy 1: Look for elements with data-note-id attribute (if RiffScore adds them)
  const dataAttrNotes = svg.querySelectorAll("[data-note-id]");
  if (dataAttrNotes.length > 0) {
    dataAttrNotes.forEach((el) => {
      const rsNoteId = el.getAttribute("data-note-id");
      if (!rsNoteId) return;

      const hfNoteId = rsToHf.get(rsNoteId);
      if (!hfNoteId) return;

      const sel = findNoteSelection(score, hfNoteId);
      if (!sel) return;

      const rect = el.getBoundingClientRect();
      positions.push({
        x: rect.left - containerRect.left + (container.scrollLeft || 0),
        y: rect.top - containerRect.top + (container.scrollTop || 0),
        w: Math.max(rect.width, 12),
        h: Math.max(rect.height, 12),
        selection: sel,
      });
    });

    return positions;
  }

  // Strategy 2: Walk by position — collect notehead elements (ellipses, circles, or
  // text glyphs that represent noteheads) and correlate by staff/measure/event ordering
  const noteElements = collectNoteheadElements(svg);
  let noteIdx = 0;

  for (let si = 0; si < score.parts.length; si++) {
    const part = score.parts[si];
    for (let mi = 0; mi < part.measures.length; mi++) {
      const measure = part.measures[mi];
      for (let ni = 0; ni < measure.notes.length; ni++) {
        const note = measure.notes[ni];
        const el = noteElements[noteIdx];
        noteIdx++;

        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;

        positions.push({
          x: rect.left - containerRect.left + (container.scrollLeft || 0),
          y: rect.top - containerRect.top + (container.scrollTop || 0),
          w: Math.max(rect.width, 12),
          h: Math.max(rect.height, 12),
          selection: {
            partId: part.id,
            measureIndex: mi,
            noteIndex: ni,
            noteId: note.id,
          },
        });
      }
    }
  }

  return positions;
}

/** Find note selection data by noteId within an EditableScore. */
function findNoteSelection(
  score: EditableScore,
  noteId: string,
): NotePosition["selection"] | null {
  for (const part of score.parts) {
    for (let mi = 0; mi < part.measures.length; mi++) {
      for (let ni = 0; ni < part.measures[mi].notes.length; ni++) {
        if (part.measures[mi].notes[ni].id === noteId) {
          return { partId: part.id, measureIndex: mi, noteIndex: ni, noteId };
        }
      }
    }
  }
  return null;
}

/**
 * Collect SVG elements that represent noteheads in render order.
 * RiffScore uses Bravura font glyphs — noteheads are typically rendered as
 * <text> elements with SMuFL codepoints, or as <ellipse>/<circle> elements.
 */
function collectNoteheadElements(svg: SVGElement): Element[] {
  const elements: Element[] = [];

  // Try ellipses first (common notehead shape)
  const ellipses = svg.querySelectorAll("ellipse");
  if (ellipses.length > 0) {
    ellipses.forEach((el) => elements.push(el));
    return elements;
  }

  // Try circles
  const circles = svg.querySelectorAll("circle");
  if (circles.length > 0) {
    circles.forEach((el) => elements.push(el));
    return elements;
  }

  // Try text elements with Bravura/SMuFL noteheads
  // SMuFL notehead codepoints: U+E0A0-U+E0AF (noteheads range)
  const texts = svg.querySelectorAll("text");
  texts.forEach((el) => {
    const content = el.textContent ?? "";
    // Check for SMuFL notehead codepoints or common glyph patterns
    for (const char of content) {
      const code = char.charCodeAt(0);
      // SMuFL private use area noteheads: U+E0A0-U+E0AF
      if (code >= 0xE0A0 && code <= 0xE0AF) {
        elements.push(el);
        return;
      }
    }
  });

  // Fallback: look for elements with notehead-related classes
  if (elements.length === 0) {
    const classMatches = svg.querySelectorAll(
      '[class*="note"], [class*="Note"], [class*="head"], [class*="Head"]',
    );
    classMatches.forEach((el) => elements.push(el));
  }

  return elements;
}
