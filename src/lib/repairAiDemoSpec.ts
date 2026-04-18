import { demoSpecSchema, ensureWidgetMix, type DemoSpec } from "@/lib/demoSpec";

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function finiteNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(/,/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

const KEY_RE = /^[a-z][a-z0-9_]{1,16}$/;

function allocFieldKey(i: number, used: Set<string>): string {
  for (let n = 0; n < 200; n++) {
    const base = `f${i + 1}${n > 0 ? `_${n}` : ""}`;
    const k = clamp(base.replace(/[^a-z0-9_]/g, "_").replace(/^[^a-z]+/, "f"), 17);
    const candidate = k.length >= 2 ? k : `fx${i + n}`;
    if (KEY_RE.test(candidate) && !used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  const fallback = `fx${i}_${Date.now() % 10000}`;
  used.add(fallback);
  return clamp(fallback, 17);
}

function normalizeFieldKey(raw: unknown, i: number, used: Set<string>): string {
  let k = String(raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^[^a-z]+/, "f");
  k = clamp(k || `f${i}`, 17);
  if (!KEY_RE.test(k) || used.has(k)) {
    return allocFieldKey(i, used);
  }
  used.add(k);
  return k;
}

/**
 * Coerce common LLM mistakes into something demoSpecSchema accepts.
 */
export function repairAiDemoSpec(raw: unknown): DemoSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const demoWidgetsSource = Array.isArray(o.demoWidgets)
    ? o.demoWidgets
    : Array.isArray(o.widgets)
      ? o.widgets
      : [];

  const title = clamp(String(o.title ?? "AI 方案 Demo").trim() || "AI 方案 Demo", 80);
  let summary = clamp(String(o.summary ?? "").trim(), 600);
  if (!summary) {
    summary = clamp(`针对「${title}」的落地思路与执行要点，详见下方步骤与工具区。`, 600);
  }

  const planStepsRaw = Array.isArray(o.planSteps) ? o.planSteps : [];
  const planSteps = planStepsRaw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => ({
      title: clamp(String(s.title ?? "步骤").trim() || "步骤", 40),
      detail: clamp(
        String(s.detail ?? s.description ?? s.body ?? "").trim() || "细化执行方式与验收标准。",
        200,
      ),
    }))
    .slice(0, 8);

  while (planSteps.length < 3) {
    planSteps.push({
      title: `阶段 ${planSteps.length + 1}`,
      detail: "对齐目标、资源与时间表，明确负责人与产出物。",
    });
  }

  let outWidgets: unknown[] = [];

  for (const w of demoWidgetsSource) {
    if (!w || typeof w !== "object") continue;
    const wObj = w as Record<string, unknown>;
    const type = String(wObj.type ?? "");

    if (type === "checklist") {
      const items = Array.isArray(wObj.items)
        ? wObj.items.map((x) => clamp(String(x).trim(), 80)).filter(Boolean)
        : [];
      while (items.length < 3) {
        items.push("完成一项可验证的关键动作");
      }
      outWidgets.push({
        type: "checklist",
        title: clamp(String(wObj.title ?? "执行清单").trim() || "执行清单", 80),
        items: items.slice(0, 12),
      });
    }

    if (type === "roiCalculator") {
      const usedKeys = new Set<string>();
      const fieldsRaw = Array.isArray(wObj.fields) ? wObj.fields : [];
      const fields = fieldsRaw
        .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
        .slice(0, 6)
        .map((f, idx) => {
          const key = normalizeFieldKey(f.key, idx, usedKeys);
          return {
            label: clamp(String(f.label ?? `指标 ${idx + 1}`).trim() || `指标 ${idx + 1}`, 40),
            key,
            defaultValue: finiteNumber(f.defaultValue, 1000 * (idx + 1)),
          };
        });

      while (fields.length < 2) {
        const idx = fields.length;
        fields.push({
          label: idx === 0 ? "预计收益（元）" : "投入成本（元）",
          key: normalizeFieldKey(idx === 0 ? "gain" : "cost", idx, usedKeys),
          defaultValue: idx === 0 ? 20000 : 5000,
        });
      }

      const formula = wObj.formula as Record<string, unknown> | undefined;
      let numeratorKey = String(formula?.numeratorKey ?? fields[0]!.key);
      let denominatorKey = String(formula?.denominatorKey ?? fields[1]!.key);
      const keySet = new Set(fields.map((f) => f.key));
      if (!keySet.has(numeratorKey)) numeratorKey = fields[0]!.key;
      if (!keySet.has(denominatorKey)) denominatorKey = fields[1]!.key;

      outWidgets.push({
        type: "roiCalculator",
        title: clamp(String(wObj.title ?? "投入产出测算").trim() || "投入产出测算", 80),
        fields,
        formula: {
          numeratorKey,
          denominatorKey,
          label: clamp(String(formula?.label ?? "比值").trim() || "比值", 60),
        },
      });
    }
  }

  outWidgets = outWidgets
    .filter(
      (w) =>
        !!w &&
        typeof w === "object" &&
        ((w as { type?: string }).type === "checklist" ||
          (w as { type?: string }).type === "roiCalculator"),
    )
    .slice(0, 4);

  const hasCheck = outWidgets.some(
    (w) =>
      !!w &&
      typeof w === "object" &&
      (w as { type?: string }).type === "checklist",
  );
  const hasRoi = outWidgets.some(
    (w) =>
      !!w &&
      typeof w === "object" &&
      (w as { type?: string }).type === "roiCalculator",
  );
  if (!hasCheck) {
    outWidgets.unshift({
      type: "checklist",
      title: "今日执行清单",
      items: ["明确场景与数据输入", "跑通一条 AI 辅助流程", "复盘并固化 SOP"],
    });
  }
  if (!hasRoi) {
    outWidgets.push({
      type: "roiCalculator",
      title: "投入产出测算",
      fields: [
        { label: "预计毛利（元）", key: "profit", defaultValue: 15000 },
        { label: "成本（元）", key: "cost", defaultValue: 5000 },
      ],
      formula: { numeratorKey: "profit", denominatorKey: "cost", label: "毛利/成本（ROI）" },
    });
  }

  const candidate = {
    title,
    summary,
    planSteps,
    demoWidgets: outWidgets.slice(0, 6),
  };

  const parsed = demoSpecSchema.safeParse(candidate);
  if (!parsed.success) return null;
  return ensureWidgetMix(parsed.data);
}
