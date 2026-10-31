import { readFile } from "node:fs/promises";
import path from "node:path";
import { workSkills } from "@/lib/workbench/skills";
import { apiError } from "@/lib/workbench/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!workSkills.some((skill) => skill.id === id))
      throw new Error("Skill 不存在");
    return Response.json({
      content: await readFile(
        path.join(process.cwd(), "skills", id, "SKILL.md"),
        "utf8",
      ),
    });
  } catch (error) {
    return apiError(error);
  }
}
