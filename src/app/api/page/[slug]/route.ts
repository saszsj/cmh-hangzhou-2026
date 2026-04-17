import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { generatedPages } from "@/db/schema";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    const db = getDb();
    const rows = await db
      .select({ spec: generatedPages.spec, slug: generatedPages.slug, updatedAt: generatedPages.updatedAt })
      .from(generatedPages)
      .where(eq(generatedPages.slug, slug))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, page: rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg.includes("DATABASE_URL") ? 500 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

