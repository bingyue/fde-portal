import { z } from "zod";

export const scenarioGenerationSchema = z.object({
  name: z.string().min(2),
  department: z.string().min(2),
  businessOwner: z.string().min(2),
  users: z.string().min(2),
  frequency: z.string().min(1),
  trigger: z.string().min(4),
  input: z.string().min(4),
  currentProcess: z.string().min(8),
  aiTask: z.string().min(8),
  targetOutput: z.string().min(4),
  targetMetrics: z.string().min(4),
  humanBoundary: z.string().min(4),
  dataSources: z.string().min(4),
  threshold: z.string().min(2),
  valueTarget: z.string().min(4),
});

export type ScenarioGeneration = z.infer<typeof scenarioGenerationSchema>;

export const aiSkillResponseSchema = z.object({
  skill: z.string(),
  version: z.string(),
  provider: z.string(),
  output: scenarioGenerationSchema,
  generatedAt: z.string(),
});
