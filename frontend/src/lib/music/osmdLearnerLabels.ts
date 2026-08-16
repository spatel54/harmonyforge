/**
 * Learner letter labels (C, F#, Bb) on OSMD PDF preview / print output.
 * Labels are SVG <text> in the same coordinate system as the engraving (scales with print).
 */

import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import type { EditableScore } from "./scoreTypes";
import { formatLearnerLetterName } from "./learnerPitchLabel";

const LABEL_GROUP_CLASS = "hf-osmd-letter-labels";
/** Space between notehead top and the bottom of the letter (SVG user units). */
const LABEL_GAP_ABOVE_HEAD = 2;
/** Font size in the same units as OSMD/VexFlow engraving (~10 units per staff space). */
export const OSMD_LEARNER_LABEL_FONT_SIZE = 8;

/** Y for SVG text with `dominant-baseline: hanging` so glyphs sit just above the notehead. */
export function learnerLabelYFromNoteheadTop(noteheadTopY: number): number {
  return noteheadTopY - LABEL_GAP_ABOVE_HEAD - OSMD_LEARNER_LABEL_FONT_SIZE;
}

export type OsmdLetterPlacement = {
  /** VexFlow note group — label coordinates are local to this element. */
  parent: SVGGElement;
  x: number;
  y: number;
  label: string;
};

type VexFlowGraphicalNoteLike = {
  sourceNote?: {
    isRest(): boolean;
    Pitch?: { ToStringShort(): string };
  };
  getNoteheadSVGs?: () => Element[];
  getSVGGElement?: () => SVGGElement;
};

type GraphicalMeasureLike = {
  staffEntries?: Array<{
    relInMeasureTimestamp?: { RealValue: number };
    graphicalVoiceEntries?: Array<{ notes?: VexFlowGraphicalNoteLike[] }>;
  }>;
};

/** OSMD exposes `graphic` as protected; we only read after `render()`. */
type OsmdWithGraphic = OpenSheetMusicDisplay & {
  graphic?: { MeasureList?: GraphicalMeasureLike[][] };
};

/** Pitches in part order (legacy). */
export function collectLetterLabelPitchesFromScore(score: EditableScore): string[] {
  const pitches: string[] = [];
  for (const part of score.parts) {
    for (const measure of part.measures) {
      for (const note of measure.notes) {
        if (note.isRest) continue;
        const p = note.pitch?.trim();
        if (p) pitches.push(p);
      }
    }
  }
  return pitches;
}

/** Pitches in measure-major order (for tests / diagnostics). */
export function collectLetterLabelPitchesMeasureMajor(
  score: EditableScore,
): string[] {
  const maxMeasures = Math.max(
    0,
    ...score.parts.map((p) => p.measures.length),
  );
  const pitches: string[] = [];
  for (let mi = 0; mi < maxMeasures; mi++) {
    for (const part of score.parts) {
      const measure = part.measures[mi];
      if (!measure) continue;
      for (const note of measure.notes) {
        if (note.isRest) continue;
        const p = note.pitch?.trim();
        if (p) pitches.push(p);
      }
    }
  }
  return pitches;
}

export function collectLetterLabelPitchesMeasureMajorFromXml(
  xml: string,
): string[] {
  if (typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) return [];

  const partMeasures = [...doc.querySelectorAll("part")].map((part) =>
    [...part.querySelectorAll("measure")],
  );
  const maxMeasures = Math.max(0, ...partMeasures.map((m) => m.length));
  const pitches: string[] = [];

  for (let mi = 0; mi < maxMeasures; mi++) {
    for (const measures of partMeasures) {
      const measure = measures[mi];
      if (!measure) continue;
      for (const noteEl of measure.querySelectorAll("note")) {
        if (noteEl.querySelector("rest")) continue;
        const step = noteEl.querySelector("pitch step")?.textContent?.trim();
        const octave = noteEl.querySelector("pitch octave")?.textContent?.trim();
        if (!step || octave == null) continue;
        const alterRaw = noteEl.querySelector("pitch alter")?.textContent?.trim();
        const alter = alterRaw ? parseInt(alterRaw, 10) : 0;
        const acc = alter === 1 ? "#" : alter === -1 ? "b" : "";
        pitches.push(`${step}${acc}${octave}`);
      }
    }
  }
  return pitches;
}

