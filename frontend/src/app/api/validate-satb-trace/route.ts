import { NextResponse, type NextRequest } from "next/server";
import { runValidateSATBTrace, type ValidateSatbTraceBody } from "@/server/engine/runtime";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: ValidateSatbTraceBody;
  try {
    body = (await req.json()) as ValidateSatbTraceBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const result = runValidateSATBTrace(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
