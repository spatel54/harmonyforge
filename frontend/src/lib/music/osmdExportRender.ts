import type { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { applyOsmdLetterLabelsWhenReady } from "./osmdLetterLabelApply";
import { applyOsmdPrintEngravingRules } from "./osmdPrintLayout";
import { removeOsmdLearnerLetterLabels } from "./osmdLearnerLabels";

export type OsmdExportRenderOptions = {
  /** Letter names above noteheads (PDF preview / print only). */
  showLetterNames?: boolean;
};

/** Strip OSMD's built-in "Page N" labels (print CSS uses its own counters). */
export function stripOsmdPageLabels(container: HTMLElement): void {
  container.querySelectorAll("svg text").forEach((el) => {
    if (/^Page\s+\d+/i.test(el.textContent?.trim() ?? "")) {
      el.remove();
    }
  });
}

/**
 * Render partwise MusicXML with the same OSMD rules as PDF/print export.
 */
export async function renderOsmdExportScore(
  container: HTMLElement,
  xml: string,
  options?: OsmdExportRenderOptions,
): Promise<OpenSheetMusicDisplay> {
  container.innerHTML = "";
  const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
  const osmd = new OpenSheetMusicDisplay(container, {
    backend: "svg",
    drawTitle: true,
    drawingParameters: "default",
    autoResize: false,
  });
  applyOsmdPrintEngravingRules(osmd.EngravingRules);
  await osmd.load(xml);
  osmd.render();
  stripOsmdPageLabels(container);

  if (options?.showLetterNames) {
    await applyOsmdLetterLabelsWhenReady(container, osmd);
  } else {
    removeOsmdLearnerLetterLabels(container);
  }

  return osmd;
}
