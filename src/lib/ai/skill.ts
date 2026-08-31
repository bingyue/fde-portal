import type { z } from "zod";

export interface SkillDefinition<
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
> {
  id: string;
  version: string;
  prompt: string;
  input: TInput;
  output: TOutput;
}
