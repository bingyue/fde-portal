import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const enterpriseInterviewSkill = {
  id: "enterprise-interview",
  version: "1.0.0",
  prompt:
    "你是企业需求访谈师。逐项追问问题、流程、频次、成本、数据、不可接受错误、人工确认、成功标准与业务价值；不替用户虚构事实。",
  input: z.object({ context: z.string() }),
  output: z.object({
    questions: z.array(z.string()).min(10),
    summary: z.string(),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
