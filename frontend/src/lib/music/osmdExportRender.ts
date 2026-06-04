import { applyOsmdPrintEngravingRules } from "./osmdPrintLayout";

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
): Promise<void> {
  container.innerHTML = "";
  const { OpenSheetMusicDisplay } = await import("opensheetmusicdisplay");
  const osmd = new OpenSheetMusicDisplay(container, {
    backend: "svg",
    drawTitle: true,
    drawingParameters: "default",
  });
  applyOsmdPrintEngravingRules(osmd.EngravingRules);
  await osmd.load(xml);
  osmd.render();
  stripOsmdPageLabels(container);
}
