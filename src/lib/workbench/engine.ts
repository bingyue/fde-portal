import { z } from "zod";
import {
  evidenceOptions,
  actionSchema,
  gateBlockers,
  stageIds,
  stages,
  type WorkProject,
} from "./model";
import { canonicalSkillId, findWorkSkill } from "./skills";
import { documentTypes, enqueueDocument, enqueueTaskReview } from "./workflow";

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
    actions: z.array(actionSchema).min(1).max(12),
    generateDocument: z.boolean().optional(),
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
    type: z.literal("issue"),
    actor,
    reason,
    issueId: z.string(),
    status: z.enum(["open", "resolved"]),
    evidenceId: z.string().optional(),
    priority: z.enum(["P0", "P1", "P2"]).optional(),
  }),
  z.object({
    type: z.literal("build-document"),
    actor,
    reason,
    documentType: z.enum(documentTypes),
  }),
  z.object({
    type: z.literal("approve-asset"),
    actor,
    reason,
    assetId: z.string(),
  }),
  z.object({
    type: z.literal("revise-asset"),
    actor,
    reason,
    assetId: z.string(),
    content: z.string().trim().min(10).max(10000),
  }),
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
      const invalidTasks = new Set(
        result.tasks
          .filter((t) => t.completionNote === "完成证据已撤回，需要重新核实")
          .map((t) => t.id),
      );
      let changed = true;
      while (changed) {
        changed = false;
        for (const task of result.tasks)
          if (
            !invalidTasks.has(task.id) &&
            task.dependsOnTaskIds?.some((id) => invalidTasks.has(id))
          ) {
            invalidTasks.add(task.id);
            task.status = "todo";
            task.evidenceId = undefined;
            task.completionNote = "前置任务的证据已撤回，需要重新核实";
            if (task.blocking)
              earliest = Math.min(earliest, stageIds.indexOf(task.stage));
            changed = true;
          }
      }
      for (const issue of result.issues || [])
        if (
          issue.status === "resolved" &&
          issue.evidenceId &&
          command.factIds.includes(issue.evidenceId)
        ) {
          issue.status = "open";
          issue.evidenceId = undefined;
          issue.resolution = "核实证据已撤回，需要重新核实";
          issue.updatedAt = at;
          if (issue.priority === "P0" && issue.stage)
            earliest = Math.min(earliest, stageIds.indexOf(issue.stage));
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
    if (analysis.purpose === "deliverable")
      throw new Error("交付文档请在资产区审核");
    if (result.analyses.some((a) => a.status === "running"))
      throw new Error("请等待当前分析或文档生成完成");
    if (analysis.actionsConfirmedAt)
      throw new Error("该行动建议已执行，不会重复创建任务");
    if (result.completedStages.includes(result.currentStage))
      throw new Error("项目已验收，请先退回阶段再追加行动");
    if ((analysis.stageRevision || 0) !== (result.stageRevision || 0))
      throw new Error("项目阶段或事实依据发生变化，请重新分析后确认");
    if (analysis.stage !== result.currentStage)
      throw new Error("阶段已变化，请基于当前阶段重新分析后确认");
    for (const action of command.actions) {
      if (
        analysis.protocolVersion === 2 &&
        result.tasks.some(
          (t) => t.status !== "done" && t.title.trim() === action.title.trim(),
        )
      )
        throw new Error("已有同名开放任务，请调整行动或复用现有任务");
      if (
        action.dependsOnTaskIds?.some(
          (id) => !result.tasks.some((t) => t.id === id),
        )
      )
        throw new Error("任务依赖不属于当前项目");
      if (
        action.skillId &&
        (!findWorkSkill(action.skillId) ||
          canonicalSkillId(action.skillId) === "fde-deliverable-builder")
      )
        throw new Error("行动对应的 Skill 无效");
      if (action.blocking && result.completedStages.includes(action.stage))
        throw new Error("请先退回对应阶段，再追加阻塞任务");
    }
    if (
      new Set(command.actions.map((a) => a.title.trim())).size !==
      command.actions.length
    )
      throw new Error("行动标题重复，请合并后确认");
    const tasks = command.actions.map((action) => ({
      ...action,
      id: crypto.randomUUID(),
      status: "todo" as const,
      analysisId: analysis.id,
    }));
    result.tasks.push(...tasks);
    for (const document of analysis.protocolVersion === 2
      ? []
      : analysis.judgment.deliverables) {
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
      `创建 ${tasks.length} 项任务${analysis.protocolVersion === 2 ? "，后续交付文档需审核" : `，归档 ${analysis.judgment.deliverables.length} 份交付物`}`,
    );
    if (analysis.protocolVersion === 2 && command.generateDocument !== false)
      enqueueDocument(
        result,
        result.decisions[0].id,
        command.actor,
        "行动计划",
        analysis.sourceId,
      );
  }
  if (command.type === "task") {
    const task = result.tasks.find((item) => item.id === command.taskId);
    if (!task) throw new Error("任务不存在");
    if (task.status === command.status)
      throw new Error("任务状态未变化，请刷新后重试");
    if (
      command.status !== "todo" &&
      task.dependsOnTaskIds?.some(
        (id) => result.tasks.find((t) => t.id === id)?.status !== "done",
      )
    )
      throw new Error("请先完成前置依赖任务");
    if (command.status === "done" && !evidenceExists(command.evidenceId))
      throw new Error("完成任务必须关联真实资料、已确认事实或交付资产");
    task.status = command.status;
    task.evidenceId =
      command.status === "done" ? command.evidenceId : undefined;
    task.completionNote = command.reason;
    if (command.status !== "done") {
      const invalid = new Set([task.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const dependent of result.tasks)
          if (
            !invalid.has(dependent.id) &&
            dependent.dependsOnTaskIds?.some((id) => invalid.has(id))
          ) {
            invalid.add(dependent.id);
            dependent.status = "todo";
            dependent.evidenceId = undefined;
            dependent.completionNote = "前置任务重新打开，需重新核实";
            changed = true;
          }
      }
      const reached = result.tasks
        .filter(
          (t) =>
            invalid.has(t.id) &&
            t.blocking &&
            result.completedStages.includes(t.stage),
        )
        .map((t) => stageIds.indexOf(t.stage));
      if (reached.length) {
        const earliest = Math.min(...reached);
        result.currentStage = stageIds[earliest];
        result.completedStages = result.completedStages.filter(
          (s) => stageIds.indexOf(s) < earliest,
        );
        for (const s of stageIds.slice(earliest)) delete result.gates[s];
        result.stageRevision = (result.stageRevision || 0) + 1;
      }
    }
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
    result.stageRevision = (result.stageRevision || 0) + 1;
    if (command.status === "done") enqueueTaskReview(result);
  }
  if (command.type === "issue") {
    const issue = result.issues?.find((i) => i.id === command.issueId);
    if (!issue) throw new Error("问题不存在");
    if (command.status === "resolved" && !evidenceExists(command.evidenceId))
      throw new Error("关闭问题需要关联核实证据");
    Object.assign(issue, {
      status: command.status,
      priority: command.priority || issue.priority,
      evidenceId:
        command.status === "resolved" ? command.evidenceId : undefined,
      resolution: command.reason,
      resolvedBy: command.actor,
      updatedAt: at,
    });
    if (
      command.status === "open" &&
      issue.priority === "P0" &&
      issue.stage &&
      result.completedStages.includes(issue.stage)
    ) {
      const index = stageIds.indexOf(issue.stage);
      result.currentStage = issue.stage;
      result.completedStages = result.completedStages.filter(
        (s) => stageIds.indexOf(s) < index,
      );
      for (const s of stageIds.slice(index)) delete result.gates[s];
    }
    result.stageRevision = (result.stageRevision || 0) + 1;
    log(
      "issue",
      [issue.id, ...(issue.evidenceId ? [issue.evidenceId] : [])],
      command.status === "resolved" ? "问题经人工核实关闭" : "开放问题已更新",
    );
  }
  if (command.type === "build-document") {
    if (
      !result.decisions.some((d) =>
        ["fact", "action", "stage"].includes(d.kind),
      )
    )
      throw new Error("请先确认项目事实、行动或阶段，再生成文档");
    log("document", [], `申请生成：${command.documentType}`);
    enqueueDocument(
      result,
      result.decisions[0].id,
      command.actor,
      command.documentType,
    );
  }
  if (command.type === "approve-asset") {
    const asset = result.assets.find((a) => a.id === command.assetId);
    if (!asset || asset.reviewStatus !== "draft")
      throw new Error("仅可审核待确认的交付草稿");
    asset.reviewStatus = "approved";
    asset.approvedBy = command.actor;
    log("document", [asset.id], `审核通过：${asset.title} v${asset.version}`);
  }
  if (command.type === "revise-asset") {
    const asset = result.assets.find((a) => a.id === command.assetId);
    if (!asset) throw new Error("交付资产不存在");
    const next = {
      ...asset,
      id: crypto.randomUUID(),
      content: command.content,
      version:
        Math.max(
          ...result.assets
            .filter((a) => a.title === asset.title)
            .map((a) => a.version),
        ) + 1,
      createdAt: at,
      approvedBy: "",
      reviewStatus: "draft" as const,
    };
    result.assets.push(next);
    log(
      "document",
      [asset.id, next.id],
      `人工修订：${asset.title} v${next.version}，待审核`,
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
