import { NextResponse } from "next/server";
import {
  deleteDeepSeekConfig,
  deepSeekConfigSchema,
  readDeepSeekConfig,
  saveDeepSeekConfig,
  testDeepSeekConnection,
} from "@/lib/ai/config-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const { config, source } = await readDeepSeekConfig();
  return NextResponse.json({
    configured: Boolean(config),
    source,
    baseUrl: config?.baseUrl || "https://api.deepseek.com",
    model: config?.model || "deepseek-v4-flash",
  });
}

export async function POST(request: Request) {
  try {
    if (process.env.VERCEL)
      return NextResponse.json(
        {
          error:
            "Vercel 环境不允许写入运行时密钥文件，请在项目环境变量中配置。",
        },
        { status: 409 },
      );
    const config = deepSeekConfigSchema.parse(await request.json());
    const models = await testDeepSeekConnection(config);
    await saveDeepSeekConfig(config);
    return NextResponse.json({
      configured: true,
      source: "local-file",
      model: config.model,
      baseUrl: config.baseUrl,
      models,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DeepSeek 配置验证失败";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

export async function DELETE() {
  if (process.env.DEEPSEEK_API_KEY)
    return NextResponse.json(
      { error: "当前密钥来自环境变量，请在运行环境中移除。" },
      { status: 409 },
    );
  await deleteDeepSeekConfig();
  return NextResponse.json({ configured: false });
}
