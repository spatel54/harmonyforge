import type { OsmdExportRenderOptions } from "./osmdExportRender";

/** Build OSMD render options for PDF preview / print. */
export function osmdExportRenderOptionsForPdf(
  showLetterNames: boolean,
): OsmdExportRenderOptions | undefined {
  if (!showLetterNames) return undefined;
  return { showLetterNames: true };
}
