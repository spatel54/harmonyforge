import { describe, expect, it } from "vitest";
import {
  OSMD_PRINT_PAGE_MARGIN_MM,
  applyOsmdPrintEngravingRules,
} from "./osmdPrintLayout";

describe("applyOsmdPrintEngravingRules", () => {
  it("sets balanced page margins slightly inside OSMD defaults", () => {
    const rules = {
      PageLeftMargin: 0,
      PageRightMargin: 0,
      PageTopMargin: 0,
      PageBottomMargin: 0,
      SystemLeftMargin: 99,
    };
    applyOsmdPrintEngravingRules(rules);
    expect(rules.PageLeftMargin).toBe(OSMD_PRINT_PAGE_MARGIN_MM);
    expect(rules.PageRightMargin).toBe(OSMD_PRINT_PAGE_MARGIN_MM);
    expect(rules.PageLeftMargin).toBe(rules.PageRightMargin);
    expect(rules.PageTopMargin).toBeGreaterThan(0);
    expect(rules.PageBottomMargin).toBeGreaterThan(0);
    expect(rules.SystemLeftMargin).toBe(0);
  });
});
