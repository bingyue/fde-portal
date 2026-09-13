import { diagnosisRequestSchema, diagnose } from "@/lib/ai/diagnosis";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Next may expose an internal localhost URL; Host retains the browser-facing address.
  const url = new URL(request.url);
  const expectedOrigin = `${url.protocol}//${request.headers.get("host") || url.host}`;
  if (origin && origin !== expectedOrigin)
    return Response.json({ error: "请从本站发起对话。" }, { status: 403 });
  const body = await request.text();
  if (body.length > 160000)
    return Response.json(
      { error: "本次访谈过长，请新建诊断。" },
      { status: 413 },
    );
  let parsed;
  try {
    parsed = diagnosisRequestSchema.safeParse(JSON.parse(body));
  } catch {
    return Response.json({ error: "无法读取对话内容。" }, { status: 400 });
  }
  if (!parsed.success)
    return Response.json(
      { error: "对话格式不正确，单条最多 6000 字，单次最多 100 条消息。" },
      { status: 400 },
    );
  try {
    return Response.json(await diagnose(parsed.data, request.signal), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "回复超时，请重试。"
        : error instanceof Error
          ? error.message
          : "对话服务暂时不可用。";
    return Response.json({ error: message }, { status: 502 });
  }
}
