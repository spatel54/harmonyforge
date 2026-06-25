/** Heuristic: PDF is mostly a embedded bitmap (phone photo export, scan apps). */
export function isLikelyRasterImagePdf(buffer: Buffer): boolean {
  if (buffer.length < 16 || buffer.subarray(0, 4).toString("latin1") !== "%PDF") {
    return false;
  }
  const head = buffer.subarray(0, Math.min(buffer.length, 512_000)).toString("latin1");
  if (!/\/Subtype\s*\/Image/i.test(head)) return false;
  if (/\/DCTDecode|\/JPXDecode|\/JPEG/i.test(head)) return true;
  const wh = head.match(/\/Width\s+(\d+)[\s\S]{0,120}?\/Height\s+(\d+)/);
  if (!wh) return false;
  const w = Number.parseInt(wh[1]!, 10);
  const h = Number.parseInt(wh[2]!, 10);
  return Number.isFinite(w) && Number.isFinite(h) && w * h >= 200_000;
}
