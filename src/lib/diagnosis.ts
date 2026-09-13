import { z } from "zod";

export const persona = {
  name: "岚舟",
  role: "AI 场景诊断顾问",
  description: "耐心倾听，追问事实，把业务问题变成可验收的小规模实验。",
  greeting:
    "你好，我是岚舟，你的 AI 场景诊断顾问。我会陪你梳理业务现状，一起确定值得验证的 POC。先聊一个具体问题：你在哪个业务环节最希望得到改善？最近一次发生了什么？",
};
export const diagnosisSteps = [
  "认识业务",
  "诊断现状",
  "挖掘需求",
  "划定边界",
  "设计验证",
  "方案确认",
] as const;
export const factLabels = {
  organization: "企业 / 部门",
  users: "使用者",
  problem: "核心问题",
  workflow: "现有流程",
  baseline: "现状基线",
  goal: "业务目标",
  data: "数据与权限",
  scope: "POC 范围",
  exclusions: "不做什么",
  humanBoundary: "人工兜底",
  acceptance: "验收标准",
  owner: "验收负责人",
  timeline: "周期与资源",
} as const;
const text = z.string().trim().max(2000);
export const factsSchema = z.object({
  organization: text,
  users: text,
  problem: text,
  workflow: text,
  baseline: text,
  goal: text,
  data: text,
  scope: text,
  exclusions: text,
  humanBoundary: text,
  acceptance: text,
  owner: text,
  timeline: text,
});
export type DiagnosisFacts = z.infer<typeof factsSchema>;
export const planSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(3000),
  solution: z.string().trim().min(1).max(3000),
  risks: z.array(z.string().trim().min(1).max(600)).min(1).max(10),
  stopCondition: z.string().trim().min(1).max(1000),
  milestones: z
    .array(
      z.object({
        stage: z.enum(["P0", "P1", "P2", "P3", "P4", "P5"]),
        title: z.string().trim().min(1).max(300),
        deliverable: z.string().trim().min(1).max(1000),
        owner: z.string().trim().min(1).max(200),
        timing: z.string().trim().min(1).max(200),
      }),
    )
    .min(1)
    .max(12),
  criteria: z
    .array(
      z.object({
        dimension: z.enum(["技术", "业务", "采纳"]),
        title: z.string().trim().min(1).max(1000),
      }),
    )
    .min(3)
    .max(12),
});
export type PocProposal = z.infer<typeof planSchema>;
export const diagnosisReplySchema = z.object({
  reply: z.string().trim().min(1).max(6000),
  step: z.number().int().min(0).max(5),
  facts: factsSchema,
  openQuestions: z.array(z.string().trim().min(1).max(600)).max(20),
  suggestions: z.array(z.string().trim().min(1).max(300)).max(3),
  plan: planSchema.nullable(),
});
export type DiagnosisReply = z.infer<typeof diagnosisReplySchema>;
export interface DiagnosisMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
export interface DiagnosisSession {
  id: string;
  title: string;
  projectId: string | null;
  context: string;
  messages: DiagnosisMessage[];
  result: DiagnosisReply | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
}

export function isProposalReady(result: DiagnosisReply | null) {
  return Boolean(
    result?.plan &&
    result.openQuestions.length === 0 &&
    Object.values(result.facts).every(
      (value) => value.trim() && !/待确认|待补充|未知|待定/.test(value),
    ) &&
    ["技术", "业务", "采纳"].every((dimension) =>
      result.plan!.criteria.some((c) => c.dimension === dimension),
    ),
  );
}

export function createDiagnosisSession(
  projectId: string | null,
  context = "",
): DiagnosisSession {
  return {
    id: crypto.randomUUID(),
    title: "新的场景诊断",
    projectId,
    context,
    result: null,
    confirmedAt: null,
    confirmedBy: null,
    messages: [
      { id: crypto.randomUUID(), role: "assistant", content: persona.greeting },
    ],
  };
}

export function proposalMarkdown(session: DiagnosisSession) {
  const result = session.result;
  if (!result?.plan) return "";
  const plan = result.plan;
  return [
    `# ${plan.title}`,
    session.confirmedAt
      ? `确认人：${session.confirmedBy} · ${session.confirmedAt}`
      : "状态：待客户确认",
    "## 诊断结论",
    plan.summary,
    ...Object.entries(factLabels).map(
      ([key, label]) =>
        `### ${label}\n${result.facts[key as keyof DiagnosisFacts]}`,
    ),
    "## 方案设计",
    plan.solution,
    "## 里程碑",
    ...plan.milestones.map(
      (m) =>
        `- ${m.stage} ${m.title}：${m.deliverable}（${m.timing}，${m.owner}）`,
    ),
    "## 验收标准",
    ...plan.criteria.map((c) => `- ${c.dimension}：${c.title}`),
    "## 风险与停止条件",
    ...plan.risks.map((risk) => `- ${risk}`),
    plan.stopCondition,
  ].join("\n\n");
}
