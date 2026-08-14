import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MATERIAL_FILES = {
  nurse: {
    fileName: "nurse-career-guide.pptx",
    downloadName: "골든타임_간호사_진로교안.pptx",
  },
  emt: {
    fileName: "emt-career-guide.pptx",
    downloadName: "골든타임_응급구조사_진로교안.pptx",
  },
} as const;

function hasValidPassword(candidate: unknown) {
  if (typeof candidate !== "string") return false;

  const expected = Buffer.from(process.env.TEACHER_MATERIAL_PASSWORD ?? "3035");
  const received = Buffer.from(candidate);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function noStoreJson(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, private" },
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ material: string }> },
) {
  const { material } = await context.params;
  const payload = await request.json().catch(() => null);

  if (!hasValidPassword(payload?.password)) {
    return noStoreJson({ ok: false }, 401);
  }

  if (material === "verify") {
    return noStoreJson({ ok: true }, 200);
  }

  if (!(material in MATERIAL_FILES)) {
    return noStoreJson({ ok: false }, 404);
  }

  const selected = MATERIAL_FILES[material as keyof typeof MATERIAL_FILES];
  const filePath = path.join(
    process.cwd(),
    "app",
    "api",
    "teacher-materials",
    "files",
    selected.fileName,
  );

  try {
    const file = await readFile(filePath);
    const encodedName = encodeURIComponent(selected.downloadName);
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Cache-Control": "no-store, private",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return noStoreJson({ ok: false, message: "교안 파일을 찾을 수 없습니다." }, 404);
  }
}

export function GET() {
  return noStoreJson({ ok: false }, 405);
}
