import { createServer } from "node:http";
import { diagnosisFixture } from "./diagnosis-fixture.mjs";

const server = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.method === "GET" && request.url === "/models") {
    response.end(JSON.stringify({ data: [{ id: "deepseek-v4-flash" }] }));
    return;
  }
  if (request.method === "POST" && request.url === "/chat/completions") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      const payload = JSON.parse(body || "{}");
      if (
        payload.messages?.[0]?.content?.includes(
          "FDE Workbench 的专业 Skill 执行器",
        )
      ) {
        const context = JSON.parse(payload.messages.at(-1).content);
        const result = {
          summary: "测试环境：已识别查询效率问题，需核实业务样本与基线。",
          facts: [
            {
              text: "访谈反映存在查询效率问题",
              sourceId: context.source.id,
              quote: context.source.text.slice(0, 100),
            },
          ],
          missing: ["缺少代表性查询样本", "缺少验收指标与负责人确认"],
          contradictions: ["业务方对耗时的估计需要用实际记录核验"],
          recommendation: "先收集基线和业务样本，暂不建议直接进入 PoC。",
          suggestedStage: "interview",
          actions: [
            {
              title: "收集十条真实查询样本并核实耗时",
              owner: "业务负责人",
              stage: context.stage.id,
              blocking: true,
            },
          ],
          deliverables: [
            {
              title: "查询流程访谈提纲与资料清单",
              content:
                "# 查询流程访谈提纲\n\n1. 请演示最近一次查询：输入、涉及系统、步骤与输出分别是什么？\n2. 记录开始、结束时间与异常。\n3. 由业务负责人核实十条记录的代表性。\n\n## 资料清单\n- 脱敏查询记录及耗时\n- 系统权限与数据负责人\n- 业务验收指标（待确认）\n\n此内容仅用于自动化测试。",
            },
          ],
        };
        const skill =
          payload.messages[0].content.match(/本次只执行 ([a-z-]+)/)?.[1];
        result.actions = context.tasks.some(
          (t) => t.title === result.actions[0].title && t.status !== "done",
        )
          ? []
          : result.actions.map((a) => ({
              ...a,
              priority: "P0",
              prerequisites: ["取得脱敏样本授权"],
              skillId: "data-assessment",
              dependsOnTaskIds: [],
            }));
        result.deliverables = [];
        if (skill === "fde-interview-analyzer")
          result.interview = {
            businessGoals: ["验证业务效率改善空间"],
            painPoints: ["流程基线待核实"],
            unverifiedClaims: ["上线时间需评估"],
            stakeholders: [],
          };
        if (skill === "fde-gap-finder")
          result.gaps = [
            {
              topic: "baseline",
              question: "请提供代表性业务样本及耗时记录？",
              why: "先核实基线再定义验收指标",
              askWho: "业务负责人",
              priority: "P0",
              sourceIds: [context.source.id],
              ...(context.openIssues[0]
                ? { issueId: context.openIssues[0].id }
                : {}),
            },
          ];
        if (skill === "fde-scenario-evaluator") {
          const unknown = {
            rating: null,
            reason: "需要真实样本支持判断",
            evidenceIds: [],
          };
          result.scenarioEvaluations = [
            {
              scenario: "业务流程 AI 辅助",
              value: {
                rating: 3,
                reason: "资料描述业务痛点，价值仍需量化",
                evidenceIds: [context.source.id],
              },
              technicalDifficulty: unknown,
              dataReadiness: unknown,
              organizationalResistance: unknown,
              risk: unknown,
              priority: "validate",
              assumptions: ["样本可获得"],
              nextValidation: "核对样本与业务基线",
            },
          ];
        }
        if (skill === "fde-stage-review")
          result.stageReview = {
            stage: context.stage.id,
            criteria: context.stage.criteria.map((c) => ({
              criterionId: c.id,
              status: "missing",
              evidenceIds: [],
              reason: "等待人工核实与关联证据",
            })),
            blockers: context.gateBlockers,
            advice: "stay",
          };
        if (skill === "fde-deliverable-builder")
          result.deliverables = [
            {
              title: context.documentType,
              content:
                "# " +
                context.documentType +
                "\n\n## 已确认范围\n依据本次人工审批收集真实样本。\n\n## 行动\n1. 核实业务基线。\n2. 明确验收负责人。\n\n## 待核实\n数据授权与实际耗时。\n\n此内容仅用于自动化测试。",
              sourceIds: [context.source.id],
              decisionIds: [context.approval.id],
            },
          ];
        response.end(
          JSON.stringify({
            choices: [
              {
                finish_reason: "stop",
                message: { content: JSON.stringify(result) },
              },
            ],
          }),
        );
        return;
      }
      if (payload.messages?.[0]?.content?.includes("虚拟 AI 场景诊断顾问")) {
        const rounds = payload.messages.filter((m) => m.role === "user").length;
        const result =
          rounds >= 3
            ? diagnosisFixture
            : {
                ...diagnosisFixture,
                step: rounds,
                reply:
                  rounds === 1
                    ? "了解了查询耗时问题。目前单次耗时多久，希望改善到什么程度？"
                    : "接下来确认数据权限、人工兜底、试用周期和验收负责人。",
                facts: {
                  ...diagnosisFixture.facts,
                  acceptance: "",
                  timeline: "",
                },
                openQuestions: ["验收方式和时间资源还需要确认"],
                plan: null,
              };
        response.end(
          JSON.stringify({
            choices: [
              {
                finish_reason: "stop",
                message: { content: JSON.stringify(result) },
              },
            ],
          }),
        );
        return;
      }
      const skillInput = payload.messages?.at(-1)?.content || "";
      response.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `# Mock DeepSeek Skill 执行结果\n\n任务已在后台安全执行。\n\n## 输入摘要\n${skillInput}\n\n## 交付物\n- 分析框架\n- 关键问题\n- 验收标准`,
              },
            },
          ],
        }),
      );
    });
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not found" }));
});

server.listen(3200, "127.0.0.1", () =>
  process.stdout.write("Mock DeepSeek ready on 3200\n"),
);