/** @deprecated Use measure-major collectors for OSMD export. */
export function collectLetterLabelPitchesFromPartwiseXml(xml: string): string[] {
  return collectLetterLabelPitchesMeasureMajorFromXml(xml);
}

/** Pick the visible notehead glyph (never the full note group or stem). */
export function resolveNoteheadElement(
  gNote: VexFlowGraphicalNoteLike,
): SVGGraphicsElement | null {
  const group = gNote.getSVGGElement?.();
  if (group) {
    const heads = [
      ...group.querySelectorAll<SVGGraphicsElement>(".vf-notehead"),
    ];
    if (heads.length === 1) return heads[0]!;
    if (heads.length > 1) {
      let top = heads[0]!;
      let topY = Infinity;
      for (const h of heads) {
        if (typeof h.getBBox !== "function") continue;
        const bb = h.getBBox();
        if (bb.y < topY) {
          topY = bb.y;
          top = h;
        }
      }
      return top;
    }
  }

  const fromApi = gNote.getNoteheadSVGs?.();
  if (!fromApi?.length) return null;

  let best: SVGGraphicsElement | null = null;
  let bestArea = Infinity;
  for (const el of fromApi) {
    if (!(el instanceof SVGGraphicsElement)) continue;
    if (typeof el.getBBox !== "function") continue;
    const bb = el.getBBox();
    const area = bb.width * bb.height;
    if (area > 0 && area < bestArea) {
      bestArea = area;
      best = el;
    }
  }
  return best;
}

function labelParentForNotehead(
  head: SVGGraphicsElement,
  gNote: VexFlowGraphicalNoteLike,
): SVGGElement | null {
  const fromNote = gNote.getSVGGElement?.();
  if (fromNote) return fromNote;
  const fromHead = head.parentElement;
  return fromHead instanceof SVGGElement ? fromHead : null;
}

function mapNoteheadPointToParent(
  head: SVGGraphicsElement,
  parent: SVGGElement,
  localX: number,
  localY: number,
): { x: number; y: number } | null {
  const svg = head.ownerSVGElement;
  if (!svg || typeof head.getCTM !== "function" || typeof parent.getCTM !== "function") {
    return null;
  }
  const headCtm = head.getCTM();
  const parentCtm = parent.getCTM();
  if (!headCtm || !parentCtm) return null;

  const pt = svg.createSVGPoint();
  pt.x = localX;
  pt.y = localY;
  const inRoot = pt.matrixTransform(headCtm);
  const inParent = inRoot.matrixTransform(parentCtm.inverse());
  if (!Number.isFinite(inParent.x) || !Number.isFinite(inParent.y)) return null;
  return { x: inParent.x, y: inParent.y };
}

/** Top-center of the notehead in the parent VexFlow group's coordinate system. */
export function noteheadLabelAnchorInParent(
  head: SVGGraphicsElement,
  parent: SVGGElement,
): { x: number; y: number } | null {
  if (typeof head.getBBox !== "function") return null;
  const bb = head.getBBox();
  if (bb.width <= 0 && bb.height <= 0) return null;

  const cx = bb.x + bb.width / 2;
  const topCorner = mapNoteheadPointToParent(head, parent, cx, bb.y);
  const bottomCorner = mapNoteheadPointToParent(head, parent, cx, bb.y + bb.height);
  if (!topCorner || !bottomCorner) {
    if (head.parentNode !== parent) return null;
    return {
      x: cx,
      y: learnerLabelYFromNoteheadTop(bb.y),
    };
  }

  const noteheadTopY = Math.min(topCorner.y, bottomCorner.y);
  return {
    x: topCorner.x,
    y: learnerLabelYFromNoteheadTop(noteheadTopY),
  };
}

