/** File types that run Audiveris OMR on the server (slow, multi-minute). */
const OMR_INTAKE_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg"]);

export function isOmrIntakeExtension(ext: string): boolean {
  return OMR_INTAKE_EXTENSIONS.has(ext.toLowerCase().replace(/^\./, ""));
}

/**
 * Asymptotic creep toward 92% while server work is in flight.
 * Fast MusicXML/MIDI uses a short tau so the bar actually climbs during the
 * branded overlay; PDF OMR keeps a multi-minute curve.
 */
export function intakeProgressWhileWaiting(elapsedMs: number, slowOmr: boolean): number {
  const cap = 92;
  const tauMs = slowOmr ? 180_000 : 800;
  const raw = cap * (1 - Math.exp(-elapsedMs / tauMs));
  return Math.min(cap, Math.max(0, Math.round(raw)));
}

/**
 * SATB generate overlay: climb quickly off 0%, then keep creeping toward 92%
 * for the full solver window instead of freezing at 90% after ~2s.
 */
export function generateProgressWhileWaiting(elapsedMs: number): number {
  const cap = 92;
  const t = Math.max(0, elapsedMs);
  const fast = 42 * (1 - Math.exp(-t / 900));
  const slow = 50 * (1 - Math.exp(-t / 55_000));
  return Math.min(cap, Math.max(0, Math.round(fast + slow)));
}
