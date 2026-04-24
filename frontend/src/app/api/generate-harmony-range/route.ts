import { NextRequest, NextResponse } from "next/server";
import {
  parseConfig,
  runGenerateHarmonyRangeFromMusicXml,
} from "@/server/engine/runtime";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const musicXml = typeof o.musicXml === "string" ? o.musicXml : "";
  const startMeasure = typeof o.startMeasure === "number" ? Math.floor(o.startMeasure) : 0;
  const endMeasure = typeof o.endMeasure === "number" ? Math.floor(o.endMeasure) : startMeasure;
  const config = o.config != null ? parseConfig(o.config) : null;

  if (!musicXml.trim()) {
    return NextResponse.json({ error: "musicXml is required" }, { status: 400 });
  }

  const out = runGenerateHarmonyRangeFromMusicXml(musicXml, config, startMeasure, endMeasure);
  if (!out.ok) {
    return NextResponse.json({ error: out.error }, { status: out.status });
  }

  return new NextResponse(out.xml, {
    status: 200,
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
