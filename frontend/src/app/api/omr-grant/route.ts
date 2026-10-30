import { NextResponse } from "next/server";
import { getOmrServiceConfig, mintOmrGrant } from "@/server/omrService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issues a short-lived capability for uploading one score to the OMR sidecar.
 *
 * The shared secret never leaves the server; the browser only ever sees a
 * signed, expiring token. Returns 501 when OMR is not configured so the client
 * can fall back to the "symbolic formats only" message.
 */
export async function POST() {
  const config = getOmrServiceConfig();
  if (!config) {
    return NextResponse.json(
      {
        error:
          "PDF → MusicXML is not configured on this deployment. " +
          "Set OMR_SERVICE_URL and OMR_SHARED_SECRET (see docs/deployment.md), " +
          "or upload MusicXML, MXL, or MIDI.",
      },
      { status: 501 },
    );
  }
  return NextResponse.json(mintOmrGrant(config), {
    headers: { "Cache-Control": "no-store" },
  });
}
