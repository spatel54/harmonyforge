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
export interface OmrProbe {
  configured: boolean;
  ready: boolean;
  /** Null when not checked; false means uploads from this origin would be refused. */
  originAllowed: boolean | null;
  detail?: string;
}

export async function probeOmrService(
  browserOrigin?: string,
  timeoutMs = 3000,
): Promise<OmrProbe> {
  const config = getOmrServiceConfig();
  if (!config) {
    return {
      configured: false,
      ready: false,
      originAllowed: null,
      detail: "OMR_SERVICE_URL / OMR_SHARED_SECRET not set — PDF intake disabled",
    };
  }
  // Pass the origin the browser will upload from. A sidecar can be perfectly
  // healthy and still refuse this deployment's origin (Vercel previews), and
  // reporting "ready" in that case produces an opaque CORS failure at upload.
  const probeUrl = new URL(`${config.url}/health`);
  if (browserOrigin) probeUrl.searchParams.set("origin", browserOrigin);

  try {
    const res = await fetch(probeUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        configured: true,
        ready: false,
        originAllowed: null,
        detail: `sidecar /health returned ${res.status}`,
      };
    }
    const body = (await res.json()) as {
      ready?: boolean;
      originAllowed?: boolean | null;
      details?: string[];
    };
    const originAllowed = body.originAllowed ?? null;
    // Ready means "a PDF uploaded from here will actually convert".
    const ready = body.ready === true && originAllowed !== false;
    return {
      configured: true,
      ready,
      originAllowed,
      detail: ready ? undefined : (body.details ?? []).join("; ") || "sidecar not ready",
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "unknown error";
    return {
      configured: true,
      ready: false,
      originAllowed: null,
      detail: `sidecar unreachable: ${reason}`,
    };
  }
}
