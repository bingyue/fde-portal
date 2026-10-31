import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { createProject, stages, type SkillOutput } from "./model";
import { outputSchemaFor, validateSkillOutput } from "./protocol";
import { workSkills, planSkills } from "./skills";
import { plannedAnalysis, enqueueDocument } from "./workflow";
import { applyCommand } from "./engine";

const audit = { actor: "FDE", reason: "已核实来源证据" };
function fixture() {
  const p = createProject({
    name: "验证项目",
    organization: "测试企业",
    goal: "核实业务需求",
    owner: "FDE",
  });
  p.sources.push({
    id: "source",
    title: "访谈",
    text: "业务负责人表示查询需要十五分钟。",
    kind: "note",
    createdAt: p.createdAt,
  });
  return p;
}
function output(): SkillOutput {
  return {
    summary: "需要核实",
    facts: [],
    missing: [],
    contradictions: [],
    recommendation: "补齐证据",
    suggestedStage: "launch",
    actions: [],
    deliverables: [],
  };
}
describe("version 2 Skill protocol", () => {
  it("registers exactly 18 loadable method packs and six core contracts", async () => {
    expect(workSkills).toHaveLength(18);
    expect(workSkills.filter((s) => s.core)).toHaveLength(6);
    for (const skill of workSkills) {
      const body = await readFile(
        path.join(process.cwd(), "skills", skill.id, "SKILL.md"),
        "utf8",
      );
      expect(body).toContain("name: " + skill.id);
      expect(body).toContain("description:");
      expect(skill.requires_approval).toBe(true);
      expect(skill.quality_gate.length).toBeGreaterThan(0);
      expect(skill.trigger.events.length).toBeGreaterThan(0);
      expect(skill.input_schema).toBeTruthy();
      expect(skill.output_schema).toBeTruthy();
      expect(skill.project_effect.length).toBeGreaterThan(0);
    }
  });
  it("requires skill-specific structured output and all action dependencies", () => {
    for (const id of [
      "fde-interview-analyzer",
      "fde-gap-finder",
      "fde-scenario-evaluator",
      "fde-stage-review",
      "fde-deliverable-builder",
    ])
      expect(outputSchemaFor(id).safeParse(output()).success).toBe(false);
    const o = output();
    o.actions = [
      { title: "核实数据", owner: "待确认", stage: "launch", blocking: true },
    ];
    expect(outputSchemaFor("fde-next-action").safeParse(o).success).toBe(false);
  });
  it("builds an ordered dependency graph and excludes pre-approval document execution", () => {
    const plan = planSkills("访谈：AI排产与ERP数据", "launch");
    expect(plan.at(-1)?.skillId).toBe("fde-next-action");
    for (const run of plan)
      for (const id of run.dependsOn)
        expect(plan.find((r) => r.skillId === id)!.phase).toBeLessThan(
          run.phase,
        );
    expect(() => planSkills("", "launch", ["fde-deliverable-builder"])).toThrow(
      "人工确认",
    );
  });
  it("rejects foreign references and fabricated scores", () => {
    const p = fixture(),
      a = plannedAnalysis(p, "source", "检查");
    const o = output();
    o.gaps = [
      {
        topic: "data",
        question: "数据在哪里？",
        why: "检查可得性",
        askWho: "数据负责人",
        priority: "P0",
        sourceIds: ["foreign"],
      },
    ];
    expect(() => validateSkillOutput("fde-gap-finder", o, p, a)).toThrow(
      "未知资料",
    );
    const d = { rating: null, reason: "待核实", evidenceIds: [] } as const;
    o.scenarioEvaluations = [
      {
        scenario: "业务查询",
        value: { rating: 4, reason: "没有证据", evidenceIds: [] },
        technicalDifficulty: { ...d, evidenceIds: [] },
        dataReadiness: { ...d, evidenceIds: [] },
        organizationalResistance: { ...d, evidenceIds: [] },
        risk: { ...d, evidenceIds: [] },
        priority: "validate",
        assumptions: [],
        nextValidation: "采集样本",
      },
    ];
    o.gaps = [];
    expect(() =>
      validateSkillOutput("fde-scenario-evaluator", o, p, a),
    ).toThrow("null");
    o.scenarioEvaluations[0].value.rating = null;
    expect(
      validateSkillOutput("fde-scenario-evaluator", o, p, a)
        .scenarioEvaluations![0].value.rating,
    ).toBeNull();
  });
  it("cannot bypass real stage rules using a positive model recommendation", () => {
    const p = fixture(),
      a = plannedAnalysis(p, "source", "检查"),
      o = output();
    o.stageReview = {
      stage: "launch",
      criteria: stages[0].criteria.map((c) => ({
        criterionId: c.id,
        status: "supported",
        reason: "访谈提及",
        evidenceIds: ["source"],
      })),
      blockers: [],
      advice: "review-ready",
    };
    expect(
      validateSkillOutput("fde-stage-review", o, p, a).stageReview?.advice,
    ).toBe("stay");
    o.stageReview.criteria[0].criterionId = "invented";
    expect(() => validateSkillOutput("fde-stage-review", o, p, a)).toThrow(
      "真实标准",
    );
  });
  it("requires real document approval and citations to that approval", () => {
    const p = fixture();
    expect(() => enqueueDocument(p, "fake", "FDE")).toThrow("人工确认");
    p.decisions.push({
      id: "approval",
      kind: "action",
      ...audit,
      at: p.createdAt,
      references: [],
    });
    enqueueDocument(p, "approval", "FDE");
    const o = output();
    o.deliverables = [
      {
        title: "行动计划",
        content: "根据核实后的资料收集业务样本。",
        sourceIds: ["source"],
        decisionIds: ["fake"],
      },
    ];
    expect(() =>
      validateSkillOutput("fde-deliverable-builder", o, p, p.analyses[0]),
    ).toThrow("人工审批");
  });
});
describe("state engine dependencies and evidence", () => {
  it("enforces dependencies and cascades reopening across completed stages", () => {
    let p = fixture();
    p.tasks = [
      {
        id: "a",
        title: "核实样本",
        owner: "FDE",
        stage: "launch",
        blocking: true,
        status: "todo",
        analysisId: "x",
      },
      {
        id: "b",
        title: "验证方案",
        owner: "FDE",
        stage: "interview",
        blocking: true,
        status: "todo",
        analysisId: "x",
        dependsOnTaskIds: ["a"],
      },
    ];
    expect(() =>
      applyCommand(p, { type: "task", taskId: "b", status: "doing", ...audit }),
    ).toThrow("前置依赖");
    p.tasks.forEach((t) => {
      t.status = "done";
      t.evidenceId = "source";
    });
    p.currentStage = "diagnosis";
    p.completedStages = ["launch", "interview"];
    p = applyCommand(p, {
      type: "task",
      taskId: "a",
      status: "todo",
      ...audit,
    });
    expect(p.tasks.every((t) => t.status === "todo")).toBe(true);
    expect(p.currentStage).toBe("launch");
    expect(p.completedStages).toEqual([]);
  });
  it("reopens resolved issues when their confirmed evidence is retracted", () => {
    let p = fixture();
    p.facts = [
      {
        id: "f",
        text: "查询耗时",
        quote: "查询需要十五分钟",
        sourceId: "source",
        status: "confirmed",
        analysisId: "x",
      },
    ];
    p.issues = [
      {
        id: "i",
        topic: "baseline",
        question: "耗时多少？",
        why: "需要基线",
        askWho: "业务负责人",
        priority: "P0",
        sourceIds: ["source"],
        stage: "launch",
        status: "resolved",
        analysisIds: [],
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
        evidenceId: "f",
      },
    ];
    p.currentStage = "interview";
    p.completedStages = ["launch"];
    p = applyCommand(p, {
      type: "facts",
      factIds: ["f"],
      status: "rejected",
      ...audit,
    });
    expect(p.issues![0].status).toBe("open");
    expect(p.currentStage).toBe("launch");
  });
  it("blocks closing an issue without valid evidence", () => {
    const p = fixture();
    p.issues = [
      {
        id: "i",
        topic: "data",
        question: "资料在哪？",
        why: "判断可得性",
        askWho: "业务方",
        priority: "P0",
        sourceIds: ["source"],
        status: "open",
        analysisIds: [],
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
      },
    ];
    expect(() =>
      applyCommand(p, {
        type: "issue",
        issueId: "i",
        status: "resolved",
        evidenceId: "fake",
        ...audit,
      }),
    ).toThrow("核实证据");
  });
});
