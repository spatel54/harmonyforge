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
import { pitchFromStaffGeometry } from "./staffPreviewPitch";

/**
 * Map a RiffScore note id (`rs-…` from `editableScoreToRsScore`) back to HarmonyForge `Note.id`.
 */
export function resolveRsNoteIdToHfNoteId(
  rsNoteId: string,
  rsToHf: IdMap,
  score: EditableScore,
): string | null {
  const mapped = rsToHf.get(rsNoteId);
  if (mapped && findNoteSelection(score, mapped)) return mapped;
  if (rsNoteId.startsWith("rs-")) {
    const raw = rsNoteId.slice(3);
    if (findNoteSelection(score, raw)) return raw;
  }
  return null;
}

/**
 * Extract note positions from the RiffScore rendered SVG.
 *
 * Strategy priority:
 * 1. data-note-id attributes (if RiffScore adds them — future-proof)
 * 2. Per `g.note-group-container`: `text.NoteHead` bbox + `rect[data-testid^="note-"]` → HF id (accurate; DOM order can differ from score order for chords/beams)
 * 3. Staff-grouped NoteHead walk (legacy order-based fallback / fills gaps)
 * 4. Flat NoteHead walk (fallback if staff groups aren't found)
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

      const hfNoteId = resolveRsNoteIdToHfNoteId(rsNoteId, rsToHf, score);
      if (!hfNoteId) return;

      const sel = findNoteSelection(score, hfNoteId);
      if (!sel) return;

      const rect = el.getBoundingClientRect();
      positions.push({
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        w: Math.max(rect.width, 12),
        h: Math.max(rect.height, 12),
        selection: sel,
      });
    });

    // If the DOM has data-note-id nodes but none map into our score (stale map /
    // partial render), fall through to staff / flat strategies instead of [].
    if (positions.length > 0) {
      return positions;
    }
  }

  // ── Strategy 2+: staff groups ────────────────────────────────────────────
  const staffGroups = svg.querySelectorAll("g.staff");

  if (staffGroups.length > 0 && staffGroups.length >= score.parts.length) {
    const byTestId = extractPositionsFromNoteGroupsPerStaff(
      staffGroups,
      score,
      rsToHf,
      containerRect,
    );
    const legacyOrdered = extractLegacyStaffOrderedPositions(staffGroups, score, containerRect);

    if (byTestId.length > 0) {
      const byNoteId = new Map<string, NotePosition>();
      for (const p of byTestId) {
        byNoteId.set(p.selection.noteId, p);
      }
      for (const p of legacyOrdered) {
        if (!byNoteId.has(p.selection.noteId)) {
          byNoteId.set(p.selection.noteId, p);
        }
      }
      return [...byNoteId.values()];
    }

    if (legacyOrdered.length > 0) {
      return legacyOrdered;
    }
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
        if (note.isRest || !note.pitch?.trim()) continue;

        const el = noteElements[noteIdx];
        noteIdx++;

        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;

        positions.push({
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
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

/**
 * RiffScore puts `data-testid="note-{rsNoteId}"` on each note hit rect; pair with the sibling NoteHead glyph.
 */
function extractPositionsFromNoteGroupsPerStaff(
  staffGroups: NodeListOf<Element>,
  score: EditableScore,
  rsToHf: IdMap,
  containerRect: DOMRectReadOnly,
): NotePosition[] {
  const out: NotePosition[] = [];

  for (let si = 0; si < score.parts.length; si++) {
    const part = score.parts[si];
    const staffGroup = staffGroups[si];
    if (!part || !staffGroup) continue;

    const groups = staffGroup.querySelectorAll("g.note-group-container");
    groups.forEach((group) => {
      if (group.closest(".chord-group--ghost")) return;

      const head = group.querySelector("text.NoteHead");
      if (!head || isPreviewNotehead(head)) return;

      const hit = group.querySelector<SVGRectElement>('rect[data-testid^="note-"]');
      let hfNoteId: string | null = null;
      if (hit) {
        const tid = hit.getAttribute("data-testid");
        if (tid?.startsWith("note-")) {
          const rsId = tid.slice("note-".length);
          hfNoteId = resolveRsNoteIdToHfNoteId(rsId, rsToHf, score);
        }
      }

      if (!hfNoteId) return;

      const sel = findNoteSelection(score, hfNoteId);
      if (!sel) return;

      const rect = head.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      out.push({
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        w: Math.max(rect.width, 12),
        h: Math.max(rect.height, 12),
        selection: sel,
      });
    });
  }

  return out;
}

