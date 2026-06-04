/**
 * Dev-only playback diagnostics from patched RiffScore (`__HF_LOG_PLAYBACK`).
 */

export type PlaybackDebugPayload = {
  hypothesisId?: string;
  location?: string;
  message?: string;
  data?: Record<string, unknown>;
};

const RING_MAX = 80;
const POST_INTERVAL_MS = 250;
const ring: PlaybackDebugPayload[] = [];
let lastPostAt = 0;

type G = typeof globalThis & {
  __HF_LOG_PLAYBACK?: (payload: PlaybackDebugPayload) => void;
};

function isDevLoggingEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

function persistToSession(entry: PlaybackDebugPayload): void {
  if (typeof window === "undefined") return;
  try {
    const key = "hf-playback-debug";
    const prev = JSON.parse(window.sessionStorage.getItem(key) ?? "[]") as PlaybackDebugPayload[];
    const next = [...prev, { ...entry, at: Date.now() }].slice(-RING_MAX);
    window.sessionStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

export function hfLogPlayback(payload: PlaybackDebugPayload): void {
  if (!isDevLoggingEnabled()) return;
  ring.push(payload);
  if (ring.length > RING_MAX) ring.shift();
  persistToSession(payload);
  if (typeof window !== "undefined") {
    const now = Date.now();
    if (now - lastPostAt >= POST_INTERVAL_MS) {
      lastPostAt = now;
      void fetch("/api/debug-session-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // offline or route unavailable
      });
    }
  }
}

export function getPlaybackDebugRing(): readonly PlaybackDebugPayload[] {
  return ring;
}

export function installPlaybackDebugBridge(): void {
  (globalThis as G).__HF_LOG_PLAYBACK = hfLogPlayback;
}

export function isPlaybackDebugBridgeInstalled(): boolean {
  return typeof (globalThis as G).__HF_LOG_PLAYBACK === "function";
}
