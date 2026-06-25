import { NextResponse } from "next/server";

const serverRing: unknown[] = [];
const RING_MAX = 200;

/** Dev-only ring buffer for patched RiffScore playback diagnostics. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const body = await req.json();
    serverRing.push({ at: Date.now(), ...body });
    if (serverRing.length > RING_MAX) serverRing.shift();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({ entries: serverRing });
}
