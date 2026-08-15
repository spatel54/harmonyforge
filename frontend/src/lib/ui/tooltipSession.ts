/** Toolbar tooltip session — neighbors open instantly after the first tooltip in a burst. */

const SESSION_MS = 2500;

let sessionActive = false;
let sessionTimer: ReturnType<typeof setTimeout> | null = null;

export function beginTooltipSession(): void {
  sessionActive = true;
  if (sessionTimer != null) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    sessionActive = false;
    sessionTimer = null;
  }, SESSION_MS);
}

export function isTooltipSessionActive(): boolean {
  return sessionActive;
}

export function endTooltipSession(): void {
  sessionActive = false;
  if (sessionTimer != null) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
}
