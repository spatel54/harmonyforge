/**
 * Client transport for remote OMR (PDF/image → MusicXML) via the Cloud Run sidecar.
 *
 * Two hops, by necessity:
 *   1. POST the score straight to the sidecar — Vercel caps function request
 *      bodies at 4.5 MB and uploads run to 25 MB, so it cannot be proxied.
 *      Cloud Run allows 60-minute requests, which clears the Audiveris budget.
 *   2. POST the (small, symbolic) result to /api/omr-merge, which parses and
 *      merges it with the same code a local Audiveris run uses.
 *
 * See docs/adr/004-omr-service-boundary.md.
 */

export interface RemoteOmrDocumentPayload {
  name: string;
  encoding: "base64";
  data: string;
}

/** Matches DEFAULT_AUDIVERIS_MS server-side; the sidecar enforces its own cap too. */
const DEFAULT_CONVERT_TIMEOUT_MS = 900_000;
const MERGE_TIMEOUT_MS = 60_000;

async function errorTextFrom(res: Response, fallback: string): Promise<string> {
  const body = await res.text().catch(() => "");
  if (!body) return fallback;
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) return parsed.error;
  } catch {
    // Not JSON — the raw body is the better message.
  }
  return body.slice(0, 2000);
}

/**
 * Convert a PDF/image to preview MusicXML using the remote sidecar.
 * Throws with a human-readable message on any failure.
 */
export async function convertViaRemoteOmr(
  file: File,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<string> {
  // 1. Capability — the shared secret never reaches the browser.
  const grantRes = await fetch("/api/omr-grant", {
    method: "POST",
    signal: options.signal,
  });
  if (!grantRes.ok) {
    throw new Error(
      await errorTextFrom(grantRes, `Could not start OMR (grant failed: ${grantRes.status}).`),
    );
  }
  const grant = (await grantRes.json()) as { url?: string; token?: string };
  if (!grant.url || !grant.token) {
    throw new Error("OMR grant response was malformed.");
  }

  // 2. Upload straight to the sidecar. Long request by design.
  const convertRes = await fetch(
    `${grant.url}/convert?name=${encodeURIComponent(file.name)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${grant.token}`,
        "Content-Type": "application/octet-stream",
      },
      body: file,
      signal: options.signal ?? AbortSignal.timeout(options.timeoutMs ?? DEFAULT_CONVERT_TIMEOUT_MS),
    },
  ).catch((e: unknown) => {
    const reason = e instanceof Error ? e.message : "unknown error";
    throw new Error(
      `Could not reach the OMR service. It may be starting up (cold start) — retry in a moment. (${reason})`,
    );
  });

  if (!convertRes.ok) {
    throw new Error(
      await errorTextFrom(convertRes, `OMR failed with status ${convertRes.status}.`),
    );
  }

  const payload = (await convertRes.json()) as { documents?: RemoteOmrDocumentPayload[] };
  const documents = payload.documents ?? [];
  if (documents.length === 0) {
    throw new Error("Audiveris produced no MusicXML for this file.");
  }

  // 3. Parse + merge server-side, reusing the local parser.
  const mergeRes = await fetch("/api/omr-merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documents: documents.map((d) => ({ name: d.name, data: d.data })),
    }),
    signal: options.signal ?? AbortSignal.timeout(MERGE_TIMEOUT_MS),
  });
  if (!mergeRes.ok) {
    throw new Error(await errorTextFrom(mergeRes, `Could not parse OMR output (${mergeRes.status}).`));
  }
  return await mergeRes.text();
}
