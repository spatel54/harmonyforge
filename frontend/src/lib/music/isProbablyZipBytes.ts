/**
 * ZIP local file header / empty / spanned signatures (aligned with backend fileIntake.isProbablyZip).
 */
export function isProbablyZipBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false;
  const sig = bytes[2]! | (bytes[3]! << 8);
  return sig === 0x0403 || sig === 0x0605 || sig === 0x0807;
}
