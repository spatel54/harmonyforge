import { describe, expect, it } from "vitest";
import {
  COPYRIGHT_HOLDER,
  OPEN_SOURCE_NOTICES,
  PRODUCT_NAME,
  SITE_TAGLINE,
  getCopyrightNotice,
  getCopyrightYear,
} from "./siteMeta";

describe("siteMeta", () => {
  it("exposes product identity", () => {
    expect(PRODUCT_NAME).toBe("HarmonyForge");
    expect(SITE_TAGLINE).toContain("Glass Box");
    expect(COPYRIGHT_HOLDER).toBe("Salt Family");
  });

  it("getCopyrightYear returns a plausible year", () => {
    const y = getCopyrightYear();
    expect(y).toBeGreaterThanOrEqual(2024);
    expect(y).toBeLessThanOrEqual(2100);
  });

  it("getCopyrightNotice includes holder and year", () => {
    const line = getCopyrightNotice();
    expect(line).toContain(String(getCopyrightYear()));
    expect(line).toContain("Salt Family");
    expect(line).toMatch(/©/);
  });

  it("lists RiffScore upstream notice", () => {
    const rs = OPEN_SOURCE_NOTICES.find((n) => n.name === "RiffScore");
    expect(rs).toBeDefined();
    expect(rs?.license).toBe("MIT");
    expect(rs?.copyrightLine).toContain("Joseph Kotvas");
  });
});
