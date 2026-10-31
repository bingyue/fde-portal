import { z } from "zod";

export async function requestBody(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && new URL(origin).host !== host)
    throw new Error("不允许跨站写入");
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("请使用 JSON 提交资料");
  const body = await request.text();
  if (Buffer.byteLength(body) > 500_000)
    throw new Error("资料过长，请拆分后提交");
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("提交内容不是有效 JSON");
  }
}
export function apiError(error: unknown) {
  const raw =
    error instanceof z.ZodError
      ? `输入不完整：${error.issues[0]?.message}`
      : error instanceof Error
        ? error.message
        : "操作失败";
  // Filesystem/provider exception details must never expose local data or credentials.
  const message = /ENOENT|EACCES|SyntaxError|fetch failed|sk-[a-zA-Z0-9]/.test(
    raw,
  )
    ? "服务暂时不可用，请重试"
    : raw;
  return Response.json(
    { error: message },
    {
      status: message.includes("不存在")
        ? 404
        : message.includes("已被更新")
          ? 409
          : 400,
    },
  );
}
export const revisionSchema = z.number().int().min(0);
