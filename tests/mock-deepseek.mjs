import { createServer } from "node:http";

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
