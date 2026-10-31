import { readFile } from "node:fs/promises";
import path from "node:path";
import { findWorkSkill } from "@/lib/workbench/skills";
import { inputSchema, outputSchemaFor } from "@/lib/workbench/protocol";
import { z } from "zod";
import { apiError } from "@/lib/workbench/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const skill = findWorkSkill(id);
    if (!skill) throw new Error("Skill 不存在");
    return Response.json({
      content: await readFile(
        path.join(process.cwd(), "skills", skill.id, "SKILL.md"),
        "utf8",
      ),
      protocol: skill,
      schemas: {
        input: z.toJSONSchema(inputSchema),
        output: z.toJSONSchema(outputSchemaFor(skill.id)),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
