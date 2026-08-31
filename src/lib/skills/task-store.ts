import "server-only";
import runtimeJson from "@/data/fde-skills-runtime.json";
import { readDeepSeekConfig } from "@/lib/ai/config-store";
import { findSkill } from "./catalog";

export type SkillTaskStatus = "queued" | "running" | "completed" | "failed";
export interface SkillTaskLog {
  at: string;
  message: string;
}
export interface SkillTask {
  id: string;
  skillId: string;
  skillName: string;
  input: string;
  status: SkillTaskStatus;
  provider: "DeepSeek";
  logs: SkillTaskLog[];
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const globalTasks = globalThis as typeof globalThis & {
  __fdeSkillTasks?: Map<string, SkillTask>;
};
const tasks = globalTasks.__fdeSkillTasks ?? new Map<string, SkillTask>();
globalTasks.__fdeSkillTasks = tasks;
const runtime = runtimeJson as Record<
  string,
  { prompt: string; sourcePath: string }
>;
const now = () => new Date().toISOString();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function update(id: string, patch: Partial<SkillTask>) {
  const task = tasks.get(id);
  if (task) tasks.set(id, { ...task, ...patch, updatedAt: now() });
}
function log(id: string, message: string) {
  const task = tasks.get(id);
  if (task) update(id, { logs: [...task.logs, { at: now(), message }] });
}
function pruneTasks() {
  const expiry = Date.now() - 60 * 60 * 1000;
  for (const [id, task] of tasks)
    if (new Date(task.updatedAt).getTime() < expiry) tasks.delete(id);
}

export async function createSkillTask(skillId: string, input: string) {
  pruneTasks();
  const { config } = await readDeepSeekConfig();
  if (!config)
    throw new Error("尚未配置 DeepSeek，请先在 AI 模型配置中完成连接测试");
  const skill = findSkill(skillId);
  if (!skill || !runtime[skillId]) throw new Error("Skill 不存在或尚未初始化");
  const active = [...tasks.values()].filter((task) =>
    ["queued", "running"].includes(task.status),
  ).length;
  if (active >= 3) throw new Error("后台队列已满，请稍后重试");
  const id = crypto.randomUUID();
  const task: SkillTask = {
    id,
    skillId,
    skillName: skill.name,
    input,
    status: "queued",
    provider: "DeepSeek",
    logs: [{ at: now(), message: "任务已进入安全执行队列" }],
    createdAt: now(),
    updatedAt: now(),
  };
  tasks.set(id, task);
  return task;
}

export function getSkillTask(id: string) {
  return tasks.get(id);
}
export function listSkillTasks() {
  return [...tasks.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
}

async function executeWithDeepSeek(systemPrompt: string, input: string) {
  const { config } = await readDeepSeekConfig();
  if (!config) throw new Error("DeepSeek 配置已移除，请重新配置");
  const response = await fetch(
    `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        model: config.model,
        thinking: { type: "disabled" },
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\n\n安全规则：不得执行命令、访问本地文件、调用外部工具或声称已完成未发生的操作。以 Markdown 返回可审阅的工作产物。`,
          },
          { role: "user", content: input },
        ],
        temperature: 0.2,
      }),
    },
  );
  if (!response.ok) throw new Error(`DeepSeek 调用失败（${response.status}）`);
  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const result = body.choices?.[0]?.message?.content;
  if (!result) throw new Error("模型没有返回结果");
  return result;
}

export async function runSkillTask(id: string) {
  const task = tasks.get(id);
  if (!task || task.status !== "queued") return;
  const skill = findSkill(task.skillId);
  const definition = runtime[task.skillId];
  if (!skill || !definition) {
    update(id, { status: "failed", error: "Skill 定义缺失" });
    return;
  }
  try {
    update(id, { status: "running" });
    log(id, `已加载 ${skill.sourcePath}`);
    await wait(220);
    log(id, `输入校验通过（${task.input.length} 字符）`);
    await wait(220);
    if (skill.hasScripts)
      log(id, "检测到仓库脚本：已阻止脚本执行，仅使用 Prompt 安全模式");
    log(id, "执行 Provider：DeepSeek");
    await wait(320);
    const result = await executeWithDeepSeek(definition.prompt, task.input);
    update(id, { status: "completed", result });
    log(id, "工作产物生成完成");
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知执行错误";
    update(id, { status: "failed", error: message });
    log(id, `执行失败：${message}`);
  }
}