function placementFromGraphicalNote(
  gNote: VexFlowGraphicalNoteLike,
): OsmdLetterPlacement | null {
  const src = gNote.sourceNote;
  if (!src || src.isRest()) return null;
  const label = formatLearnerLetterName(src.Pitch?.ToStringShort?.() ?? "");
  if (!label) return null;

  const head = resolveNoteheadElement(gNote);
  if (!head) return null;

  const parent = labelParentForNotehead(head, gNote);
  if (!parent) return null;

  const anchor = noteheadLabelAnchorInParent(head, parent);
  if (!anchor) return null;

  return { parent, ...anchor, label };
}

function appendFromGraphicalMeasure(
  gMeasure: GraphicalMeasureLike,
  out: OsmdLetterPlacement[],
): void {
  const entries = [...(gMeasure.staffEntries ?? [])].sort(
    (a, b) =>
      (a.relInMeasureTimestamp?.RealValue ?? 0) -
      (b.relInMeasureTimestamp?.RealValue ?? 0),
  );

  for (const staffEntry of entries) {
    for (const voiceEntry of staffEntry.graphicalVoiceEntries ?? []) {
      for (const gNote of voiceEntry.notes ?? []) {
        const p = placementFromGraphicalNote(gNote);
        if (p) out.push(p);
      }
    }
  }
}

export function collectLetterPlacementsFromOsmd(
  osmd: OpenSheetMusicDisplay,
): OsmdLetterPlacement[] {
  const placements: OsmdLetterPlacement[] = [];
  const measureList = (osmd as OsmdWithGraphic).graphic?.MeasureList;
  if (measureList?.length) {
    for (const staffMeasures of measureList) {
      if (!staffMeasures) continue;
      for (const gMeasure of staffMeasures) {
        if (gMeasure) appendFromGraphicalMeasure(gMeasure, placements);
      }
    }
  }

  if (placements.length > 0) return placements;

  const rules = osmd.EngravingRules as unknown as {
    GNote?: (note: {
      isRest(): boolean;
      Pitch?: { ToStringShort(): string };
    }) => VexFlowGraphicalNoteLike | undefined;
  };
  if (!rules.GNote) return placements;

  for (const srcMeasure of osmd.Sheet.SourceMeasures) {
    for (const vertical of srcMeasure.VerticalSourceStaffEntryContainers ?? []) {
      for (const staffEntry of vertical.StaffEntries ?? []) {
        for (const voiceEntry of staffEntry.VoiceEntries ?? []) {
          for (const note of voiceEntry.Notes ?? []) {
            if (note.isRest()) continue;
            const gNote = rules.GNote(note);
            if (!gNote) continue;
            const p = placementFromGraphicalNote(gNote);
            if (p) placements.push(p);
          }
        }
      }
    }
  }

  return placements;
}

export function removeOsmdLearnerLetterLabels(container: HTMLElement): void {
  container.querySelectorAll(`.${LABEL_GROUP_CLASS}`).forEach((el) => el.remove());
  container.querySelectorAll(".hf-osmd-letter-overlay").forEach((el) => el.remove());
}

export function applyOsmdLearnerLetterPlacements(
  container: HTMLElement,
  placements: readonly OsmdLetterPlacement[],
): void {
  removeOsmdLearnerLetterLabels(container);
  if (!placements.length) return;

  const byParent = new Map<SVGGElement, OsmdLetterPlacement[]>();
  for (const p of placements) {
    const list = byParent.get(p.parent) ?? [];
    list.push(p);
    byParent.set(p.parent, list);
  }

  for (const [parent, items] of byParent) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", LABEL_GROUP_CLASS);
    group.setAttribute("aria-hidden", "true");

    for (const { x, y, label } of items) {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", "hf-osmd-letter-label");
      text.setAttribute("x", String(x));
      text.setAttribute("y", String(y));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "hanging");
      text.setAttribute("font-size", String(OSMD_LEARNER_LABEL_FONT_SIZE));
      text.textContent = label;
      group.appendChild(text);
    }

    parent.appendChild(group);
  }
}

export function applyOsmdLearnerLetterLabels(
  container: HTMLElement,
  osmd: OpenSheetMusicDisplay,
): void {
  const placements = collectLetterPlacementsFromOsmd(osmd);
  applyOsmdLearnerLetterPlacements(container, placements);
}
