import { NextResponse, type NextRequest } from "next/server";
import {
  parseRemoteOmrDocuments,
  type RemoteOmrDocument,
} from "@/server/engine/parsers/audiverisPipeline";
import { parsedScoreToPartwiseMelodyMusicXML } from "@/server/engine/satbToMusicXML";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Parses + merges the MusicXML documents produced by the OMR sidecar.
 *
 * The heavy PDF goes browser → sidecar directly (Vercel caps function bodies at
 * 4.5 MB). What comes back is symbolic and small, so it is parsed here with the
 * same code a local Audiveris run uses — there is one score parser, not two.
 */

/** Compressed .mxl is small; this is a guard against a hostile/garbled peer. */
const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;
const MAX_DOCUMENTS = 64;

interface IncomingDocument {
  name?: unknown;
  data?: unknown;
}

export async function POST(req: NextRequest) {
  let body: { documents?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const raw = body.documents;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "No OMR documents provided" }, { status: 400 });
  }
  if (raw.length > MAX_DOCUMENTS) {
    return NextResponse.json(
      { error: `Too many documents (max ${MAX_DOCUMENTS})` },
      { status: 413 },
    );
  }

  const documents: RemoteOmrDocument[] = [];
  let totalBytes = 0;
  for (const entry of raw as IncomingDocument[]) {
    if (typeof entry?.name !== "string" || typeof entry?.data !== "string") {
      return NextResponse.json(
        { error: "Each document needs a string `name` and base64 `data`" },
        { status: 400 },
      );
    }
    const data = Buffer.from(entry.data, "base64");
    if (data.length === 0) continue;
    totalBytes += data.length;
    if (totalBytes > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: `OMR payload too large (max ${Math.round(MAX_PAYLOAD_BYTES / (1024 * 1024))} MB)` },
        { status: 413 },
      );
    }
    documents.push({ name: entry.name, data });
  }

  if (documents.length === 0) {
    return NextResponse.json({ error: "All OMR documents were empty" }, { status: 422 });
  }

  const parsed = parseRemoteOmrDocuments(documents);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "Audiveris produced output, but no readable notation could be parsed from it. " +
          "Ensure the PDF is upright, high-contrast, and contains notated staves. " +
          "MusicXML/MXL upload is still the fastest path.",
      },
      { status: 422 },
    );
  }

  // Mirrors runToPreviewMusicXML: prefer the engraved source when Audiveris
  // gave us full partwise XML, else serialize the extracted melody.
  const sourceXml = parsed.sourceMusicXml?.trim();
  const xml =
    sourceXml && sourceXml.length > 0 ? sourceXml : parsedScoreToPartwiseMelodyMusicXML(parsed);

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "application/xml", "Cache-Control": "no-store" },
  });
}
