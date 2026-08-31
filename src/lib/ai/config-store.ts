import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const deepSeekConfigSchema = z.object({
  apiKey: z.string().trim().min(16, "API Key 格式不正确"),
  baseUrl: z.string().url().default("https://api.deepseek.com"),
  model: z.string().min(2).default("deepseek-v4-flash"),
});

export type DeepSeekConfig = z.infer<typeof deepSeekConfigSchema>;
const configDirectory = path.join(process.cwd(), ".data");
const configPath = path.join(configDirectory, "ai-config.json");

export async function readDeepSeekConfig(): Promise<{
  config: DeepSeekConfig | null;
  source: "environment" | "local-file" | "none";
}> {
  if (process.env.DEEPSEEK_API_KEY) {
    return {
      config: deepSeekConfigSchema.parse({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      }),
      source: "environment",
    };
  }
  try {
    const config = deepSeekConfigSchema.parse(
      JSON.parse(await readFile(configPath, "utf8")),
    );
    return { config, source: "local-file" };
  } catch {
    return { config: null, source: "none" };
  }
}

export async function saveDeepSeekConfig(input: DeepSeekConfig) {
  const config = deepSeekConfigSchema.parse(input);
  await mkdir(configDirectory, { recursive: true, mode: 0o700 });
  await writeFile(configPath, JSON.stringify(config), {
    encoding: "utf8",
    mode: 0o600,
  });
  return config;
}

export async function deleteDeepSeekConfig() {
  try {
    await unlink(configPath);
  } catch {
    /* already absent */
  }
}

export async function testDeepSeekConnection(config: DeepSeekConfig) {
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/models`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const message =
      response.status === 401
        ? "API Key 无效或已失效"
        : response.status === 402
          ? "DeepSeek 账户余额不足"
          : `DeepSeek 返回 HTTP ${response.status}`;
    throw new Error(message);
  }
  const payload = (await response.json()) as { data?: Array<{ id?: string }> };
  const models = (payload.data || []).flatMap((item) =>
    item.id ? [item.id] : [],
  );
  if (!models.includes(config.model))
    throw new Error(
      `模型 ${config.model} 当前不可用；可用模型：${models.join("、") || "未知"}`,
    );
  return models;
}
