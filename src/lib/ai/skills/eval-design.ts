import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const evalDesignSkill = {
  id: "eval-design",
  version: "1.0.0",
  prompt: "依据业务失败风险设计评测维度、评分方法、目标阈值和严重失败门槛。",
  input: z.object({ scenario: z.record(z.string(), z.unknown()) }),
  output: z.object({
    dimensions: z.array(z.string()),
    threshold: z.number(),
    severeFailureGate: z.number(),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
