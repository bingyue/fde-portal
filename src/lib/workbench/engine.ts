import { z } from "zod";
import {
  evidenceOptions,
  gateBlockers,
  stageIds,
  stages,
  type WorkProject,
} from "./model";

const actor = z.string().trim().min(1, "请填写确认人").max(100);
const reason = z.string().trim().min(2, "请说明判断依据").max(3000);
export const commandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("facts"),
    actor,
    reason,
    factIds: z.array(z.string()).min(1).max(40),
    status: z.enum(["confirmed", "rejected"]),
  }),
  z.object({
    type: z.literal("actions"),
    actor,
    reason,
    analysisId: z.string(),
    actions: z
      .array(
        z.object({
          title: z.string().trim().min(2).max(300),
          owner: actor,
          stage: z.enum(stageIds),
          blocking: z.boolean(),
        }),
      )
      .min(1)
      .max(12),
  }),
  z.object({
    type: z.literal("task"),
    actor,
    reason,
    taskId: z.string(),
    status: z.enum(["todo", "doing", "done"]),
    evidenceId: z.string().optional(),
  }),
  z.object({
    type: z.literal("gate"),
    actor,
    reason,
    stage: z.enum(stageIds),
    criterionId: z.string(),
    evidenceId: z.string(),
  }),
  z.object({ type: z.literal("advance"), actor, reason }),
  z.object({
    type: z.literal("rollback"),
    actor,
    reason,
    stage: z.enum(stageIds),
  }),
]);
export type Command = z.infer<typeof commandSchema>;

