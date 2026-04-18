import type { NextRequest } from "next/server";
import { forwardJsonToEngine } from "@/lib/server/engineForward";

export async function POST(req: NextRequest) {
  return forwardJsonToEngine(req, "/api/validate-satb-trace");
}
