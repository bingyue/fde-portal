import { getSkillTask } from "@/lib/skills/task-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  const task = getSkillTask(taskId);
  return task
    ? Response.json({ task })
    : Response.json({ error: "任务不存在或已过期" }, { status: 404 });
}
