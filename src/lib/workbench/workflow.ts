import { type Analysis, type WorkProject } from "./model";
import { planSkills } from "./skills";

export const ANALYSIS_TIMEOUT_MS = 10 * 60_000;
export const documentTypes = [
  "访谈纪要",
  "项目诊断表",
  "场景评估报告",
  "AI落地方案",
  "阶段验收报告",
  "行动计划",
] as const;
export function plannedAnalysis(
  project: WorkProject,
  sourceId: string,
  intent: string,
  overrides: string[] = [],
  trigger: Analysis["trigger"] = "source.analyzed",
): Analysis {
  const source = project.sources.find((s) => s.id === sourceId);
  if (!source) throw new Error("资料不存在");
  const at = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    protocolVersion: 2,
    purpose: "analysis",
    sourceId,
    stage: project.currentStage,
    stageRevision: project.stageRevision || 0,
    intent,
    status: "running",
    createdAt: at,
    trigger,
    runs: planSkills(
      intent + "\n" + source.text,
      project.currentStage,
      overrides,
    ).map((run) => ({ ...run, status: "queued", startedAt: at })),
  };
}
export function enqueueDocument(
  project: WorkProject,
  approvalId: string,
  actor: string,
  documentType: string = "行动计划",
  sourceId?: string,
) {
  if (project.analyses.some((a) => a.status === "running"))
    throw new Error("请等待当前分析或文档生成完成");
  if (!project.decisions.some((d) => d.id === approvalId))
    throw new Error("生成文档前必须有人工确认");
  const source =
    project.sources.find((s) => s.id === sourceId) || project.sources.at(-1);
  if (!source) throw new Error("请先保存项目资料");
  const at = new Date().toISOString();
  project.analyses.unshift({
    id: crypto.randomUUID(),
    protocolVersion: 2,
    purpose: "deliverable",
    sourceId: source.id,
    stage: project.currentStage,
    stageRevision: project.stageRevision || 0,
    intent: "根据人工审批与项目记忆生成" + documentType,
    status: "running",
    createdAt: at,
    approvalId,
    actor,
    documentType,
    trigger: "approval.recorded",
    runs: [
      {
        skillId: "fde-deliverable-builder",
        phase: 0,
        dependsOn: [],
        status: "queued",
        startedAt: at,
      },
    ],
  });
}
export function enqueueTaskReview(project: WorkProject) {
  const source = project.sources.at(-1);
  if (!source) return;
  if (project.analyses.some((a) => a.status === "running")) {
    project.pendingTaskReview = true;
    return;
  }
  project.pendingTaskReview = false;
  project.analyses.unshift(
    plannedAnalysis(
      project,
      source.id,
      "任务已完成，结合当前任务与未解决问题重新规划下一步",
      ["fde-next-action"],
      "task.completed",
    ),
  );
}
