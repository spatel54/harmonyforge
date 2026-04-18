import type { NextRequest } from "next/server";
import { forwardMultipartToEngine } from "@/lib/server/engineForward";

export async function POST(req: NextRequest) {
  return forwardMultipartToEngine(req, "/api/export-chord-chart");
}