/** Legacy: assume NoteHead DOM order matches `measure.notes` order per staff (often wrong for chords; used as fallback). */
function extractLegacyStaffOrderedPositions(
  staffGroups: NodeListOf<Element>,
  score: EditableScore,
  containerRect: DOMRectReadOnly,
): NotePosition[] {
  const positions: NotePosition[] = [];

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
        // RiffScore does not render SMuFL noteheads for rests; skipping keeps nhIdx aligned with NoteHead list.
        if (note.isRest || !note.pitch?.trim()) continue;

        const el = noteheads[nhIdx];
        nhIdx++;

        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;

        positions.push({
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
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
      top: rect.top - containerRect.top,
      height: rect.height,
    });
  }

  return out;
}

/**
 * Elements inside RiffScore that can scroll (vertical score panes, horizontal canvas).
 * Overlays use `getBoundingClientRect` against the HF wrapper; listeners on these
 * nodes keep positions in sync when ResizeObserver does not run (e.g. wheel / trackpad).
 */
export function getRiffScoreScrollRoots(container: HTMLElement): HTMLElement[] {
  const roots: HTMLElement[] = [];
  const content = container.querySelector<HTMLElement>(".riff-ScoreEditor__content");
  if (content) roots.push(content);
  const canvas = container.querySelector<HTMLElement>(".riff-ScoreCanvas");
  if (canvas && canvas !== content) roots.push(canvas);
  return roots;
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

/**
 * True for RiffScore’s input ghost / preview noteheads only.
 * Real notes sit under `<g class="note-group-container">`; ghosts omit that wrapper (see riffscore `Note14`).
 */
export function isPreviewNotehead(el: Element): boolean {
  return !el.closest("g.note-group-container");
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

/** Layout hint for floating pitch label next to the note-input preview ghost. */
export interface NoteInputPreviewLayout {
  pitch: string;
  left: number;
  top: number;
}

/**
 * Finds RiffScore’s pointer-events-none preview notehead and maps its vertical
 * position to scientific pitch using staff line geometry (container coordinates).
 */
export function findNoteInputPreviewLayout(
  container: HTMLElement,
  score: EditableScore,
): NoteInputPreviewLayout | null {
  const svg =
    container.querySelector<SVGSVGElement>("svg.riff-ScoreCanvas__svg") ??
    container.querySelector<SVGSVGElement>(".riff-ScoreCanvas svg") ??
    container.querySelector<SVGSVGElement>("svg");

  if (!svg) return null;

  const containerRect = container.getBoundingClientRect();

  const staffGroups = svg.querySelectorAll("g.staff");
  if (staffGroups.length === 0) return null;

  for (let si = 0; si < staffGroups.length; si++) {
    const staffGroup = staffGroups[si];
    const part = score.parts[si];
    if (!part) continue;

    let previewEl: SVGGraphicsElement | null = null;
    staffGroup.querySelectorAll("text.NoteHead").forEach((el) => {
      if (isPreviewNotehead(el) && el instanceof SVGGraphicsElement) {
        previewEl = el;
      }
    });
    if (!previewEl) {
      staffGroup.querySelectorAll("text").forEach((el) => {
        if (
          isSmuflNotehead(el) &&
          isPreviewNotehead(el) &&
          el instanceof SVGGraphicsElement
        ) {
          previewEl = el;
        }
      });
    }
    if (!previewEl) continue;

    const horizLines = [...staffGroup.querySelectorAll("line")].filter((l) => {
      const y1 = parseFloat(l.getAttribute("y1") || "NaN");
      const y2 = parseFloat(l.getAttribute("y2") || "NaN");
      return Number.isFinite(y1) && Number.isFinite(y2) && Math.abs(y1 - y2) < 1.5;
    });

    const lineCenters = horizLines
      .map((l) => {
        const r = l.getBoundingClientRect();
        return r.top + r.height / 2 - containerRect.top;
      })
      .sort((a, b) => a - b);

    const lineYsFive: number[] = [];
    for (const y of lineCenters) {
      if (
        lineYsFive.length === 0 ||
        Math.abs(y - lineYsFive[lineYsFive.length - 1]) > 1.5
      ) {
        lineYsFive.push(y);
      }
    }
    if (lineYsFive.length < 5) continue;

    const rect = (previewEl as SVGGraphicsElement).getBoundingClientRect();
    const centerY = rect.top + rect.height / 2 - containerRect.top;
    const pitch = pitchFromStaffGeometry(
      part.clef,
      lineYsFive.slice(0, 5),
      centerY,
    );
    if (!pitch) continue;

    const left = rect.right - containerRect.left + 4;
    const top = rect.top - containerRect.top - 2;

    return { pitch, left, top };
  }

  return null;
}
