/** File types that run Audiveris OMR on the server (slow, multi-minute). */
const OMR_INTAKE_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg"]);

export function isOmrIntakeExtension(ext: string): boolean {
  return OMR_INTAKE_EXTENSIONS.has(ext.toLowerCase().replace(/^\./, ""));
}

/** Asymptotic creep toward 90% while server work is in flight. */
export function intakeProgressWhileWaiting(elapsedMs: number, slowOmr: boolean): number {
  const cap = 90;
  const tauMs = slowOmr ? 180_000 : 12_000;
  const raw = cap * (1 - Math.exp(-elapsedMs / tauMs));
  return Math.min(cap, Math.max(0, Math.round(raw)));
}
