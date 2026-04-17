type PlanStep = {
  title: string;
  detail: string;
};

type ChecklistWidget = {
  type: "checklist";
  title: string;
  items: string[];
};

type DemoWidget = ChecklistWidget;

export type DemoSpec = {
  title: string;
  summary: string;
  planSteps: PlanStep[];
  demoWidgets: DemoWidget[];
};

export default function DemoRenderer({ spec }: { spec: DemoSpec }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900/40">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{spec.title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200">{spec.summary}</p>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">方案步骤</h3>
        <ol className="mt-3 grid gap-3">
          {spec.planSteps.map((s, idx) => (
            <li
              key={`${idx}-${s.title}`}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{s.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {s.detail}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4">
        {spec.demoWidgets.map((w, idx) => {
          if (w.type === "checklist") {
            return (
              <div
                key={`${w.type}-${idx}`}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{w.title}</p>
                <ul className="mt-3 grid gap-2">
                  {w.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                      <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" />
                      <span className="leading-6">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          return null;
        })}
      </section>
    </div>
  );
}

