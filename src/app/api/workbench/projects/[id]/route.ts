import { readProject, mutateProject } from "@/lib/workbench/repository";
import { apiError } from "@/lib/workbench/http";
import { ANALYSIS_TIMEOUT_MS } from "@/lib/workbench/workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    let project = await readProject(id);
    if (
      project.analyses.some(
        (analysis) =>
          analysis.status === "running" &&
          Date.now() - Date.parse(analysis.createdAt) > ANALYSIS_TIMEOUT_MS,
      )
    ) {
      project = await mutateProject(id, (current) => {
        for (const analysis of current.analyses)
          if (
            analysis.status === "running" &&
            Date.now() - Date.parse(analysis.createdAt) > ANALYSIS_TIMEOUT_MS
          ) {
            analysis.status = "failed";
            analysis.error = "执行超时或服务已重启，请重试分析。";
            for (const run of analysis.runs)
              if (["running", "queued"].includes(run.status)) {
                run.status = "failed";
                run.error = analysis.error;
              }
          }
        return current;
      });
    }
    return Response.json(
      { project },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
