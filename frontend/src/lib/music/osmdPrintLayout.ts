/**
 * OSMD engraving margins for PDF/print export (millimeters).
 * Defaults in OSMD are 5mm; we use slightly tighter values that stay within
 * conventional sheet-music layout (roughly 3–4mm / ~0.12–0.16in).
 */

/** Uniform page edge inset (mm). */
export const OSMD_PRINT_PAGE_MARGIN_MM = 4;

/** Title block spacing above first system (mm). */
export const OSMD_PRINT_PAGE_TOP_MARGIN_MM = 4.5;

/** Space below last system on the page (mm). */
export const OSMD_PRINT_PAGE_BOTTOM_MARGIN_MM = 4;

type EngravingRulesLike = {
  PageLeftMargin: number;
  PageRightMargin: number;
  PageTopMargin: number;
  PageBottomMargin: number;
  SystemLeftMargin: number;
};

export function applyOsmdPrintEngravingRules(rules: EngravingRulesLike): void {
  rules.PageLeftMargin = OSMD_PRINT_PAGE_MARGIN_MM;
  rules.PageRightMargin = OSMD_PRINT_PAGE_MARGIN_MM;
  rules.PageTopMargin = OSMD_PRINT_PAGE_TOP_MARGIN_MM;
  rules.PageBottomMargin = OSMD_PRINT_PAGE_BOTTOM_MARGIN_MM;
  rules.SystemLeftMargin = 0;
}
