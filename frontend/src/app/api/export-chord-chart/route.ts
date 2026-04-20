import { NextResponse, type NextRequest } from "next/server";
import { readFormFile, runExportChordChart } from "@/server/engine/runtime";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  const result = runExportChordChart(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return new NextResponse(result.text, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
