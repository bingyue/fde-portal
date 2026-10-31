import { z } from "zod";
import { after } from "next/server";
import { runAnalysis } from "@/lib/workbench/runner";
export const maxDuration = 600;
import { applyCommand, commandSchema } from "@/lib/workbench/engine";
import { mutateProject } from "@/lib/workbench/repository";
import { apiError, requestBody, revisionSchema } from "@/lib/workbench/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { revision, command } = z
      .object({ revision: revisionSchema, command: commandSchema })
      .parse(await requestBody(request));
    let scheduledIds: string[] = [];
    const project = await mutateProject(
      id,
      (current) => {
        const next = applyCommand(current, command);
        scheduledIds = next.analyses
          .filter(
            (a) =>
              a.status === "running" &&
              !current.analyses.some((old) => old.id === a.id),
          )
          .map((a) => a.id);
        return next;
      },
      revision,
    );
    for (const analysisId of scheduledIds)
      after(() => runAnalysis(id, analysisId));
    return Response.json({ project });
  } catch (error) {
    return apiError(error);
  }
}
