import { z } from "zod";
import type { SkillDefinition } from "../skill";
export const riskDiagnosisSkill = {
  id: "risk-diagnosis",
  version: "1.0.0",
  prompt:
    "根据开放风险、阻塞时长、严重失败、数据状态、验收缺失和延期诊断项目风险。",
  input: z.record(z.string(), z.unknown()),
  output: z.object({
    level: z.enum(["低", "中", "高"]),
    risks: z.array(z.object({ title: z.string(), mitigation: z.string() })),
  }),
} satisfies SkillDefinition<z.ZodType, z.ZodType>;
