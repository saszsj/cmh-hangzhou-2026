"use client";

import { useMemo, useState } from "react";

type CreateResponse =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export default function NewPage() {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [pain, setPain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && industry.trim().length > 0 && pain.trim().length > 0;
  }, [name, industry, pain]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          industry,
          pain,
        }),
      });
      const data = (await res.json()) as CreateResponse;
      if (!data.ok) {
        setError(data.error || "生成失败");
        return;
      }
      window.location.href = `/${encodeURIComponent(data.slug)}`;
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          输入信息，生成你的 AI 方案 Demo
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          格式示例：我叫 XXX，我是一个 XX 行业老板，我现在最头疼的问题是 XXX。
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">我叫</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：张三"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              maxLength={32}
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">行业</span>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="例如：餐饮 / 教培 / 医美 / 外贸"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              maxLength={48}
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">最头疼的问题</span>
            <textarea
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              placeholder="例如：客单价低、复购差、渠道成本高、团队不执行…"
              className="min-h-28 resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              maxLength={600}
              required
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {isSubmitting ? "生成中…" : "生成 Demo"}
          </button>
        </form>
      </main>
    </div>
  );
}

