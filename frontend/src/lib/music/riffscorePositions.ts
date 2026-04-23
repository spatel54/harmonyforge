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
import { getNoteById } from "./scoreUtils";
import type { NoteSelection } from "@/store/useScoreStore";
import { pitchFromStaffGeometry, staffAnchorYForPitch } from "./staffPreviewPitch";

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
  // `editableScoreToRsScore` uses event.id `rse-${hfNote.id}` on Rest groups in the SVG.
  if (rsNoteId.startsWith("rse-")) {
    const raw = rsNoteId.slice(4);
    if (findNoteSelection(score, raw)) return raw;
  }
  return null;
}

/** Map RiffScore `selection.selectedNotes` to HarmonyForge tool-store selections (deduped by note id). */
export function mapRiffSelectedNotesToHFSelections(
  score: EditableScore,
  selectedNotes: ReadonlyArray<{
    staffIndex: number;
    measureIndex: number;
    eventId: string;
    noteId: string | null;
  }>,
  rsToHf: IdMap,
): NoteSelection[] {
  const out: NoteSelection[] = [];
  const seen = new Set<string>();

  for (const sn of selectedNotes) {
    const raw = sn.noteId || sn.eventId;
    if (!raw) continue;
    const hfId = resolveRsNoteIdToHfNoteId(raw, rsToHf, score) ?? raw;

    const found = getNoteById(score, hfId);
    if (found) {
      if (seen.has(hfId)) continue;
      seen.add(hfId);
      out.push({
        partId: found.part.id,
        measureIndex: found.measureIdx,
        noteIndex: found.noteIdx,
        noteId: hfId,
      });
      continue;
    }

    const part = score.parts[sn.staffIndex];
    if (!part) continue;
    const measure = part.measures[sn.measureIndex];
    if (!measure) continue;
    const idx = measure.notes.findIndex((n) => n.id === hfId);
    if (idx < 0) continue;
    if (seen.has(hfId)) continue;
    seen.add(hfId);
    out.push({
      partId: part.id,
      measureIndex: sn.measureIndex,
      noteIndex: idx,
      noteId: hfId,
    });
  }

  return out;
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
      // RiffScore often tags pitched elements with data-note-id but not rests.
      // Early-returning here used to drop rest hit-rects from note-group SVG,
      // which broke sandbox "hover rest → ghost" (pickRestHitAt had no rest boxes).
      const staffGroupsEarly = svg.querySelectorAll("g.staff");
      if (
        staffGroupsEarly.length > 0 &&
        staffGroupsEarly.length >= score.parts.length
      ) {
        const fromGroups = extractPositionsFromNoteGroupsPerStaff(
          staffGroupsEarly,
          score,
          rsToHf,
          containerRect,
        );
        if (fromGroups.length > 0) {
          const byNoteId = new Map<string, NotePosition>();
          for (const p of positions) {
            byNoteId.set(p.selection.noteId, p);
          }
          for (const p of fromGroups) {
            const part = score.parts.find((pr) => pr.id === p.selection.partId);
            const meas = part?.measures[p.selection.measureIndex];
            const n = meas?.notes[p.selection.noteIndex];
            if (n?.isRest && !byNoteId.has(p.selection.noteId)) {
              byNoteId.set(p.selection.noteId, p);
            }
          }
          return [...byNoteId.values()];
        }
      }
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

      const measure = part.measures[sel.measureIndex];
      const note = measure?.notes[sel.noteIndex];
      if (!note) return;

      const head = group.querySelector("text.NoteHead");
      const headIsReal = head && !isPreviewNotehead(head);

      if (headIsReal) {
        const rect = head.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        out.push({
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          w: Math.max(rect.width, 12),
          h: Math.max(rect.height, 12),
          selection: sel,
        });
        return;
      }

      // Rests (older layout): `rect[data-testid^="note-"]` inside `note-group-container`.
      if (note.isRest && hit) {
        const rect = hit.getBoundingClientRect();
        const w = Math.max(rect.width, 14);
        const h = Math.max(rect.height, 14);
        out.push({
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top,
          w,
          h,
          selection: sel,
        });
      }
    });

    // RiffScore 1.0.x: rests use `<g class="Rest rest-group" data-testid="rest-{eventId}">`
    // with an invisible hit `<rect>` child — not `g.note-group-container` / `note-*` test ids.
    const restGroups = staffGroup.querySelectorAll("g.rest-group");
    restGroups.forEach((group) => {
      if (group.closest(".chord-group--ghost")) return;

      const tid = group.getAttribute("data-testid");
      if (!tid?.startsWith("rest-")) return;

      const rsId = tid.slice("rest-".length);
      const hfNoteId = resolveRsNoteIdToHfNoteId(rsId, rsToHf, score);
      if (!hfNoteId) return;

      const sel = findNoteSelection(score, hfNoteId);
      if (!sel) return;

      const measure = part.measures[sel.measureIndex];
      const note = measure?.notes[sel.noteIndex];
      if (!note?.isRest) return;

      const hitRect = group.querySelector("rect");
      const box = (hitRect ?? group).getBoundingClientRect();
      if (box.width === 0 && box.height === 0) return;

      out.push({
        x: box.left - containerRect.left,
        y: box.top - containerRect.top,
        w: Math.max(box.width, 14),
        h: Math.max(box.height, 14),
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

/**
 * When `extractNotePositions` snapshots lag or omit a rest, resolve hover via `elementsFromPoint`.
 * RiffScore uses `<g class="rest-group" data-testid="rest-{eventId}">` (see dist bundle).
 */
export function pickRestDomHitAt(
  container: HTMLElement,
  score: EditableScore,
  clientX: number,
  clientY: number,
  rsToHf: IdMap,
): { sel: NotePosition["selection"]; pos: NotePosition; staffIndex: number } | null {
  const svg =
    container.querySelector<SVGSVGElement>("svg.riff-ScoreCanvas__svg") ??
    container.querySelector<SVGSVGElement>(".riff-ScoreCanvas svg") ??
    container.querySelector<SVGSVGElement>("svg");
  if (!svg || typeof document === "undefined" || !document.elementsFromPoint) return null;

  const containerRect = container.getBoundingClientRect();
  let stack: Element[];
  try {
    stack = document.elementsFromPoint(clientX, clientY) as Element[];
  } catch {
    return null;
  }

  for (const el of stack) {
    if (!svg.contains(el)) continue;
    let node: Element | null = el;
    while (node && node !== svg) {
      const tid = node.getAttribute?.("data-testid");
      if (tid?.startsWith("rest-")) {
        const rsId = tid.slice("rest-".length);
        const hfNoteId = resolveRsNoteIdToHfNoteId(rsId, rsToHf, score);
        if (!hfNoteId) break;
        const sel = findNoteSelection(score, hfNoteId);
        if (!sel) break;
        const part = score.parts.find((p) => p.id === sel.partId);
        const note = part?.measures[sel.measureIndex]?.notes[sel.noteIndex];
        if (!note?.isRest) break;
        const staffIndex = score.parts.findIndex((p) => p.id === sel.partId);
        if (staffIndex < 0) break;
        const g = node.closest("g.rest-group") ?? node;
        const hitRect = g.querySelector("rect");
        const box = (hitRect ?? g).getBoundingClientRect();
        if (box.width === 0 && box.height === 0) break;
        const pos: NotePosition = {
          x: box.left - containerRect.left,
          y: box.top - containerRect.top,
          w: Math.max(box.width, 14),
          h: Math.max(box.height, 14),
          selection: sel,
        };
        return { sel, pos, staffIndex };
      }
      node = node.parentElement;
    }
  }
  return null;
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

/** Five staff line center Ys in container coordinates (top → bottom), or null. */
export function staffLineYsFiveInContainer(
  container: HTMLElement,
  staffIndex: number,
): number[] | null {
  const svg =
    container.querySelector<SVGSVGElement>("svg.riff-ScoreCanvas__svg") ??
    container.querySelector<SVGSVGElement>(".riff-ScoreCanvas svg") ??
    container.querySelector<SVGSVGElement>("svg");

  if (!svg) return null;

  const staffGroups = svg.querySelectorAll("g.staff");
  const staffGroup = staffGroups[staffIndex];
  if (!staffGroup) return null;

  const containerRect = container.getBoundingClientRect();

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
    if (!Number.isFinite(y)) continue;
    if (
      lineYsFive.length === 0 ||
      Math.abs(y - lineYsFive[lineYsFive.length - 1]!) > 1.5
    ) {
      lineYsFive.push(y);
    }
  }
  if (lineYsFive.length < 5) return null;
  return lineYsFive.slice(0, 5);
}

/** Center + size for a rest-hover preview notehead (container coordinates). */
export type RestGhostNoteheadLayout = {
  centerX: number;
  centerY: number;
  fontSize: number;
};

/**
 * Bravura notehead position/size for a rest-hover ghost — horizontal center aligned with the rest,
 * vertical center from snapped pitch on the staff (same geometry as step-time preview).
 */
export function restGhostNoteheadLayoutInContainer(
  container: HTMLElement,
  score: EditableScore,
  staffIndex: number,
  anchorXContainer: number,
  pitch: string,
): RestGhostNoteheadLayout | null {
  if (!Number.isFinite(anchorXContainer)) return null;
  const part = score.parts[staffIndex];
  if (!part) return null;
  const lineYsFive = staffLineYsFiveInContainer(container, staffIndex);
  if (!lineYsFive) return null;
  const centerY = staffAnchorYForPitch(part.clef, lineYsFive, pitch);
  if (centerY == null || !Number.isFinite(centerY)) return null;
  const sorted = [...lineYsFive].sort((a, b) => a - b);
  if (!Number.isFinite(sorted[0]) || !Number.isFinite(sorted[4])) return null;
  const spacing = (sorted[4]! - sorted[0]!) / 4;
  if (!Number.isFinite(spacing) || spacing <= 0) return null;
  // Larger than live RiffScore noteheads so the hover target is easy to read; capped for huge staves.
  const fontSize = Math.max(22, Math.min(58, spacing * 2.95));
  if (!Number.isFinite(fontSize)) return null;
  return { centerX: anchorXContainer, centerY, fontSize };
}

/** When pointer Y does not resolve (e.g. edge timing), use middle-staff diatonic pitch — always in `ANCHOR_PITCHES`. */
export function midStaffDiatonicPitchInContainer(
  container: HTMLElement,
  score: EditableScore,
  staffIndex: number,
): string | null {
  const part = score.parts[staffIndex];
  const lineYsFive = staffLineYsFiveInContainer(container, staffIndex);
  if (!part || !lineYsFive) return null;
  const sorted = [...lineYsFive].sort((a, b) => a - b);
  if (!Number.isFinite(sorted[0]) || !Number.isFinite(sorted[4])) return null;
  const midY = (sorted[0]! + sorted[4]!) / 2;
  return pitchFromStaffGeometry(part.clef, lineYsFive, midY);
}

/**
 * Map a vertical position (container coordinates) on a staff to diatonic pitch,
 * using the same line geometry as note-input preview. Used when placing a ghost
 * over a rest without RiffScore’s preview notehead.
 */
export function pitchAtStaffVerticalInContainer(
  container: HTMLElement,
  score: EditableScore,
  staffIndex: number,
  centerYContainer: number,
): string | null {
  const part = score.parts[staffIndex];
  if (!part) return null;

  const lineYsFive = staffLineYsFiveInContainer(container, staffIndex);
  if (!lineYsFive) return null;

  return pitchFromStaffGeometry(part.clef, lineYsFive, centerYContainer);
}
