import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProject,
  evidenceOptions,
  type SkillOutput,
  type WorkProject,
} from "./model";
import { readProject, writeProject } from "./repository";
import { beginAnalysis, runAnalysis, verifiedFacts } from "./runner";
import { applyCommand } from "./engine";

const config = vi.hoisted(() => ({ configured: true }));
vi.mock("../ai/config-store", () => ({
  readDeepSeekConfig: async () => ({
    config: config.configured
      ? {
          apiKey: "unit-test-only",
          baseUrl: "https://unit-test.invalid",
          model: "test",
        }
      : null,
  }),
}));
let directory: string;
let project: WorkProject;
function output(): SkillOutput {
  return {
    summary: "访谈显示查询耗时较长",
    facts: [
      {
        text: "当前查询需要十五分钟",
        sourceId: project.sources[0].id,
        quote: "单次查询需要十五分钟",
      },
    ],
    missing: ["需要业务样本"],
    contradictions: [],
    recommendation: "先核实基线，暂不进入PoC",
    suggestedStage: "interview",
    actions: [
      {
        title: "采集查询样本",
        owner: "业务方",
        stage: "launch",
        blocking: true,
      },
    ],
    deliverables: [
      {
        title: "资料采集清单",
        content: "收集最近十次查询记录，标注耗时、来源和异常；先取得数据授权。",
      },
    ],
  };
}
function mockGateway(gapPriority: "P0" | "P1" | "P2" = "P0") {
  return vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const request = JSON.parse(init!.body as string);
    const context = JSON.parse(request.messages.at(-1).content);
    const skill = request.messages[0].content.match(/本次只执行 ([a-z-]+)/)[1];
    const value = output();
    value.deliverables = [];
    value.actions = context.tasks.some(
      (t: { title: string; status: string }) =>
        t.title === value.actions[0].title && t.status !== "done",
    )
      ? []
      : value.actions.map((a) => ({
          ...a,
          priority: "P0",
          prerequisites: ["取得样本授权"],
          skillId: "data-assessment",
          dependsOnTaskIds: [],
        }));
    if (skill === "fde-interview-analyzer")
      value.interview = {
        businessGoals: ["缩短查询耗时"],
        painPoints: ["缺少统一入口"],
        unverifiedClaims: [],
        stakeholders: [],
      };
    if (skill === "fde-gap-finder")
      value.gaps = [
        {
          topic: "baseline",
          question: "实际查询耗时是多少？",
          why: "需要量化基线",
          askWho: "业务负责人",
          priority: gapPriority,
          sourceIds: [context.source.id],
          ...(context.openIssues[0]
            ? { issueId: context.openIssues[0].id }
            : {}),
        },
      ];
    if (skill === "fde-stage-review")
      value.stageReview = {
        stage: context.stage.id,
        criteria: context.stage.criteria.map((c: { id: string }) => ({
          criterionId: c.id,
          status: "supported",
          evidenceIds: [context.source.id],
          reason: "资料有部分支撑，等待人工核实",
        })),
        blockers: [],
        advice: "review-ready",
      };
    if (skill === "fde-deliverable-builder")
      value.deliverables = [
        {
          title: "行动计划",
          content:
            "# 行动计划\n\n依据人工审批收集样本，记录耗时，负责人仍需确认。",
          sourceIds: [context.source.id],
          decisionIds: [context.approval.id],
        },
      ];
    return Response.json({
      choices: [
        { finish_reason: "stop", message: { content: JSON.stringify(value) } },
      ],
    });
  });
}
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "fde-runner-test-"));
  vi.stubEnv("FDE_DATA_DIR", directory);
  config.configured = true;
  project = createProject({
    name: "测试企业项目",
    organization: "测试企业",
    goal: "查询效率问题诊断",
    owner: "测试 FDE",
  });
  project.sources.push({
    id: crypto.randomUUID(),
    title: "真实访谈",
    text: "客服主管说：单次查询需要十五分钟，缺少统一入口。",
    kind: "note",
    createdAt: project.createdAt,
  });
  await writeProject(project);
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("structured Skill execution", () => {
  it("keeps files saved when DeepSeek is not configured", async () => {
    config.configured = false;
    await expect(
      beginAnalysis(project.id, project.sources[0].id, "判断下一步", [], 0),
    ).rejects.toThrow("资料已经保存");
    expect((await readProject(project.id)).sources).toHaveLength(1);
  });
  it("accepts only exact source quotations", () => {
    const value = output();
    expect(verifiedFacts(value, project)).toHaveLength(1);
    value.facts[0].quote = "系统已经通过全部测试";
    expect(verifiedFacts(value, project)).toEqual([]);
    value.facts[0].sourceId = "other-project";
    value.facts[0].quote = "单次查询需要十五分钟";
    expect(verifiedFacts(value, project)).toEqual([]);
  });
  it("loads selected skills and completes a real gateway call without auto-approving", async () => {
    const fetcher = mockGateway();
    vi.stubGlobal("fetch", fetcher);
    const started = await beginAnalysis(
      project.id,
      project.sources[0].id,
      "判断下一步",
      ["interview-analysis", "fde-questioning"],
      0,
    );
    await expect(
      beginAnalysis(
        project.id,
        project.sources[0].id,
        "再次分析",
        [],
        started.revision,
      ),
    ).rejects.toThrow("正在运行");
    await runAnalysis(project.id, started.analyses[0].id);
    const result = await readProject(project.id);
    expect(result.analyses[0].status).toBe("completed");
    expect(
      result.analyses[0].runs.every((run) => run.status === "completed"),
    ).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(started.analyses[0].runs.length);
    const contexts = fetcher.mock.calls.map((call) =>
      JSON.parse(JSON.parse(call[1]!.body as string).messages.at(-1).content),
    );
    expect(contexts[0].previousResults).toEqual([]);
    expect(
      contexts
        .at(-1)
        .previousResults.map((r: { skillId: string }) => r.skillId),
    ).toContain("fde-stage-review");
    expect(result.issues).toHaveLength(1);
    expect(result.analyses[0].judgment?.stageReview?.advice).toBe("stay");
    expect(result.currentStage).toBe("launch");
    expect(result.tasks).toEqual([]);
    expect(result.assets).toEqual([]);
    expect(result.facts[0].status).toBe("proposed");
    expect(result.facts).toHaveLength(1);
    expect(result.analyses[0].judgment?.deliverables).toHaveLength(0);
  });
  it("preserves failures without manufacturing judgment or assets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "invalid" }, { status: 401 })),
    );
    const started = await beginAnalysis(
      project.id,
      project.sources[0].id,
      "判断下一步",
      ["fde-questioning"],
      0,
    );
    await runAnalysis(project.id, started.analyses[0].id);
    const result = await readProject(project.id);
    expect(result.analyses[0].status).toBe("failed");
    expect(result.analyses[0].judgment).toBeUndefined();
    expect(result.analyses[0].runs[0].error).toContain("密钥无效");
    expect(result.facts).toEqual([]);
    expect(
      result.analyses[0].runs.slice(1).every((r) => r.status === "skipped"),
    ).toBe(true);
  });
  it("rejects malformed model output instead of treating text as success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          choices: [{ message: { content: '{"summary":"done"}' } }],
        }),
      ),
    );
    const started = await beginAnalysis(
      project.id,
      project.sources[0].id,
      "判断下一步",
      ["fde-questioning"],
      0,
    );
    await runAnalysis(project.id, started.analyses[0].id);
    const result = await readProject(project.id);
    expect(result.analyses[0].runs[0].error).toContain("格式不完整");
    expect(result.analyses[0].status).toBe("failed");
  });
  it("creates cited draft documents only after approval and preserves reviewed versions", async () => {
    vi.stubGlobal("fetch", mockGateway());
    const started = await beginAnalysis(
      project.id,
      project.sources[0].id,
      "判断下一步",
      [],
      0,
    );
    await runAnalysis(project.id, started.analyses[0].id);
    let p = await readProject(project.id);
    const analysis = p.analyses[0];
    p = applyCommand(p, {
      type: "actions",
      analysisId: analysis.id,
      actions: analysis.judgment!.actions,
      actor: "FDE",
      reason: "核实后执行",
    });
    expect(p.tasks[0].priority).toBe("P0");
    expect(p.assets).toHaveLength(0);
    expect(p.analyses[0].purpose).toBe("deliverable");
    await writeProject(p);
    await runAnalysis(p.id, p.analyses[0].id);
    p = await readProject(p.id);
    expect(p.analyses[0].status).toBe("completed");
    const draft = p.assets[0];
    expect(draft.reviewStatus).toBe("draft");
    expect(draft.decisionIds).toContain(draft.approvalId);
    expect(evidenceOptions(p).some((e) => e.id === draft.id)).toBe(false);
    p = applyCommand(p, {
      type: "approve-asset",
      assetId: draft.id,
      actor: "FDE",
      reason: "逐项核对完成",
    });
    expect(evidenceOptions(p).some((e) => e.id === draft.id)).toBe(true);
    p = applyCommand(p, {
      type: "revise-asset",
      assetId: draft.id,
      content: "# 修订后的行动计划\n补充真实负责人和样本范围。",
      actor: "FDE",
      reason: "修订样本范围",
    });
    expect(p.assets.map((a) => [a.version, a.reviewStatus])).toEqual([
      [1, "approved"],
      [2, "draft"],
    ]);
  });
  it("deduplicates gaps across analyses and preserves human resolution", async () => {
    vi.stubGlobal("fetch", mockGateway());
    for (let n = 0; n < 2; n++) {
      const current = await readProject(project.id);
      const started = await beginAnalysis(
        project.id,
        project.sources[0].id,
        "重新判断",
        [],
        current.revision,
      );
      await runAnalysis(project.id, started.analyses[0].id);
      if (n === 0) {
        const p = await readProject(project.id);
        await writeProject(
          applyCommand(p, {
            type: "issue",
            issueId: p.issues![0].id,
            status: "resolved",
            evidenceId: project.sources[0].id,
            actor: "FDE",
            reason: "已核实基线来源",
          }),
        );
      }
    }
    const p = await readProject(project.id);
    expect(p.issues).toHaveLength(1);
    expect(p.issues![0].status).toBe("resolved");
    expect(p.issues![0].analysisIds).toHaveLength(2);
  });
  it("runs a deferred task review after the active analysis finishes", async () => {
    vi.stubGlobal("fetch", mockGateway());
    const started = await beginAnalysis(
      project.id,
      project.sources[0].id,
      "判断下一步",
      [],
      0,
    );
    started.pendingTaskReview = true;
    await writeProject(started);
    await runAnalysis(project.id, started.analyses[0].id);
    const p = await readProject(project.id);
    expect(p.pendingTaskReview).toBe(false);
    expect(p.analyses[0].trigger).toBe("task.completed");
    expect(p.analyses.every((a) => a.status === "completed")).toBe(true);
  });
  it("keeps a P0 blocker when later AI output attempts to lower its priority", async () => {
    for (const priority of ["P0", "P2"] as const) {
      vi.stubGlobal("fetch", mockGateway(priority));
      const current = await readProject(project.id);
      const started = await beginAnalysis(
        project.id,
        project.sources[0].id,
        "检查问题优先级",
        [],
        current.revision,
      );
      await runAnalysis(project.id, started.analyses[0].id);
    }
    const p = await readProject(project.id);
    expect(p.issues).toHaveLength(1);
    expect(p.issues![0].priority).toBe("P0");
  });
  it("includes newly discovered P0 issues in stage rules before publishing judgment", async () => {
    for (const criterionId of ["brief", "sponsor"])
      project = applyCommand(project, {
        type: "gate",
        stage: "launch",
        criterionId,
        evidenceId: project.sources[0].id,
        actor: "FDE",
        reason: "已人工核实阶段证据",
      });
    await writeProject(project);
    vi.stubGlobal("fetch", mockGateway());
    const current = await readProject(project.id);
    const started = await beginAnalysis(
      project.id,
      project.sources[0].id,
      "检查阶段",
      [],
      current.revision,
    );
    await runAnalysis(project.id, started.analyses[0].id);
    const p = await readProject(project.id);
    expect(p.analyses[0].judgment?.stageReview?.advice).toBe("stay");
    expect(
      p.analyses[0].judgment?.ruleBlockers?.some((b) => b.includes("关键问题")),
    ).toBe(true);
  });
});
