import { z } from "zod";

const checklistWidgetSchema = z.object({
  type: z.literal("checklist"),
  title: z.string().min(1).max(80),
  items: z.array(z.string().min(1).max(80)).min(3).max(12),
});

const roiCalculatorWidgetSchema = z.object({
  type: z.literal("roiCalculator"),
  title: z.string().min(1).max(80),
  fields: z
    .array(
      z.object({
        label: z.string().min(1).max(40),
        key: z.string().regex(/^[a-z][a-z0-9_]{1,16}$/),
        defaultValue: z.number().finite(),
      }),
    )
    .min(2)
    .max(6),
  formula: z.object({
    numeratorKey: z.string(),
    denominatorKey: z.string(),
    label: z.string().min(1).max(60),
  }),
});

export const demoSpecSchema = z.object({
  title: z.string().min(1).max(80),
  summary: z.string().min(1).max(600),
  planSteps: z
    .array(z.object({ title: z.string().min(1).max(40), detail: z.string().min(1).max(200) }))
    .min(3)
    .max(8),
  demoWidgets: z.array(z.union([checklistWidgetSchema, roiCalculatorWidgetSchema])).min(2).max(6),
});

export type DemoSpec = z.infer<typeof demoSpecSchema>;

export function ensureWidgetMix(spec: DemoSpec): DemoSpec {
  const hasChecklist = spec.demoWidgets.some((w) => w.type === "checklist");
  const hasRoi = spec.demoWidgets.some((w) => w.type === "roiCalculator");
  if (hasChecklist && hasRoi) return spec;

  const patched: DemoSpec = {
    ...spec,
    demoWidgets: [...spec.demoWidgets],
  };

  if (!hasChecklist) {
    patched.demoWidgets.unshift({
      type: "checklist",
      title: "今日执行清单",
      items: ["明确目标客户", "写 1 版开场话术", "触达 30 个潜客", "记录 10 条异议并优化"],
    });
  }
  if (!hasRoi) {
    patched.demoWidgets.push({
      type: "roiCalculator",
      title: "投入产出测算（ROI）",
      fields: [
        { label: "预计新增毛利（元）", key: "profit", defaultValue: 15000 },
        { label: "投放成本（元）", key: "cost", defaultValue: 5000 },
      ],
      formula: { numeratorKey: "profit", denominatorKey: "cost", label: "毛利/成本（ROI）" },
    });
  }
  return patched;
}

