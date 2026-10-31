import { z } from "zod";
import { mutateProject } from "@/lib/workbench/repository";
import { apiError, requestBody, revisionSchema } from "@/lib/workbench/http";

const schema = z.object({
  revision: revisionSchema,
  title: z.string().trim().min(1).max(200),
  text: z.string().trim().min(5).max(60000),
  kind: z.enum(["note", "file"]),
});
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const { revision, ...input } = schema.parse(await requestBody(request));
    const sourceId = crypto.randomUUID();
    const project = await mutateProject(
      id,
      (current) => {
        current.sources.push({
          ...input,
          id: sourceId,
          createdAt: new Date().toISOString(),
        });
        return current;
      },
      revision,
    );
    return Response.json({ project, sourceId }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
