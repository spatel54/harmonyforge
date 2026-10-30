import { NextResponse, type NextRequest } from "next/server";
import { getOmrStatus } from "@/server/engine/parsers/audiverisPipeline";
import { probeOmrService } from "@/server/omrService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `omr.transport` tells the client which PDF path to take:
 *   "local"  — Audiveris on this host (dev machine, or the all-in-one Docker image)
 *   "remote" — the Cloud Run sidecar (Vercel deployments)
 *   "none"   — PDF intake unavailable; symbolic formats still work
 *
 * Local wins when both are present so `make dev` never silently bills a
 * remote service for work the machine can already do.
 */
export async function GET(req: NextRequest) {
  const local = getOmrStatus();

  // The page's origin is this deployment's own origin — that is what the
  // browser will send when it uploads to the sidecar. Prefer the forwarded
  // host (Vercel) so previews report their real, per-deployment origin.
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  const browserOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : req.nextUrl.origin;

  const remote = await probeOmrService(browserOrigin);

  const transport = local.ready ? "local" : remote.ready ? "remote" : "none";
  const ready = transport !== "none";

  return NextResponse.json({
    status: "ok",
    service: "harmonyforge",
    ts: new Date().toISOString(),
    omr: {
      // Preserved for existing consumers (deployment docs, fly-health target).
      audiveris: local.audiveris,
      java: local.java,
      ready,
      transport,
      local: { ready: local.ready, details: local.details },
      remote: {
        configured: remote.configured,
        ready: remote.ready,
        originAllowed: remote.originAllowed,
        origin: browserOrigin,
        detail: remote.detail,
      },
    },
  });
}
