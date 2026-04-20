import { NextResponse, type NextRequest } from "next/server";
import { readFormFile, readFormFiles, runToPreviewMusicXML } from "@/server/engine/runtime";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File too large. Maximum upload size is ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.` },
      { status: 413 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = await readFormFile(form, "file");
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const pageImages = await readFormFiles(form, "pages");
  const result = runToPreviewMusicXML(file, pageImages);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return new NextResponse(result.xml, {
    status: 200,
    headers: { "Content-Type": "application/xml" },
  });
}
