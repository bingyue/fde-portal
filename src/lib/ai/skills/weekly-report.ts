import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const weeklyReportSkill = {
  id: "weekly-report",
  version: "1.0.0",
  prompt: "只根据审计日志、Eval、证据和风险生成周报，区分事实、判断与下一步。",
  input: z.object({
    activities: z.array(z.unknown()),
    metrics: z.record(z.string(), z.number()),
  }),
  output: z.object({
    progress: z.array(z.string()),
    risks: z.array(z.string()),
    nextActions: z.array(z.string()),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
