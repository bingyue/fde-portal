import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const scenarioScoringSkill = {
  id: "scenario-scoring",
  version: "1.0.0",
  prompt:
    "分别评估业务价值、技术可行性、数据准备度与风险可控性，给出有证据的评分。",
  input: z.object({ scenario: z.record(z.string(), z.unknown()) }),
  output: z.object({
    value: z.number(),
    feasibility: z.number(),
    data: z.number(),
    risk: z.number(),
    rationale: z.array(z.string()),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
