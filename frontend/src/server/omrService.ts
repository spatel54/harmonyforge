/**
 * Server-side config + capability minting for the remote OMR sidecar.
 *
 * Topology (see docs/adr/004-omr-service-boundary.md):
 *   browser → POST {OMR_SERVICE_URL}/convert   (big PDF, long request)
 *   browser → POST /api/omr-merge              (small MusicXML, parsed here)
 *
 * The browser uploads straight to the sidecar because Vercel caps function
 * request bodies at 4.5 MB while score uploads run to 25 MB. To avoid leaving
 * an unauthenticated CPU-spending endpoint on the internet, the app mints a
 * short-lived HMAC capability that the sidecar verifies.
 */

import { createHmac } from "node:crypto";

/** Grants are single-upload and short-lived; a long TTL is a standing invitation. */
const GRANT_TTL_MS = 5 * 60 * 1000;

export interface OmrServiceConfig {
  /** Base URL of the sidecar, no trailing slash. */
  url: string;
  secret: string;
}

/**
 * Reads sidecar config. Returns null when OMR is not configured, which is a
 * valid state: MusicXML/MXL/MIDI intake works fully without a sidecar.
 */
export function getOmrServiceConfig(): OmrServiceConfig | null {
  const url = process.env.OMR_SERVICE_URL?.trim().replace(/\/+$/, "");
  const secret = process.env.OMR_SHARED_SECRET?.trim();
  if (!url || !secret) return null;
  return { url, secret };
}

export interface OmrGrant {
  url: string;
  token: string;
  expiresAt: number;
}

/** Mint a capability the sidecar will accept for one conversion. */
export function mintOmrGrant(config: OmrServiceConfig, now = Date.now()): OmrGrant {
  const expiresAt = now + GRANT_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt }), "utf-8").toString("base64url");
  const signature = createHmac("sha256", config.secret).update(payload).digest("base64url");
  return { url: config.url, token: `${payload}.${signature}`, expiresAt };
}

/**
 * Liveness + readiness of the sidecar, for `/api/health` and the Playground
 * banner. Short timeout: this must never delay a page render, and a cold
 * Cloud Run instance answering slowly is reported as not-ready rather than
 * blocking (the next poll will catch it once warm).
 */
export async function probeOmrService(
  timeoutMs = 3000,
): Promise<{ configured: boolean; ready: boolean; detail?: string }> {
  const config = getOmrServiceConfig();
  if (!config) {
    return {
      configured: false,
      ready: false,
      detail: "OMR_SERVICE_URL / OMR_SHARED_SECRET not set — PDF intake disabled",
    };
  }
  try {
    const res = await fetch(`${config.url}/health`, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) {
      return { configured: true, ready: false, detail: `sidecar /health returned ${res.status}` };
    }
    const body = (await res.json()) as { ready?: boolean; details?: string[] };
    return {
      configured: true,
      ready: body.ready === true,
      detail: body.ready === true ? undefined : (body.details ?? []).join("; ") || "sidecar not ready",
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "unknown error";
    return { configured: true, ready: false, detail: `sidecar unreachable: ${reason}` };
  }
}
