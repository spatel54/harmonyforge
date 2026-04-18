import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Base URL of the HarmonyForge engine (Express on :8000 by default). */
export function engineOrigin(): string {
  const u = process.env.NEXT_PUBLIC_API_URL?.trim();
  return u ? u.replace(/\/$/, "") : "http://localhost:8000";
}

/** Multipart POST (FormData) → engine. */
export async function forwardMultipartToEngine(
  req: NextRequest,
  enginePath: `/${string}`,
): Promise<NextResponse> {
  const url = `${engineOrigin()}${enginePath}`;
  const contentType = req.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("multipart/")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }
  const bodyBuf = await req.arrayBuffer();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: bodyBuf,
  });
  const out = await res.arrayBuffer();
  const outHeaders = new Headers();
  const ct = res.headers.get("Content-Type");
  if (ct) outHeaders.set("Content-Type", ct);
  return new NextResponse(out, { status: res.status, headers: outHeaders });
}

/** JSON POST → engine. */
export async function forwardJsonToEngine(
  req: NextRequest,
  enginePath: `/${string}`,
): Promise<NextResponse> {
  const url = `${engineOrigin()}${enginePath}`;
  const body = await req.text();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const out = await res.arrayBuffer();
  const outHeaders = new Headers();
  const ct = res.headers.get("Content-Type");
  if (ct) outHeaders.set("Content-Type", ct);
  return new NextResponse(out, { status: res.status, headers: outHeaders });
}
