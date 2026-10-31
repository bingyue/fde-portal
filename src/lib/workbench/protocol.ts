import { z } from "zod";
import {
  actionSchema,
  evidenceOptions,
  gateBlockers,
  skillOutputSchema,
  stages,
  type Analysis,
  type SkillOutput,
  type WorkProject,
} from "./model";
import { canonicalSkillId, findWorkSkill } from "./skills";

export const inputSchema = z.object({
  protocolVersion: z.literal(2),
  project: z.object({
    id: z.string(),
    name: z.string(),
    organization: z.string(),
    goal: z.string(),
    owner: z.string(),
  }),
  stage: z
    .object({
      id: z.string(),
      criteria: z.array(z.object({ id: z.string(), title: z.string() })),
    })
    .passthrough(),
  source: z
    .object({ id: z.string(), title: z.string(), text: z.string().min(5) })
    .passthrough(),
  intent: z.string().min(1),
  previousResults: z.array(
    z.object({ skillId: z.string(), output: skillOutputSchema }),
  ),
  confirmedFacts: z.array(
    z
      .object({
        id: z.string(),
        text: z.string(),
        sourceId: z.string(),
        quote: z.string(),
        status: z.literal("confirmed"),
      })
      .passthrough(),
  ),
  openIssues: z.array(z.unknown()),
  resolvedIssues: z.array(z.unknown()).optional(),
  tasks: z.array(z.unknown()),
  decisions: z.array(z.unknown()),
  gateBlockers: z.array(z.string()),
  availableEvidence: z.array(z.object({ id: z.string(), title: z.string() })),
  otherSources: z.array(
    z.object({ id: z.string(), title: z.string(), text: z.string() }),
  ),
  approval: z
    .object({
      id: z.string(),
      actor: z.string(),
      reason: z.string(),
      at: z.string(),
    })
    .passthrough()
    .nullable(),
  documentType: z.string().optional(),
  approvedAnalyses: z
    .array(
      z.object({ id: z.string(), sourceId: z.string(), judgment: z.unknown() }),
    )
    .optional(),
  approvedAssets: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        version: z.number(),
        content: z.string(),
      }),
    )
    .optional(),
});
export function outputSchemaFor(skillId: string) {
  const id = canonicalSkillId(skillId);
  if (id === "fde-interview-analyzer")
    return skillOutputSchema.extend({
      interview: skillOutputSchema.shape.interview.unwrap(),
    });
  if (id === "fde-gap-finder")
    return skillOutputSchema.extend({
      gaps: skillOutputSchema.shape.gaps.unwrap(),
    });
  if (id === "fde-scenario-evaluator")
    return skillOutputSchema.extend({
      scenarioEvaluations: skillOutputSchema.shape.scenarioEvaluations
        .unwrap()
        .min(1),
    });
  if (id === "fde-stage-review")
    return skillOutputSchema.extend({
      stageReview: skillOutputSchema.shape.stageReview.unwrap(),
    });
  if (id === "fde-next-action")
    return skillOutputSchema.extend({
      actions: z
        .array(
          actionSchema.extend({
            priority: z.enum(["P0", "P1", "P2"]),
            prerequisites: z.array(z.string().min(1)).max(8),
            skillId: z.string().min(1),
            dependsOnTaskIds: z.array(z.string()).max(12),
          }),
        )
        .max(6),
    });
  if (id === "fde-deliverable-builder")
    return skillOutputSchema.extend({
      deliverables: z
        .array(
          z.object({
            title: z.string().trim().min(1).max(200),
            content: z.string().trim().min(10).max(10000),
            sourceIds: z.array(z.string()).min(1).max(20),
            decisionIds: z.array(z.string()).min(1).max(20),
          }),
        )
        .min(1)
        .max(3),
    });
  return skillOutputSchema;
}
export function validateSkillOutput(
  skillId: string,
  raw: unknown,
  project: WorkProject,
  analysis: Analysis,
): SkillOutput {
  const output = outputSchemaFor(skillId).parse(raw);
  const sources = new Map(project.sources.map((s) => [s.id, s]));
  const references = new Set(evidenceOptions(project).map((e) => e.id));
  const validQuote = (id: string, quote: string) =>
    quote.trim().length >= 4 && sources.get(id)?.text.includes(quote);
  if (
    output.facts.some((f) => !validQuote(f.sourceId, f.quote)) ||
    output.interview?.stakeholders.some((s) => !validQuote(s.sourceId, s.quote))
  )
    throw new Error("质量检查失败：事实或责任人缺少逐字原文证据");
  for (const gap of output.gaps || []) {
    if (
      gap.sourceIds.some((id) => !sources.has(id)) ||
      (gap.issueId &&
        !project.issues?.some((issue) => issue.id === gap.issueId))
    )
      throw new Error("质量检查失败：信息缺口引用了未知资料或问题");
  }
  for (const action of output.actions) {
    if (
      action.skillId &&
      (!findWorkSkill(action.skillId) ||
        canonicalSkillId(action.skillId) === "fde-deliverable-builder")
    )
      throw new Error("质量检查失败：行动推荐了不可直接执行的 Skill");
    if (
      action.dependsOnTaskIds?.some(
        (id) => !project.tasks.some((task) => task.id === id),
      )
    )
      throw new Error("质量检查失败：任务依赖不属于当前项目");
    if (action.skillId) action.skillId = canonicalSkillId(action.skillId);
  }
  for (const scenario of output.scenarioEvaluations || [])
    for (const dimension of [
      scenario.value,
      scenario.technicalDifficulty,
      scenario.dataReadiness,
      scenario.organizationalResistance,
      scenario.risk,
    ]) {
      if (
        dimension.evidenceIds.some((id) => !references.has(id)) ||
        (dimension.rating !== null && !dimension.evidenceIds.length)
      )
        throw new Error(
          "质量检查失败：场景评分必须有当前项目的证据，缺证据时分数应为 null",
        );
    }
  if (output.stageReview) {
    const review = output.stageReview;
    const criteria = stages.find((s) => s.id === analysis.stage)!.criteria;
    if (
      review.stage !== analysis.stage ||
      review.criteria.length !== criteria.length ||
      new Set(review.criteria.map((c) => c.criterionId)).size !==
        criteria.length ||
      review.criteria.some(
        (c) =>
          !criteria.some((k) => k.id === c.criterionId) ||
          c.evidenceIds.some((id) => !references.has(id)) ||
          (c.status === "supported" && !c.evidenceIds.length),
      )
    )
      throw new Error("质量检查失败：阶段检查必须逐项对应真实标准与证据");
    const blockers = gateBlockers(project, analysis.stage);
    review.blockers = [...new Set([...blockers, ...review.blockers])];
    if (
      blockers.length ||
      review.criteria.some((c) => c.status !== "supported")
    )
      review.advice = "stay";
  }
  if (canonicalSkillId(skillId) === "fde-deliverable-builder") {
    if (
      !analysis.approvalId ||
      !project.decisions.some((d) => d.id === analysis.approvalId)
    )
      throw new Error("交付文档生成缺少人工审批记录");
    for (const doc of output.deliverables)
      if (
        doc.sourceIds?.some((id) => !sources.has(id)) ||
        doc.decisionIds?.some(
          (id) => !project.decisions.some((d) => d.id === id),
        ) ||
        !doc.decisionIds?.includes(analysis.approvalId)
      )
        throw new Error("质量检查失败：交付文档必须关联真实资料与本次人工审批");
  }
  return output;
}
