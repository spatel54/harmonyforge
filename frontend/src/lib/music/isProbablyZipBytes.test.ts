import { describe, expect, it } from "vitest";
import { isProbablyZipBytes } from "./isProbablyZipBytes";

describe("isProbablyZipBytes", () => {
  it("detects PK\\x03\\x04 local header", () => {
    const u8 = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);
    expect(isProbablyZipBytes(u8)).toBe(true);
  });

  it("rejects short and non-zip input", () => {
    expect(isProbablyZipBytes(new Uint8Array([0x50, 0x4b]))).toBe(false);
    expect(isProbablyZipBytes(new Uint8Array([0x3c, 0x3f, 0x78, 0x6d]))).toBe(false);
  });
});
