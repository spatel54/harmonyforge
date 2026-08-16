import { NextResponse } from "next/server";
import { getOmrStatus } from "@/server/engine/parsers/audiverisPipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const omr = getOmrStatus();
  return NextResponse.json({
    status: "ok",
    service: "harmonyforge",
    ts: new Date().toISOString(),
    omr: {
      audiveris: omr.audiveris,
      java: omr.java,
      ready: omr.ready,
    },
  });
}
