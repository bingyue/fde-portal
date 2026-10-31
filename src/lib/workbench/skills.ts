import { stages, type StageId } from "./model";
export interface WorkSkill {
  id: string;
  name: string;
  when: string;
  output: string;
  priority: "P0" | "P1";
  core: boolean;
  group: string;
  trigger: { events: string[]; condition: string };
  input_schema: string;
  output_schema: string;
  quality_gate: string[];
  requires_approval: true;
  project_effect: string[];
}
const definitions: [
  string,
  string,
  string,
  string,
  "P0" | "P1",
  boolean,
  string,
][] = [
  [
    "requirement-understanding",
    "FDE 需求理解",
    "首次描述企业问题",
    "问题定义与目标边界",
    "P0",
    false,
    "项目入口",
  ],
  [
    "stage-classifier",
    "项目阶段判断",
    "询问项目进度或导入资料",
    "阶段定位与依据",
    "P0",
    false,
    "项目入口",
  ],
  [
    "fde-interview-analyzer",
    "企业访谈分析",
    "访谈纪要、会议记录、录音转写",
    "事实、目标、责任人与原文证据",
    "P0",
    true,
    "企业诊断",
  ],
  [
    "fde-gap-finder",
    "信息缺口与智能追问",
    "信息不足、模糊或存在矛盾",
    "缺什么、为什么、问谁、如何问",
    "P0",
    true,
    "企业诊断",
  ],
  [
    "process-diagnosis",
    "业务流程诊断",
    "业务流程与瓶颈描述",
    "As-Is 流程、瓶颈与 AI 介入点",
    "P0",
    false,
    "企业诊断",
  ],
  [
    "scenario-discovery",
    "AI 场景发现",
    "寻找落地切口",
    "候选场景与边界",
    "P0",
    false,
    "场景规划",
  ],
  [
    "fde-scenario-evaluator",
    "AI 场景价值评估",
    "比较候选场景",
    "价值、难度、数据、组织阻力、风险",
    "P0",
    true,
    "场景规划",
  ],
  [
    "roi-analysis",
    "ROI 测算",
    "有基线与成本假设",
    "收益、成本、回报区间及敏感性",
    "P0",
    false,
    "场景规划",
  ],
  [
    "data-assessment",
    "数据与系统就绪度",
    "ERP、MES、CRM、样本与权限检查",
    "数据质量、集成与授权缺口",
    "P0",
    false,
    "技术准备",
  ],
  [
    "technical-design",
    "技术架构设计",
    "比较技术路线",
    "RAG、Workflow、Agent、MCP 架构取舍",
    "P1",
    false,
    "方案设计",
  ],
  [
    "solution-builder",
    "AI 方案生成",
    "整合业务与技术方案",
    "目标、方案、里程碑、人机边界",
    "P1",
    false,
    "方案设计",
  ],
  [
    "poc-planning",
    "PoC 规划",
    "准备验证关键假设",
    "范围、指标、方法、停止条件",
    "P0",
    false,
    "PoC 验证",
  ],
  [
    "project-evaluation",
    "Agent 评测",
    "有原型与真实评测记录",
    "准确率、可靠性、成本及风险",
    "P1",
    false,
    "PoC 验证",
  ],
  [
    "risk-diagnosis",
    "项目风险诊断",
    "发现风险或发生变更",
    "技术、数据、组织风险与应对",
    "P0",
    false,
    "交付管理",
  ],
  [
    "fde-next-action",
    "下一步行动规划",
    "新增资料、完成访谈或任务后",
    "优先级、前置条件、负责人及对应 Skill",
    "P0",
    true,
    "交付管理",
  ],
  [
    "fde-stage-review",
    "阶段验收检查",
    "每轮判断、推进或验收前",
    "完成项、缺口、阻塞与推进建议",
    "P0",
    true,
    "交付管理",
  ],
  [
    "operations-readiness",
    "上线与运营准备",
    "试点转上线或交接",
    "权限、监控、应急、回滚与移交",
    "P1",
    false,
    "上线运营",
  ],
  [
    "fde-deliverable-builder",
    "FDE 交付资产生成",
    "人工确认事实、行动或阶段以后",
    "可追溯、可修订的交付文档",
    "P0",
    true,
    "全流程",
  ],
];
export const workSkills: WorkSkill[] = definitions.map(
  ([id, name, when, output, priority, core, group]) => ({
    id,
    name,
    when,
    output,
    priority,
    core,
    group,
    trigger: {
      events:
        id === "fde-deliverable-builder"
          ? ["approval.recorded", "deliverable.requested"]
          : id === "fde-next-action"
            ? ["source.analyzed", "task.completed"]
            : ["source.analyzed", "skill.requested"],
      condition: when,
    },
    input_schema:
      id === "fde-deliverable-builder"
        ? "approved-project-context.v2"
        : "project-analysis-context.v2",
    output_schema: core ? id + ".v2" : "skill-result.v2",
    quality_gate: [
      "schema-valid",
      "source-quotes-exact",
      "references-project-scoped",
      ...(id === "fde-stage-review" ? ["stage-rules-enforced"] : []),
      ...(id === "fde-deliverable-builder"
        ? ["approval-required", "draft-until-reviewed"]
        : []),
    ],
    requires_approval: true,
    project_effect:
      id === "fde-deliverable-builder"
        ? ["propose.asset-version"]
        : id === "fde-gap-finder"
          ? ["propose.issue"]
          : id === "fde-next-action"
            ? ["propose.task"]
            : id === "fde-stage-review"
              ? ["propose.stage-review"]
              : ["propose.fact", "propose.recommendation"],
  }),
);
export const skillAliases: Record<string, string> = {
  "interview-analysis": "fde-interview-analyzer",
  "fde-questioning": "fde-gap-finder",
  "value-assessment": "fde-scenario-evaluator",
  "delivery-acceptance": "fde-stage-review",
};
export function canonicalSkillId(id: string) {
  return skillAliases[id] || id;
}
export function findWorkSkill(id: string) {
  return workSkills.find((s) => s.id === canonicalSkillId(id));
}
export function skillName(id: string) {
  return findWorkSkill(id)?.name || id;
}
export interface PlannedSkill {
  skillId: string;
  dependsOn: string[];
  phase: number;
}
export function planSkills(
  text: string,
  stage: StageId,
  overrides: string[] = [],
): PlannedSkill[] {
  const chosen = [...new Set(overrides.map(canonicalSkillId))];
  if (
    chosen.length > 3 ||
    chosen.some((id) => !findWorkSkill(id) || id === "fde-deliverable-builder")
  )
    throw new Error("请选择最多 3 个分析 Skill；交付资产在人工确认后生成");
  const first = /访谈|纪要|会议|转写|主管|老板|说/.test(text)
    ? "fde-interview-analyzer"
    : "requirement-understanding";
  const specialists = chosen.length
    ? chosen
    : [
        ...(/流程|排产|工序|生产|瓶颈/.test(text) ? ["process-diagnosis"] : []),
        ...(/数据|ERP|MES|CRM|Excel|权限|样本/i.test(text)
          ? ["data-assessment"]
          : []),
        ...(/ROI|回报|收益|成本测算/i.test(text) ? ["roi-analysis"] : []),
        ...(/风险|一个月上线|赶工|紧急/.test(text) ? ["risk-diagnosis"] : []),
        ...(stages.find((s) => s.id === stage)?.skills || []).map(
          canonicalSkillId,
        ),
      ]
        .filter(
          (id) =>
            ![
              "fde-interview-analyzer",
              "fde-gap-finder",
              "fde-stage-review",
              "fde-next-action",
              "fde-scenario-evaluator",
              first,
            ].includes(id),
        )
        .slice(0, 2);
  const core = [
    "fde-gap-finder",
    ...(/AI|场景|排产|智能|方案/i.test(text) ||
    ["diagnosis", "value", "solution", "poc", "pilot"].includes(stage) ||
    chosen.includes("fde-scenario-evaluator")
      ? ["fde-scenario-evaluator"]
      : []),
  ];
  const groups = [
    [first],
    specialists.filter(
      (id) =>
        ![first, ...core, "fde-stage-review", "fde-next-action"].includes(id),
    ),
    core,
    ["fde-stage-review"],
    ["fde-next-action"],
  ];
  const plan: PlannedSkill[] = [];
  groups.forEach((ids, phase) => {
    const dependencies = plan.map((p) => p.skillId);
    for (const skillId of ids)
      if (!plan.some((p) => p.skillId === skillId))
        plan.push({ skillId, phase, dependsOn: [...dependencies] });
  });
  return plan;
}
export function routeSkills(
  text: string,
  stage: StageId,
  overrides: string[] = [],
) {
  return planSkills(text, stage, overrides).map((run) => run.skillId);
}
