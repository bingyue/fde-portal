import { stages, type StageId } from "./model";

export const workSkills = [
  {
    id: "requirement-understanding",
    name: "需求理解",
    when: "首次描述企业问题",
    output: "问题定义与目标边界",
  },
  {
    id: "interview-analysis",
    name: "访谈分析",
    when: "访谈记录与会议纪要",
    output: "事实、分歧与待核实问题",
  },
  {
    id: "fde-questioning",
    name: "FDE 追问",
    when: "信息不足或不清楚下一步",
    output: "分角色访谈提纲与资料清单",
  },
  {
    id: "process-diagnosis",
    name: "业务流程诊断",
    when: "已获得业务流程资料",
    output: "As-Is 流程与瓶颈",
  },
  {
    id: "scenario-discovery",
    name: "AI 场景发现",
    when: "寻找业务落地切口",
    output: "候选场景与场景画像",
  },
  {
    id: "value-assessment",
    name: "AI 价值评估",
    when: "需要筛选场景优先级",
    output: "价值、可行性与风险判断",
  },
  {
    id: "data-assessment",
    name: "数据就绪评估",
    when: "验证数据与系统基础",
    output: "数据缺口、权限与集成风险",
  },
  {
    id: "roi-analysis",
    name: "ROI 分析",
    when: "已有业务基线和成本假设",
    output: "收益模型及敏感性分析",
  },
  {
    id: "technical-design",
    name: "技术方案",
    when: "业务边界已确认",
    output: "目标架构、工作流与选型",
  },
  {
    id: "poc-planning",
    name: "PoC 规划",
    when: "准备验证关键假设",
    output: "范围、测试集与成功标准",
  },
  {
    id: "project-evaluation",
    name: "项目评测",
    when: "有原型和真实评测记录",
    output: "评测判断、缺陷与验收建议",
  },
  {
    id: "delivery-acceptance",
    name: "交付验收",
    when: "上线、验收与运营交接",
    output: "验收材料、风险与交接清单",
  },
] as const;

export function routeSkills(
  text: string,
  stage: StageId,
  overrides: string[] = [],
) {
  const allowed = new Set<string>(workSkills.map((skill) => skill.id));
  if (overrides.length) {
    if (overrides.length > 3 || overrides.some((id) => !allowed.has(id)))
      throw new Error("请选择 1–3 个已注册 Skill");
    return [...new Set(overrides)];
  }
  const selected: string[] = [];
  if (/访谈|纪要|会议|说|主管|老板/.test(text))
    selected.push("interview-analysis");
  if (/流程|排产|工序|生产|瓶颈/.test(text)) selected.push("process-diagnosis");
  if (/数据|ERP|Excel|权限|样本|数据库/i.test(text))
    selected.push("data-assessment");
  if (/收益|ROI|回报|成本/i.test(text)) selected.push("roi-analysis");
  if (/测试|评测|准确率|缺陷/.test(text)) selected.push("project-evaluation");
  if (/访谈提纲|追问|信息不足|下一步/.test(text))
    selected.push("fde-questioning");
  return [
    ...new Set([...selected, ...stages.find((s) => s.id === stage)!.skills]),
  ].slice(0, 3);
}
