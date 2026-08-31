import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const pocPlanningSkill = {
  id: "poc-planning",
  version: "1.0.0",
  prompt:
    "按 P0-P5 生成可验证计划；每阶段包含进入条件、交付物、验收项、证据和风险。",
  input: z.object({ scenario: z.record(z.string(), z.unknown()) }),
  output: z.object({
    stages: z
      .array(
        z.object({
          code: z.string(),
          objective: z.string(),
          criteria: z.array(z.string()),
        }),
      )
      .length(6),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
