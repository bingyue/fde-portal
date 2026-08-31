import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const evalCaseGenerationSkill = {
  id: "eval-case-generation",
  version: "1.0.0",
  prompt:
    "生成正常、边界、高风险和回归案例。不得包含真实个人信息，每条说明预期结果和来源。",
  input: z.object({
    scenario: z.record(z.string(), z.unknown()),
    count: z.number().max(100),
  }),
  output: z.object({
    cases: z.array(
      z.object({
        input: z.string(),
        expected: z.string(),
        type: z.enum(["正常场景", "边界场景", "高风险场景", "回归场景"]),
        severity: z.enum(["低", "中", "高"]),
      }),
    ),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
