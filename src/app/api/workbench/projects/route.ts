import { z } from "zod";
import { createProject } from "@/lib/workbench/model";
import { listProjects, writeProject } from "@/lib/workbench/repository";
import { apiError, requestBody } from "@/lib/workbench/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const projects = (await listProjects()).map(
      ({ id, name, organization, goal, owner, currentStage, updatedAt }) => ({
        id,
        name,
        organization,
        goal,
        owner,
        currentStage,
        updatedAt,
      }),
    );
    return Response.json(
      { projects },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
const inputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  organization: z.string().trim().min(1).max(100),
  goal: z.string().trim().min(5).max(2000),
  owner: z.string().trim().min(1).max(100),
  legacyText: z.string().max(60000).optional(),
});
export async function POST(request: Request) {
  try {
    const { legacyText, ...input } = inputSchema.parse(
      await requestBody(request),
    );
    const project = createProject(input);
    if (legacyText?.trim())
      project.sources.push({
        id: crypto.randomUUID(),
        title: "旧版项目记录（导入待核实）",
        text: legacyText,
        kind: "legacy",
        createdAt: new Date().toISOString(),
      });
    await writeProject(project);
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
