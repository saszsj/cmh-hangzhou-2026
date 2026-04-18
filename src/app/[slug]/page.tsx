import { eq } from "drizzle-orm";

import DemoRenderer from "@/components/DemoRenderer";
import { getDb } from "@/db/client";
import { generatedPages } from "@/db/schema";
import { demoSpecSchema } from "@/lib/demoSpec";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params;
  let rows: { spec: unknown }[] = [];
  let dbError: string | null = null;
  try {
    const db = getDb();
    rows = await db
      .select({ spec: generatedPages.spec })
      .from(generatedPages)
      .where(eq(generatedPages.slug, slug))
      .limit(1);
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Server error";
  }

  return (
    <div className="flex flex-1 items-start justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <main className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Demo 链接：<span className="font-mono">/{slug}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            解决方案 Demo
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            内容按当前可落地的 AI 能力（大模型、自动化与知识库等）组织，便于对外演示与讨论。
          </p>
          {dbError ? (
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              服务器暂未配置数据库（{dbError}）。请先在部署环境设置 <span className="font-mono">DATABASE_URL</span>。
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              未找到该链接对应的内容。请从 <span className="font-mono">/new</span> 重新生成一次。
            </p>
          ) : null}
        </div>

        <div className="mt-8">
          {dbError || rows.length === 0 ? null : (() => {
              const parsed = demoSpecSchema.safeParse(rows[0]!.spec);
              if (!parsed.success) {
                return (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
                    生成内容格式异常，建议重新从 <span className="font-mono">/new</span> 生成一次。
                  </div>
                );
              }
              return <DemoRenderer spec={parsed.data} />;
            })()}
        </div>
      </main>
    </div>
  );
}

