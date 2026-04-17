import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            扫码 → 输入问题 → 自动生成可分享 Demo
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            二维码获客：AI 方案 Demo 生成器
          </h1>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-300">
            填写“我叫 / 行业 / 头疼问题”，系统会生成一个可打开的解决方案 Demo 页面，并提供固定链接
            <span className="font-mono"> /&lt;拼音首字母&gt;</span> 方便你转发与复用。
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            立即生成一个 Demo
          </Link>
          <a
            href="/new"
            className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            扫码入口（/new）
          </a>
        </div>

        <div className="mt-8 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200">
          <p className="font-semibold">下一步</p>
          <p className="mt-1">
            我会在后续步骤接入数据库与 AI 生成，让 <span className="font-mono">/new</span> 提交后自动跳转到{" "}
            <span className="font-mono">/&lt;slug&gt;</span>。
          </p>
        </div>
      </main>
    </div>
  );
}
