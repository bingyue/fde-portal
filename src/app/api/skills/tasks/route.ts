import { after } from "next/server";
import { z } from "zod";
import {
  createSkillTask,
  listSkillTasks,
  runSkillTask,
} from "@/lib/skills/task-store";

const requestSchema = z.object({
  skillId: z.string().min(3).max(240),
  input: z
    .string()
    .trim()
    .min(10, "请至少输入 10 个字符的任务背景")
    .max(8000, "任务背景不能超过 8000 字符"),
});
export const maxDuration = 90;

export async function GET() {
  return Response.json({ tasks: listSkillTasks() });
}
export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const task = await createSkillTask(body.skillId, body.input);
    after(() => runSkillTask(task.id));
    return Response.json({ task }, { status: 202 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message
        : error instanceof Error
          ? error.message
          : "无法创建任务";
    return Response.json({ error: message }, { status: 422 });
  }
}
