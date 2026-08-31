import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";

const bodySchema = z.object({ answers: z.record(z.string(), z.string()) });

export async function POST(request: Request) {
  try {
    const { answers } = bodySchema.parse(await request.json());
    const provider = await getAIProvider();
    const output = await provider.generateScenario(answers);
    return NextResponse.json({ provider: provider.name, output });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? "访谈内容格式不完整，请检查后重试。"
        : error instanceof Error
          ? error.message
          : "AI 服务暂时不可用。";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
