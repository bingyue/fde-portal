import { z } from "zod";

export const stageIds = [
  "launch",
  "interview",
  "diagnosis",
  "value",
  "solution",
  "poc",
  "pilot",
  "production",
  "acceptance",
] as const;
export type StageId = (typeof stageIds)[number];
export const stages: {
  id: StageId;
  name: string;
  goal: string;
  criteria: { id: string; title: string }[];
  skills: string[];
}[] = [
  {
    id: "launch",
    name: "项目启动",
    goal: "确认企业问题、项目目标和决策责任人。",
    criteria: [
      { id: "brief", title: "业务问题、目标与初步边界已确认" },
      { id: "sponsor", title: "项目负责人和业务决策人已明确" },
    ],
    skills: ["requirement-understanding", "fde-questioning"],
  },
  {
    id: "interview",
    name: "企业访谈",
    goal: "了解真实流程、干系人分歧与现场证据。",
    criteria: [
      { id: "stakeholders", title: "关键干系人诉求和冲突已核实" },
      { id: "as-is", title: "现有业务流程已有具体样本支撑" },
    ],
    skills: ["interview-analysis", "process-diagnosis", "fde-questioning"],
  },
  {
    id: "diagnosis",
    name: "场景诊断",
    goal: "找到可落地的小切口，核实约束与数据。",
    criteria: [
      { id: "scenario", title: "候选场景、优先问题与边界已明确" },
      { id: "data", title: "数据样本、权限和业务约束已核实" },
    ],
    skills: ["scenario-discovery", "data-assessment", "process-diagnosis"],
  },
  {
    id: "value",
    name: "价值评估",
    goal: "用基线、收益假设和风险决定是否值得做。",
    criteria: [
      { id: "baseline", title: "业务基线和目标指标有证据" },
      { id: "roi", title: "收益、成本假设和停止条件经业务方确认" },
    ],
    skills: ["value-assessment", "roi-analysis"],
  },
  {
    id: "solution",
    name: "技术方案",
    goal: "确定目标架构、集成方式与人机分工。",
    criteria: [
      { id: "architecture", title: "最小闭环、系统集成与数据流已评审" },
      { id: "boundary", title: "人机责任、安全边界和降级方案已确认" },
    ],
    skills: ["technical-design", "data-assessment", "poc-planning"],
  },
  {
    id: "poc",
    name: "PoC 验证",
    goal: "用真实评测验证关键假设。",
    criteria: [
      { id: "eval", title: "真实样本评测达到约定阈值" },
      { id: "failures", title: "严重缺陷已关闭或有获批的处置方案" },
    ],
    skills: ["poc-planning", "project-evaluation"],
  },
  {
    id: "pilot",
    name: "业务试点",
    goal: "在真实业务中验证价值与用户采纳。",
    criteria: [
      { id: "trial", title: "试点结果与业务指标已验证" },
      { id: "adoption", title: "用户采纳、培训与操作规范有证据" },
    ],
    skills: ["project-evaluation", "value-assessment"],
  },
  {
    id: "production",
    name: "生产上线",
    goal: "让方案具备安全运行和持续维护能力。",
    criteria: [
      { id: "security", title: "权限、安全和运行监控已检查" },
      { id: "rollback", title: "灰度、回滚与责任人已演练确认" },
    ],
    skills: ["technical-design", "delivery-acceptance"],
  },
  {
    id: "acceptance",
    name: "验收运营",
    goal: "完成交接、验收与持续改进安排。",
    criteria: [
      { id: "signoff", title: "业务方签署验收结论与遗留问题清单" },
      { id: "handover", title: "运维交接、责任人和持续运营指标已确认" },
    ],
    skills: ["delivery-acceptance", "roi-analysis"],
  },
];

