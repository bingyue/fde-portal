import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const acceptanceReportSkill = {
  id: "acceptance-report",
  version: "1.0.0",
  prompt:
    "基于结构化验收项和证据生成报告；未满足项必须明确披露，不能以推断替代证据。",
  input: z.object({
    project: z.record(z.string(), z.unknown()),
    evidence: z.array(z.unknown()),
  }),
  output: z.object({
    conclusion: z.enum(["通过", "有条件通过", "不通过"]),
    summary: z.string(),
    unmet: z.array(z.string()),
    recommendation: z.string(),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
