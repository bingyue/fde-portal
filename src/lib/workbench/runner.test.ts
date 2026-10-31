import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProject, type SkillOutput, type WorkProject } from "./model";
import { readProject, writeProject } from "./repository";
import { beginAnalysis, runAnalysis, verifiedFacts } from "./runner";

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
    const fetcher = vi.fn(async () =>
      Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify(output()) },
          },
        ],
      }),
    );
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
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.currentStage).toBe("launch");
    expect(result.tasks).toEqual([]);
    expect(result.assets).toEqual([]);
    expect(result.facts[0].status).toBe("proposed");
    expect(result.facts).toHaveLength(1);
    expect(result.analyses[0].judgment?.deliverables).toHaveLength(1);
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
});
