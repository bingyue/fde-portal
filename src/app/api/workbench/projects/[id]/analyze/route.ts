import { after } from "next/server";
import { z } from "zod";
import { beginAnalysis, runAnalysis } from "@/lib/workbench/runner";
import { apiError, requestBody, revisionSchema } from "@/lib/workbench/http";

export const runtime = "nodejs";
export const maxDuration = 180;
const schema = z.object({
  revision: revisionSchema,
  sourceId: z.string().uuid(),
  intent: z.string().trim().min(1).max(2000),
  skillIds: z.array(z.string().max(80)).max(3).default([]),
});
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const input = schema.parse(await requestBody(request));
    const project = await beginAnalysis(
      id,
      input.sourceId,
      input.intent,
      input.skillIds,
      input.revision,
    );
    after(() => runAnalysis(id, project.analyses[0].id));
    return Response.json({ project }, { status: 202 });
  } catch (error) {
    return apiError(error);
  }
}
