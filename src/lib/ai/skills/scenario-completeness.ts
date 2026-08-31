import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const scenarioCompletenessSkill = {
  id: "scenario-completeness",
  version: "1.0.0",
  prompt:
    "检查场景卡的业务基线、数据条件、风险边界与验收标准，仅指出缺失和歧义。",
  input: z.record(z.string(), z.unknown()),
  output: z.object({
    score: z.number().min(0).max(100),
    missing: z.array(z.string()),
    questions: z.array(z.string()),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
