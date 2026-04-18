import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import type { DemoSpec } from "@/db/schema";
import { generatedPages, submissions } from "@/db/schema";
import { demoSpecSchema, ensureWidgetMix } from "@/lib/demoSpec";
import { randomSlug } from "@/lib/slug";
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

    const db = getDb();

    let slug = "";
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = randomSlug(10);
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
            "当前环境未配置 OPENAI_API_KEY，因此生成占位 Demo。配置密钥后，系统会结合大模型、智能体与知识库等当下可用的 AI 能力，为你的行业痛点生成可执行方案。",
          planSteps: [
            { title: "定义目标", detail: "明确你想在 7 天内提升的唯一指标（转化、复购、线索成本等）。" },
            {
              title: "对齐 AI 能力",
              detail: "从可商用技术里选型：如用大模型做话术/方案草稿、用 RAG 接企业文档做可控回答、用自动化串联 CRM/表单；只选与痛点强相关的组合。",
            },
            { title: "拆解动作", detail: "把动作拆成每天 1-2 个关键任务，并设定验收标准；关键输出保留人工复核，降低幻觉与合规风险。" },
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
        "你是面向中小企业决策者的「AI 方案顾问」：根据对方的行业与痛点，输出可落地的解决方案 Demo（结构化 JSON）。\n" +
        "方案必须结合当下已普及或可商用的 AI 发展方向来写，例如：大语言模型与提示工程、智能体/工作流编排、企业知识库与 RAG、工具与 API 调用、多模态（文档/图片理解）、低代码+AI、数据安全与合规、评估与可观测性、人机协同与人工复核等。\n" +
        "只选择与输入行业、痛点强相关的技术点，用业务语言表述，避免空洞口号与过度技术堆砌。\n" +
        "你只输出严格的 JSON，不能包含任何解释文字。";
      const userPrompt = {
        name,
        industry,
        pain,
        requirements: {
          language: "zh-CN",
          mustHaveWidgets: ["checklist", "roiCalculator"],
          planStepsCount: "3-8",
          contentGuidance: {
            summaryAndSteps:
              "summary 与每个 planSteps.detail 要自然体现：如何用当前 AI 能力解决该痛点（可含实施阶段、所需数据或内容、团队分工）。至少在一处用一两句话点出模型幻觉、隐私或权限等风险及对应可控措施（如权限、审计、人工终审）。",
            title:
              "title 可突出行业或场景，并暗示 AI 赋能（不必出现英文缩写堆砌）。",
          },
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
              `- summary: string(<=600)，需体现与当下 AI 发展相匹配的解决思路\n` +
              `- planSteps: [{title,detail}] (3-8项)，步骤之间要有递进（诊断→方案→试点→放大 等任选合适框架）\n` +
              `- demoWidgets: 至少包含一个 checklist 和一个 roiCalculator\n` +
              `其中 checklist: {type:'checklist', title, items[3..12]}，清单项尽量可执行、可与 AI 辅助环节挂钩\n` +
              `roiCalculator: {type:'roiCalculator', title, fields[{label,key,defaultValue}], formula{numeratorKey,denominatorKey,label}}，指标与行业痛点一致\n` +
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