export function applyCommand(
  project: WorkProject,
  command: Command,
): WorkProject {
  const result = structuredClone(project);
  const at = new Date().toISOString();
  const log = (
    kind: WorkProject["decisions"][number]["kind"],
    references: string[],
    outcome?: string,
  ) =>
    result.decisions.unshift({
      id: crypto.randomUUID(),
      kind,
      actor: command.actor,
      reason: command.reason,
      references,
      at,
      outcome,
    });
  const evidenceExists = (id?: string) =>
    Boolean(
      id && evidenceOptions(result).some((evidence) => evidence.id === id),
    );
  if (command.type === "facts") {
    const facts = command.factIds.map((id) =>
      result.facts.find((fact) => fact.id === id),
    );
    if (
      facts.some(
        (fact) =>
          !fact ||
          (fact.status !== "proposed" &&
            !(command.status === "rejected" && fact.status === "confirmed")),
      )
    )
      throw new Error("事实状态已变化，请刷新后重试");
    const retracting = facts.some((fact) => fact?.status === "confirmed");
    for (const fact of facts)
      Object.assign(fact!, {
        status: command.status,
        confirmedBy: command.actor,
        confirmedAt: at,
      });
    if (retracting) {
      let earliest = stageIds.indexOf(result.currentStage);
      for (const stage of stageIds) {
        const checks = result.gates[stage] || [];
        if (
          checks.some((check) => command.factIds.includes(check.evidenceId))
        ) {
          earliest = Math.min(earliest, stageIds.indexOf(stage));
          result.gates[stage] = checks.filter(
            (check) => !command.factIds.includes(check.evidenceId),
          );
        }
      }
      for (const task of result.tasks)
        if (task.evidenceId && command.factIds.includes(task.evidenceId)) {
          task.status = "todo";
          task.evidenceId = undefined;
          task.completionNote = "完成证据已撤回，需要重新核实";
          if (task.blocking)
            earliest = Math.min(earliest, stageIds.indexOf(task.stage));
        }
      if (
        earliest < stageIds.indexOf(result.currentStage) ||
        result.completedStages.includes(stageIds[earliest])
      ) {
        result.currentStage = stageIds[earliest];
        result.completedStages = result.completedStages.filter(
          (stage) => stageIds.indexOf(stage) < earliest,
        );
        for (const stage of stageIds.slice(earliest))
          delete result.gates[stage];
      }
      result.stageRevision = (result.stageRevision || 0) + 1;
    }
    log(
      "fact",
      command.factIds,
      command.status === "confirmed"
        ? "事实确认为准确"
        : retracting
          ? "撤回已确认事实，相关证据需要重新核实"
          : "否决 AI 提取的事实",
    );
  }
  if (command.type === "actions") {
    const analysis = result.analyses.find(
      (item) => item.id === command.analysisId,
    );
    if (!analysis?.judgment || analysis.status !== "completed")
      throw new Error("分析尚未完成");
    if (analysis.actionsConfirmedAt)
      throw new Error("该行动建议已执行，不会重复创建任务");
    if (result.completedStages.includes(result.currentStage))
      throw new Error("项目已验收，请先退回阶段再追加行动");
    if ((analysis.stageRevision || 0) !== (result.stageRevision || 0))
      throw new Error("项目阶段或事实依据发生变化，请重新分析后确认");
    if (analysis.stage !== result.currentStage)
      throw new Error("阶段已变化，请基于当前阶段重新分析后确认");
    const tasks = command.actions.map((action) => ({
      ...action,
      id: crypto.randomUUID(),
      status: "todo" as const,
      analysisId: analysis.id,
    }));
    result.tasks.push(...tasks);
    for (const document of analysis.judgment.deliverables) {
      const version =
        Math.max(
          0,
          ...result.assets
            .filter((asset) => asset.title === document.title)
            .map((asset) => asset.version),
        ) + 1;
      result.assets.push({
        ...document,
        id: crypto.randomUUID(),
        version,
        stage: analysis.stage,
        sourceIds: [analysis.sourceId],
        analysisId: analysis.id,
        createdAt: at,
        approvedBy: command.actor,
      });
    }
    analysis.actionsConfirmedAt = at;
    analysis.actor = command.actor;
    log(
      "action",
      [analysis.id, ...tasks.map((task) => task.id)],
      `创建 ${tasks.length} 项任务，归档 ${analysis.judgment.deliverables.length} 份交付物`,
    );
  }
  if (command.type === "task") {
    const task = result.tasks.find((item) => item.id === command.taskId);
    if (!task) throw new Error("任务不存在");
    if (command.status === "done" && !evidenceExists(command.evidenceId))
      throw new Error("完成任务必须关联真实资料、已确认事实或交付资产");
    task.status = command.status;
    task.evidenceId =
      command.status === "done" ? command.evidenceId : undefined;
    task.completionNote = command.reason;
    // Reopening a blocking task revokes its stage approval and all downstream approvals.
    if (
      command.status !== "done" &&
      task.blocking &&
      result.completedStages.includes(task.stage)
    ) {
      const index = stageIds.indexOf(task.stage);
      result.completedStages = result.completedStages.filter(
        (stage) => stageIds.indexOf(stage) < index,
      );
      result.currentStage = task.stage;
      result.stageRevision = (result.stageRevision || 0) + 1;
      for (const stage of stageIds.slice(index)) delete result.gates[stage];
    }
    log(
      "task",
      [task.id, ...(task.evidenceId ? [task.evidenceId] : [])],
      `${task.title} → ${{ todo: "待办", doing: "进行中", done: "已完成" }[command.status]}`,
    );
  }
  if (command.type === "gate") {
    if (command.stage !== result.currentStage)
      throw new Error("仅能确认当前阶段的完成条件");
    if (
      !stages
        .find((stage) => stage.id === command.stage)!
        .criteria.some((criterion) => criterion.id === command.criterionId)
    )
      throw new Error("完成条件不存在");
    if (!evidenceExists(command.evidenceId)) throw new Error("请关联有效证据");
    result.gates[command.stage] = [
      ...(result.gates[command.stage] || []).filter(
        (check) => check.criterionId !== command.criterionId,
      ),
      {
        criterionId: command.criterionId,
        evidenceId: command.evidenceId,
        actor: command.actor,
        reason: command.reason,
        at,
      },
    ];
    log("evidence", [command.stage, command.criterionId, command.evidenceId]);
  }
  if (command.type === "advance") {
    if (result.completedStages.includes(result.currentStage))
      throw new Error("当前阶段已经完成");
    if (result.analyses.some((analysis) => analysis.status === "running"))
      throw new Error("请等待当前分析完成后再确认阶段");
    const blockers = gateBlockers(result);
    if (blockers.length) throw new Error(`尚不能推进：${blockers.join("；")}`);
    const previous = result.currentStage;
    result.completedStages.push(previous);
    result.currentStage =
      stageIds[Math.min(stageIds.indexOf(previous) + 1, stageIds.length - 1)];
    result.stageRevision = (result.stageRevision || 0) + 1;
    log("stage", [previous, result.currentStage]);
  }
  if (command.type === "rollback") {
    if (
      stageIds.indexOf(command.stage) >=
        stageIds.indexOf(result.currentStage) &&
      !result.completedStages.includes(command.stage)
    )
      throw new Error("只能退回已到达的阶段");
    const index = stageIds.indexOf(command.stage);
    result.completedStages = result.completedStages.filter(
      (stage) => stageIds.indexOf(stage) < index,
    );
    for (const stage of stageIds.slice(index)) delete result.gates[stage];
    const previous = result.currentStage;
    result.currentStage = command.stage;
    result.stageRevision = (result.stageRevision || 0) + 1;
    log("rollback", [previous, command.stage]);
  }
  return result;
}
