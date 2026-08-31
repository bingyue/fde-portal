import { z } from "zod";
import type { SkillDefinition } from "../skill";
import { scenarioGenerationSchema } from "../schemas";
export const scenarioGenerationSkill = {
  id: "scenario-generation",
  version: "1.0.0",
  prompt:
    "把已确认的访谈事实转换为结构化场景卡。所有推断必须标记为待确认，输出严格 JSON。",
  input: z.record(z.string(), z.string()),
  output: scenarioGenerationSchema,
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
