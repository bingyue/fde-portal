import { z } from "zod";
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
    const project = await mutateProject(
      id,
      (current) => applyCommand(current, command),
      revision,
    );
    return Response.json({ project });
  } catch (error) {
    return apiError(error);
  }
}
