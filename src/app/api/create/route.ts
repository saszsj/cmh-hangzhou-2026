import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import type { DemoSpec } from "@/db/schema";
import { generatedPages, submissions } from "@/db/schema";
import { demoSpecSchema, ensureWidgetMix } from "@/lib/demoSpec";
import { nextSlugCandidate, toPinyinInitials } from "@/lib/slug";
import { createSubmissionSchema } from "@/lib/validation";
import OpenAI from "openai";
import { getClientIp, rateLimitOrThrow } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    rateLimitOrThrow({ key: `create:${ip}`, capacity: 10, refillPerSecond: 10 / 60 });

    const json = (await req.json()) as unknown;
    const parsed = createSubmissionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "请完整填写信息" }, { status: 400 });
    }

    const { name, industry, pain } = parsed.data;
    const base = toPinyinInitials(name);
    if (!base) {
      return NextResponse.json({ ok: false, error: "姓名无法生成链接，请换个称呼（至少2个字符）" }, { status: 400 });
    }

    const db = getDb();

    // Find an available slug: base, base2, base3...
    let slug = "";
    for (let attempt = 1; attempt <= 50; attempt++) {
      const candidate = nextSlugCandidate(base, attempt);
      const existing = await db
        .select({ slug: generatedPages.slug })
        .from(generatedPages)
        .where(eq(generatedPages.slug, candidate))
        .limit(1);
      if (existing.length === 0) {
        slug = candidate;
        break;
      }
    }
    if (!slug) {
      return NextResponse.json({ ok: false, error: "链接生成失败，请稍后重试" }, { status: 500 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    let spec: DemoSpec;
    let modelUsed = "placeholder";
    let markdown: string | null = null;

    if (!openaiKey) {
      spec = ensureWidgetMix(
        demoSpecSchema.parse({
          title: `${industry}：快速解决「${pain.slice(0, 18)}${pain.length > 18 ? "…" : ""}」`,
          summary:
            "当前环境未配置 OPENAI_API_KEY，因此生成占位 Demo。部署到 Vercel 并配置密钥后将自动生成完整方案。",
          planSteps: [
            { title: "定义目标", detail: "明确你想在 7 天内提升的唯一指标（转化、复购、线索成本等）。" },
            { title: "拆解动作", detail: "把动作拆成每天 1-2 个关键任务，并设定验收标准。" },
            { title: "小规模验证", detail: "先用 20 个样本跑通闭环，再复用放大。" },
          ],
          demoWidgets: [
            {
              type: "checklist",
              title: "今日执行清单",
              items: ["列出 3 个核心卖点", "写 1 版开场话术", "触达 30 个目标客户"],
            },
            {
              type: "roiCalculator",
              title: "投放回本测算（ROI）",
              fields: [
                { label: "预计新增毛利（元）", key: "profit", defaultValue: 15000 },
                { label: "投放成本（元）", key: "cost", defaultValue: 5000 },
              ],
              formula: { numeratorKey: "profit", denominatorKey: "cost", label: "毛利/成本（ROI）" },
            },
          ],
        }),
      );
    } else {
      const client = new OpenAI({ apiKey: openaiKey });
      const system =
        "你是一个为中小企业老板生成“可执行解决方案Demo”的AI。你只输出严格的 JSON，不能包含任何解释文字。";
      const userPrompt = {
        name,
        industry,
        pain,
        requirements: {
          language: "zh-CN",
          mustHaveWidgets: ["checklist", "roiCalculator"],
          planStepsCount: "3-6",
        },
        output: "DemoSpec JSON",
      };

      const resp = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              `请根据以下输入生成 DemoSpec JSON（严格遵守字段与类型）：\n` +
              `${JSON.stringify(userPrompt, null, 2)}\n\n` +
              `DemoSpec 结构要求：\n` +
              `- title: string(<=80)\n` +
              `- summary: string(<=600)\n` +
              `- planSteps: [{title,detail}] (3-8项)\n` +
              `- demoWidgets: 至少包含一个 checklist 和一个 roiCalculator\n` +
              `其中 checklist: {type:'checklist', title, items[3..12]}\n` +
              `roiCalculator: {type:'roiCalculator', title, fields[{label,key,defaultValue}], formula{numeratorKey,denominatorKey,label}}\n` +
              `只输出 JSON（不要 Markdown 代码块）。`,
          },
        ],
      });

      const text = resp.choices?.[0]?.message?.content ?? "";
      modelUsed = resp.model ?? modelUsed;
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch {
        // best-effort extraction if model wrapped JSON with extra text
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        parsedJson = start >= 0 && end > start ? JSON.parse(text.slice(start, end + 1)) : null;
      }
      const parsed = demoSpecSchema.safeParse(parsedJson);
      if (!parsed.success) {
        return NextResponse.json({ ok: false, error: "AI 输出格式异常，请稍后重试" }, { status: 502 });
      }
      spec = ensureWidgetMix(parsed.data);
      markdown = `# ${spec.title}\n\n${spec.summary}\n`;
    }

    await db
      .insert(generatedPages)
      .values({ slug, spec, model: modelUsed, markdown })
      .onConflictDoUpdate({
        target: generatedPages.slug,
        set: { spec, model: modelUsed, markdown, updatedAt: new Date() },
      });
    await db.insert(submissions).values({ name, industry, pain, slug });

    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    if (e instanceof Error && e.message === "RATE_LIMITED") {
      return NextResponse.json({ ok: false, error: "请求太频繁，请稍后再试" }, { status: 429 });
    }
    console.error(e);
    return NextResponse.json({ ok: false, error: "服务器异常" }, { status: 500 });
  }
}

