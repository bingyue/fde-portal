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
