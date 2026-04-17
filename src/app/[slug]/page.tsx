import DemoRenderer from "@/components/DemoRenderer";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div className="flex flex-1 items-start justify-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <main className="w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Demo 链接：<span className="font-mono">/{slug}</span>
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            解决方案 Demo（占位）
          </h1>
          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            目前这是页面骨架。下一步会接入数据库与 AI 生成内容，让该页面按 slug 拉取并渲染互动 Demo。
          </p>
        </div>

        <div className="mt-8">
          <DemoRenderer
            spec={{
              title: "样例：提升转化与复购",
              summary: "这是一个占位示例，后续会由 AI 按你的输入生成。",
              planSteps: [
                { title: "明确目标与指标", detail: "定义 1 个北极星指标 + 3 个可执行指标。" },
                { title: "设计 7 天行动表", detail: "把动作拆到每天，每天只做 1-2 件关键事。" },
                { title: "做一个小闭环验证", detail: "先跑通 20 个客户的转化闭环，再复制放大。" },
              ],
              demoWidgets: [
                {
                  type: "checklist",
                  title: "今日执行清单（示例）",
                  items: ["梳理 3 个核心卖点", "写 1 版首句开场", "发 30 个私域触达"],
                },
              ],
            }}
          />
        </div>
      </main>
    </div>
  );
}

