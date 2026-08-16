import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import {
  applyOsmdLearnerLetterLabels,
  collectLetterPlacementsFromOsmd,
  removeOsmdLearnerLetterLabels,
} from "./osmdLearnerLabels";

/** Wait until `el` has non-zero layout (modal animation / flex settle). */
export async function waitForElementLayout(
  el: HTMLElement,
  maxMs = 2500,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const r = el.getBoundingClientRect();
    if (r.width > 1 && r.height > 1) return;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

export async function nextAnimationFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

/**
 * Apply learner letter overlays after layout is stable. Retries once when placements
 * are empty but the score SVG is present (common during export-modal open).
 */
export async function applyOsmdLetterLabelsWhenReady(
  container: HTMLElement,
  osmd: OpenSheetMusicDisplay,
): Promise<number> {
  await waitForElementLayout(container);
  await nextAnimationFrames(2);

  let placements = collectLetterPlacementsFromOsmd(osmd);
  if (placements.length > 0) {
    applyOsmdLearnerLetterLabels(container, osmd);
    return placements.length;
  }

  const hasSvg = Boolean(container.querySelector("svg"));
  if (hasSvg) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 64);
    });
    await nextAnimationFrames(2);
    placements = collectLetterPlacementsFromOsmd(osmd);
  }

  if (placements.length > 0) {
    applyOsmdLearnerLetterLabels(container, osmd);
  } else {
    removeOsmdLearnerLetterLabels(container);
  }

  return placements.length;
}
