"use client";

import { useMemo, useState } from "react";
import type { DemoSpec } from "@/lib/demoSpec";

type RoiCalculatorWidget = Extract<DemoSpec["demoWidgets"][number], { type: "roiCalculator" }>;

export default function RoiCalculatorClient({ widget }: { widget: RoiCalculatorWidget }) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const f of widget.fields) initial[f.key] = f.defaultValue;
    return initial;
  });

  const result = useMemo(() => {
    const numerator = values[widget.formula.numeratorKey] ?? 0;
    const denominator = values[widget.formula.denominatorKey] ?? 0;
    if (!denominator) return null;
    return numerator / denominator;
  }, [values, widget.formula.denominatorKey, widget.formula.numeratorKey]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{widget.title}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {widget.fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{f.label}</span>
            <input
              inputMode="decimal"
              value={String(values[f.key] ?? 0)}
              onChange={(e) => {
                const n = Number(e.target.value);
                setValues((prev) => ({ ...prev, [f.key]: Number.isFinite(n) ? n : 0 }));
              }}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-100">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">计算结果</p>
        <p className="mt-1">
          {widget.formula.label}： <span className="font-mono">{result === null ? "—" : result.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );
}

