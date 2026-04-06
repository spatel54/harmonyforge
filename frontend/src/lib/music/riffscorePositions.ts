/**
 * Extract note bounding boxes from a rendered RiffScore SVG container.
 * Maps visual note elements back to HarmonyForge note IDs.
 *
 * RiffScore renders its score inside an SVG with class "riff-ScoreCanvas__svg".
 * Noteheads are <text className="NoteHead"> elements using Bravura (SMuFL) glyphs.
 * Staves are grouped in <g className="staff"> elements rendered top-to-bottom.
 */

import type { NotePosition, EditableScore } from "./scoreTypes";
import type { IdMap } from "./riffscoreAdapter";

/**
 * Extract note positions from the RiffScore rendered SVG.
 *
 * Strategy priority:
 * 1. data-note-id attributes (if RiffScore adds them — future-proof)
 * 2. Staff-grouped NoteHead class matching (RiffScore-specific, most reliable)
 * 3. Flat NoteHead/SMuFL walk (fallback if staff groups aren't found)
 */
export function extractNotePositions(
  container: HTMLElement,
  score: EditableScore,
  rsToHf: IdMap,
): NotePosition[] {
  const positions: NotePosition[] = [];

  // Target the RiffScore score SVG specifically — toolbar icons also use small
  // SVGs, so querySelector("svg") alone would grab the wrong element.
  const svg =
    container.querySelector<SVGSVGElement>("svg.riff-ScoreCanvas__svg") ??
    container.querySelector<SVGSVGElement>(".riff-ScoreCanvas svg") ??
    container.querySelector<SVGSVGElement>("svg");

  if (!svg) return positions;

  const containerRect = container.getBoundingClientRect();

  // ── Strategy 1: data-note-id attributes ──────────────────────────────────
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

  // ── Strategy 2: Staff-grouped NoteHead walk ──────────────────────────────
  // RiffScore wraps each staff in <g className="staff">.  Within each staff,
  // NoteHead text elements appear in document order matching measure → event.
  const staffGroups = svg.querySelectorAll("g.staff");

  if (staffGroups.length > 0 && staffGroups.length >= score.parts.length) {
    for (let si = 0; si < score.parts.length; si++) {
      const part = score.parts[si];
      const staffGroup = staffGroups[si];
      if (!staffGroup) continue;

      const noteheads = collectStaffNoteheads(staffGroup);
      let nhIdx = 0;

      for (let mi = 0; mi < part.measures.length; mi++) {
        const measure = part.measures[mi];
        for (let ni = 0; ni < measure.notes.length; ni++) {
          const note = measure.notes[ni];
          const el = noteheads[nhIdx];
          nhIdx++;

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

  // ── Strategy 3: Flat NoteHead walk (no staff grouping) ───────────────────
  const noteElements = collectAllNoteheads(svg);
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

/** Layout for aligning part name labels with each RiffScore staff (top/height in container coordinates). */
export interface StaffLabelLayout {
  top: number;
  height: number;
}

/**
 * Measure each `g.staff` group’s box relative to the editor container, in document order.
 * Returns up to `partCount` entries; may be shorter if DOM is not ready or staff groups are missing.
 */
export function extractStaffLabelLayout(
  container: HTMLElement,
  partCount: number,
): StaffLabelLayout[] {
  if (partCount <= 0) return [];

  const svg =
    container.querySelector<SVGSVGElement>("svg.riff-ScoreCanvas__svg") ??
    container.querySelector<SVGSVGElement>(".riff-ScoreCanvas svg") ??
    container.querySelector<SVGSVGElement>("svg");

  if (!svg) return [];

  const containerRect = container.getBoundingClientRect();
  const staffGroups = svg.querySelectorAll("g.staff");
  const n = Math.min(partCount, staffGroups.length);
  const out: StaffLabelLayout[] = [];

  for (let i = 0; i < n; i++) {
    const g = staffGroups[i];
    if (!g) continue;
    const rect = g.getBoundingClientRect();
    if (rect.height < 4) continue;
    out.push({
      top: rect.top - containerRect.top + (container.scrollTop || 0),
      height: rect.height,
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Check if an element is a preview/phantom notehead that should be excluded. */
function isPreviewNotehead(el: Element): boolean {
  // RiffScore wraps preview noteheads in a <g style="pointerEvents: none">
  const parent = el.parentElement;
  if (parent && (parent as HTMLElement).style?.pointerEvents === "none") {
    return true;
  }
  // Also exclude if inside a preview-related group
  if (el.closest('[id*="preview"]')) return true;
  return false;
}

/** Check if a text element contains a SMuFL notehead glyph. */
function isSmuflNotehead(el: Element): boolean {
  const content = el.textContent ?? "";
  for (const char of content) {
    const code = char.charCodeAt(0);
    // SMuFL private use area noteheads: U+E0A0-U+E0AF
    if (code >= 0xE0A0 && code <= 0xE0AF) return true;
  }
  return false;
}

/**
 * Collect notehead elements within a single staff group.
 * Uses the NoteHead class (RiffScore-specific), then falls back to SMuFL detection.
 * Filters out preview/ghost noteheads used for input cursor.
 */
function collectStaffNoteheads(staffGroup: Element): Element[] {
  const elements: Element[] = [];

  // Primary: text elements with class "NoteHead" (RiffScore renders noteheads this way)
  const classNoteheads = staffGroup.querySelectorAll("text.NoteHead");
  if (classNoteheads.length > 0) {
    classNoteheads.forEach((el) => {
      if (!isPreviewNotehead(el)) elements.push(el);
    });
    return elements;
  }

  // Fallback: text elements containing SMuFL notehead codepoints
  const texts = staffGroup.querySelectorAll("text");
  texts.forEach((el) => {
    if (isSmuflNotehead(el) && !isPreviewNotehead(el)) {
      elements.push(el);
    }
  });

  return elements;
}

/**
 * Collect ALL notehead elements from the entire SVG (flat, no staff grouping).
 * Used as fallback when g.staff groups aren't found.
 */
function collectAllNoteheads(svg: SVGElement): Element[] {
  const elements: Element[] = [];

  // Primary: NoteHead class
  const classNoteheads = svg.querySelectorAll("text.NoteHead");
  if (classNoteheads.length > 0) {
    classNoteheads.forEach((el) => {
      if (!isPreviewNotehead(el)) elements.push(el);
    });
    return elements;
  }

  // Fallback: SMuFL notehead detection
  const texts = svg.querySelectorAll("text");
  texts.forEach((el) => {
    if (isSmuflNotehead(el) && !isPreviewNotehead(el)) {
      elements.push(el);
    }
  });

  // Last resort: class name pattern matching
  if (elements.length === 0) {
    const classMatches = svg.querySelectorAll(
      '[class*="note"], [class*="Note"], [class*="head"], [class*="Head"]',
    );
    classMatches.forEach((el) => {
      if (!isPreviewNotehead(el)) elements.push(el);
    });
  }

  return elements;
}
