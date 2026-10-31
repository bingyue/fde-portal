import { describe, expect, it } from "vitest";
import { applyCommand, commandSchema } from "./engine";
import { createProject, gateBlockers, type WorkProject } from "./model";
import { routeSkills } from "./skills";

const audit = { actor: "FDE 测试员", reason: "已与业务负责人逐项核对证据" };
function project(): WorkProject {
  const p = createProject({
    name: "测试项目",
    organization: "测试企业",
    goal: "验证证据与人工审批流程",
    owner: audit.actor,
  });
  p.sources.push({
    id: "source-1",
    title: "访谈纪要",
    text: "业务负责人张三，当前单次查询需要十五分钟。",
    kind: "note",
    createdAt: p.createdAt,
  });
  p.facts.push({
    id: "fact-1",
    text: "单次查询耗时十五分钟",
    quote: "单次查询需要十五分钟",
    sourceId: "source-1",
    status: "proposed",
    analysisId: "analysis-1",
  });
  p.analyses.push({
    id: "analysis-1",
    sourceId: "source-1",
    stage: "launch",
    status: "completed",
    createdAt: p.createdAt,
    intent: "下一步",
    runs: [],
    judgment: {
      summary: "需补充样本",
      missing: ["查询样本"],
      contradictions: [],
      recommendation: "收集真实样本",
      suggestedStage: "interview",
      actions: [
        {
          title: "收集查询样本",
          owner: "业务负责人",
          stage: "launch",
          blocking: true,
        },
      ],
      deliverables: [
        {
          title: "访谈提纲",
          content: "请展示最近一次查询，记录开始、结束时间及异常。",
        },
      ],
    },
  });
  return p;
}
function acceptActions(p: WorkProject) {
  return applyCommand(p, {
    type: "actions",
    analysisId: "analysis-1",
    actions: p.analyses[0].judgment!.actions,
    ...audit,
  });
}
function confirmGates(p: WorkProject) {
  for (const criterionId of ["brief", "sponsor"])
    p = applyCommand(p, {
      type: "gate",
      stage: "launch",
      criterionId,
      evidenceId: "source-1",
      ...audit,
    });
  return p;
}
describe("FDE Workbench human decisions and stage gates", () => {
  it("keeps fact, action and stage confirmations independent", () => {
    const initial = project();
    const facts = applyCommand(initial, {
      type: "facts",
      factIds: ["fact-1"],
      status: "confirmed",
      ...audit,
    });
    expect(initial.facts[0].status).toBe("proposed");
    expect(facts.tasks).toHaveLength(0);
    const actions = acceptActions(facts);
    expect(actions.currentStage).toBe("launch");
    expect(actions.tasks[0].status).toBe("todo");
    expect(actions.assets[0].version).toBe(1);
    expect(actions.decisions.map((d) => d.kind)).toEqual(["action", "fact"]);
    expect(gateBlockers(actions)).toHaveLength(3);
  });
  it("does not confirm facts by executing AI recommendations", () => {
    expect(acceptActions(project()).facts[0].status).toBe("proposed");
  });
  it("rejects advancing without evidence and forged evidence identifiers", () => {
    expect(() =>
      applyCommand(project(), { type: "advance", ...audit }),
    ).toThrow("尚不能推进");
    expect(() =>
      applyCommand(project(), {
        type: "gate",
        stage: "launch",
        criterionId: "brief",
        evidenceId: "invented",
        ...audit,
      }),
    ).toThrow("有效证据");
    expect(() =>
      applyCommand(project(), {
        type: "gate",
        stage: "launch",
        criterionId: "brief",
        evidenceId: "fact-1",
        ...audit,
      }),
    ).toThrow("有效证据");
  });
  it("blocks advancement until tasks have actual completion evidence", () => {
    let p = confirmGates(acceptActions(project()));
    expect(() => applyCommand(p, { type: "advance", ...audit })).toThrow(
      "阻塞任务",
    );
    expect(() =>
      applyCommand(p, {
        type: "task",
        taskId: p.tasks[0].id,
        status: "done",
        ...audit,
      }),
    ).toThrow("真实资料");
    p = applyCommand(p, {
      type: "task",
      taskId: p.tasks[0].id,
      status: "done",
      evidenceId: "source-1",
      ...audit,
    });
    expect(p.analyses[0].trigger).toBe("task.completed");
    expect(() => applyCommand(p, { type: "advance", ...audit })).toThrow(
      "等待当前分析",
    );
    p.analyses[0].status = "completed";
    p = applyCommand(p, { type: "advance", ...audit });
    expect(p.currentStage).toBe("interview");
    expect(p.completedStages).toEqual(["launch"]);
  });
  it("rejects duplicate action acceptance and keeps asset versions", () => {
    let p = acceptActions(project());
    expect(() => acceptActions(p)).toThrow("不会重复");
    p.analyses.unshift({
      ...p.analyses[0],
      id: "analysis-2",
      actionsConfirmedAt: undefined,
    });
    p = applyCommand(p, {
      type: "actions",
      analysisId: "analysis-2",
      actions: p.analyses[0].judgment!.actions,
      ...audit,
    });
    expect(p.assets.map((asset) => asset.version)).toEqual([1, 2]);
  });
  it("rolls back approvals and evidence while preserving history and assets", () => {
    let p = acceptActions(project());
    p.currentStage = "poc";
    p.completedStages = [
      "launch",
      "interview",
      "diagnosis",
      "value",
      "solution",
    ];
    p.gates.solution = [
      {
        criterionId: "architecture",
        evidenceId: "source-1",
        ...audit,
        at: p.createdAt,
      },
    ];
    p = applyCommand(p, { type: "rollback", stage: "diagnosis", ...audit });
    expect(p.completedStages).toEqual(["launch", "interview"]);
    expect(p.gates.solution).toBeUndefined();
    expect(p.assets).toHaveLength(1);
    expect(p.sources).toHaveLength(1);
    expect(p.decisions[0].kind).toBe("rollback");
    expect(() =>
      applyCommand(p, { type: "rollback", stage: "production", ...audit }),
    ).toThrow("只能退回");
  });
  it("reopening a blocking task invalidates downstream approvals", () => {
    let p = acceptActions(project());
    p.tasks[0].status = "done";
    p.currentStage = "diagnosis";
    p.completedStages = ["launch", "interview"];
    p = applyCommand(p, {
      type: "task",
      taskId: p.tasks[0].id,
      status: "doing",
      ...audit,
    });
    expect(p.currentStage).toBe("launch");
    expect(p.completedStages).toEqual([]);
    expect(p.decisions[0].outcome).toContain("进行中");
  });
  it("rejects old analysis after leaving and returning to the same stage", () => {
    let p = confirmGates(project());
    p = applyCommand(p, { type: "advance", ...audit });
    p = applyCommand(p, { type: "rollback", stage: "launch", ...audit });
    expect(() => acceptActions(p)).toThrow("重新分析");
  });
  it("allows parallel future-stage tasks without blocking the current stage", () => {
    let p = project();
    p.analyses[0].judgment!.actions[0].stage = "interview";
    p = confirmGates(acceptActions(p));
    p = applyCommand(p, { type: "advance", ...audit });
    expect(p.currentStage).toBe("interview");
    expect(gateBlockers(p)).toContain("阻塞任务未完成：收集查询样本");
  });
  it("requires an actor and meaningful rationale", () => {
    expect(
      commandSchema.safeParse({ type: "advance", actor: "", reason: "" })
        .success,
    ).toBe(false);
  });
  it("retracting a confirmed fact revokes dependent stage approvals", () => {
    let p = applyCommand(project(), {
      type: "facts",
      factIds: ["fact-1"],
      status: "confirmed",
      ...audit,
    });
    p = applyCommand(p, {
      type: "gate",
      stage: "launch",
      criterionId: "brief",
      evidenceId: "fact-1",
      ...audit,
    });
    p = applyCommand(p, {
      type: "gate",
      stage: "launch",
      criterionId: "sponsor",
      evidenceId: "source-1",
      ...audit,
    });
    p = applyCommand(p, { type: "advance", ...audit });
    p = applyCommand(p, {
      type: "facts",
      factIds: ["fact-1"],
      status: "rejected",
      ...audit,
    });
    expect(p.currentStage).toBe("launch");
    expect(p.completedStages).toEqual([]);
    expect(p.facts[0].status).toBe("rejected");
    expect(p.decisions[0].outcome).toContain("撤回");
  });
  it("routes only registered skills, respects user choices, limits fan-out", () => {
    expect(routeSkills("访谈：生产排产与数据质量问题", "launch")).toEqual([
      "fde-interview-analyzer",
      "process-diagnosis",
      "data-assessment",
      "fde-gap-finder",
      "fde-scenario-evaluator",
      "fde-stage-review",
      "fde-next-action",
    ]);
    expect(routeSkills("访谈记录", "launch", ["roi-analysis"])).toEqual([
      "fde-interview-analyzer",
      "roi-analysis",
      "fde-gap-finder",
      "fde-stage-review",
      "fde-next-action",
    ]);
    expect(() => routeSkills("", "launch", ["../../other"])).toThrow();
  });
});