export interface Source {
  id: string;
  title: string;
  text: string;
  kind: "note" | "file" | "legacy";
  createdAt: string;
}
export interface Fact {
  id: string;
  text: string;
  sourceId: string;
  quote: string;
  status: "proposed" | "confirmed" | "rejected";
  analysisId: string;
  confirmedBy?: string;
  confirmedAt?: string;
}
export interface Task {
  id: string;
  title: string;
  owner: string;
  stage: StageId;
  blocking: boolean;
  status: "todo" | "doing" | "done";
  analysisId: string;
  evidenceId?: string;
  completionNote?: string;
}
export interface Asset {
  id: string;
  title: string;
  content: string;
  version: number;
  stage: StageId;
  sourceIds: string[];
  analysisId: string;
  createdAt: string;
  approvedBy: string;
}
export interface Decision {
  id: string;
  kind: "fact" | "action" | "stage" | "rollback" | "task" | "evidence";
  actor: string;
  reason: string;
  outcome?: string;
  references: string[];
  at: string;
}
export interface GateEvidence {
  criterionId: string;
  evidenceId: string;
  actor: string;
  reason: string;
  at: string;
}
export interface SkillRun {
  skillId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  error?: string;
  output?: SkillOutput;
}
export interface Analysis {
  id: string;
  sourceId: string;
  stage: StageId;
  stageRevision?: number;
  intent: string;
  status: "running" | "completed" | "failed";
  createdAt: string;
  finishedAt?: string;
  error?: string;
  runs: SkillRun[];
  judgment?: Judgment;
  actionsConfirmedAt?: string;
  actor?: string;
}
export interface WorkProject {
  id: string;
  name: string;
  organization: string;
  goal: string;
  owner: string;
  revision: number;
  stageRevision?: number;
  currentStage: StageId;
  completedStages: StageId[];
  gates: Partial<Record<StageId, GateEvidence[]>>;
  sources: Source[];
  facts: Fact[];
  tasks: Task[];
  assets: Asset[];
  decisions: Decision[];
  analyses: Analysis[];
  createdAt: string;
  updatedAt: string;
  legacyId?: string;
}
const short = z.string().trim().min(1).max(1200);
export const skillOutputSchema = z.object({
  summary: short,
  facts: z
    .array(
      z.object({ text: short, sourceId: z.string().max(80), quote: short }),
    )
    .max(12),
  missing: z.array(short).max(12),
  contradictions: z.array(short).max(8),
  recommendation: short,
  suggestedStage: z.enum(stageIds),
  actions: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(300),
        owner: z.string().trim().min(1).max(100),
        stage: z.enum(stageIds),
        blocking: z.boolean(),
      }),
    )
    .max(6),
  deliverables: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(200),
        content: z.string().trim().min(1).max(10000),
      }),
    )
    .min(1)
    .max(3),
});
export type SkillOutput = z.infer<typeof skillOutputSchema>;
export interface Judgment {
  summary: string;
  missing: string[];
  contradictions: string[];
  recommendation: string;
  suggestedStage: StageId;
  actions: SkillOutput["actions"];
  deliverables: SkillOutput["deliverables"];
}

export function evidenceOptions(project: WorkProject) {
  return [
    ...project.sources.map((source) => ({
      id: source.id,
      title: `原始资料 · ${source.title}`,
    })),
    ...project.facts
      .filter((fact) => fact.status === "confirmed")
      .map((fact) => ({ id: fact.id, title: `已确认事实 · ${fact.text}` })),
    ...project.assets.map((asset) => ({
      id: asset.id,
      title: `交付资产 · ${asset.title} v${asset.version}`,
    })),
  ];
}
export function gateBlockers(
  project: WorkProject,
  stageId = project.currentStage,
) {
  const definition = stages.find((stage) => stage.id === stageId)!;
  const validEvidence = new Set(
    evidenceOptions(project).map((evidence) => evidence.id),
  );
  const checks = project.gates[stageId] || [];
  const missing = definition.criteria
    .filter(
      (criterion) =>
        !checks.some(
          (check) =>
            check.criterionId === criterion.id &&
            validEvidence.has(check.evidenceId),
        ),
    )
    .map((criterion) => criterion.title);
  return [
    ...missing,
    ...project.tasks
      .filter(
        (task) =>
          task.stage === stageId && task.blocking && task.status !== "done",
      )
      .map((task) => `阻塞任务未完成：${task.title}`),
  ];
}
export function createProject(input: {
  name: string;
  organization: string;
  goal: string;
  owner: string;
}): WorkProject {
  const timestamp = new Date().toISOString();
  return {
    ...input,
    id: crypto.randomUUID(),
    revision: 0,
    currentStage: "launch",
    completedStages: [],
    gates: {},
    sources: [],
    facts: [],
    tasks: [],
    assets: [],
    decisions: [],
    analyses: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
export function projectMarkdown(project: WorkProject) {
  return [
    `# ${project.name}`,
    `企业：${project.organization} · 负责人：${project.owner}`,
    `目标：${project.goal}`,
    `阶段：${stages.find((s) => s.id === project.currentStage)!.name}`,
    "## 已确认企业事实",
    ...project.facts
      .filter((f) => f.status === "confirmed")
      .map(
        (f) =>
          `- ${f.text}\n  来源：${project.sources.find((s) => s.id === f.sourceId)?.title || f.sourceId}\n  原文：${f.quote}\n  确认：${f.confirmedBy} · ${f.confirmedAt}`,
      ),
    "## 阶段证据",
    ...stages.map(
      (stage) =>
        `### ${stage.name} · ${project.completedStages.includes(stage.id) ? "已确认完成" : "未完成"}\n${(project.gates[stage.id] || []).map((gate) => `- ${stage.criteria.find((c) => c.id === gate.criterionId)?.title}：${gate.reason} · ${gate.actor} · ${gate.at} · 证据 ${gate.evidenceId}`).join("\n")}`,
    ),
    "## 原始资料",
    ...project.sources.map(
      (source) =>
        `### ${source.title}\n来源 ID：${source.id} · ${source.createdAt}\n\n${source.text}`,
    ),
    "## 当前任务",
    ...project.tasks.map(
      (t) =>
        `- [${t.status === "done" ? "x" : " "}] ${t.title} · ${t.owner} · ${stages.find((s) => s.id === t.stage)!.name}`,
    ),
    "## 决策记录",
    ...project.decisions.map(
      (d) =>
        `- ${d.at} · ${d.actor} · ${d.kind}：${d.outcome || ""}\n  依据：${d.reason}（${d.references.join("、")}）`,
    ),
    "## 交付资产",
    ...project.assets.map((a) => `### ${a.title} v${a.version}\n${a.content}`),
  ].join("\n\n");
}
