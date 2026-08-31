import { aiSkillResponseSchema, type ScenarioGeneration } from "./schemas";
import { readDeepSeekConfig, type DeepSeekConfig } from "./config-store";

export type AISkill =
  | "enterprise-interview"
  | "scenario-generation"
  | "scenario-completeness"
  | "scenario-scoring"
  | "poc-planning"
  | "eval-design"
  | "eval-case-generation"
  | "risk-diagnosis"
  | "weekly-report"
  | "acceptance-report";

export interface AIProvider {
  readonly name: string;
  generateScenario(
    answers: Record<string, string>,
  ): Promise<ScenarioGeneration>;
}

export class DeepSeekProvider implements AIProvider {
  readonly name = "DeepSeek";
  constructor(private readonly config: DeepSeekConfig) {}

  async generateScenario(
    answers: Record<string, string>,
  ): Promise<ScenarioGeneration> {
    const response = await fetch(
      `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          thinking: { type: "disabled" },
          max_tokens: 2400,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "你是企业AI项目分析师。请仅输出 JSON 对象，不要 Markdown。字段必须包含：name, department, businessOwner, users, frequency, trigger, input, currentProcess, aiTask, targetOutput, targetMetrics, humanBoundary, dataSources, threshold, valueTarget。每个字段必须是非空字符串。不得虚构访谈未提供的事实；信息不足时写‘待确认：’并说明需要补充什么。",
            },
            { role: "user", content: JSON.stringify(answers) },
          ],
        }),
      },
    );
    if (!response.ok)
      throw new Error(
        `DeepSeek 调用失败（${response.status}），请检查模型配置后重试。`,
      );
    const json = (await response.json()) as {
      choices?: Array<{
        finish_reason?: string;
        message?: { content?: string };
      }>;
    };
    if (json.choices?.[0]?.finish_reason === "length")
      throw new Error("DeepSeek 输出被截断，请精简访谈内容后重试。");
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek 未返回可解析内容，请重新生成。");
    return aiSkillResponseSchema.shape.output.parse(JSON.parse(content));
  }
}

export async function getAIProvider(): Promise<AIProvider> {
  const { config } = await readDeepSeekConfig();
  if (!config)
    throw new Error("尚未配置 DeepSeek。请先前往“AI 模型配置”完成连接测试。 ");
  return new DeepSeekProvider(config);
}
