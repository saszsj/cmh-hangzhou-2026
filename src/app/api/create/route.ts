import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "参数错误" }, { status: 400 });
    }
    const { name, industry, pain } = body as Record<string, unknown>;
    if (
      typeof name !== "string" ||
      typeof industry !== "string" ||
      typeof pain !== "string" ||
      name.trim().length === 0 ||
      industry.trim().length === 0 ||
      pain.trim().length === 0
    ) {
      return NextResponse.json({ ok: false, error: "请完整填写信息" }, { status: 400 });
    }

    // Temporary placeholder: until slug+pinyin+db+ai are implemented.
    const slug = "demo";
    return NextResponse.json({ ok: true, slug });
  } catch {
    return NextResponse.json({ ok: false, error: "服务器异常" }, { status: 500 });
  }
}

