import manifestJson from "@/data/fde-skills-manifest.json";

export type SkillSafety = "safe_prompt" | "prompt_only";
export interface CatalogSkill {
  id: string;
  name: string;
  summary: string;
  category: string;
  sourcePath: string;
  sourceUrl: string;
  downloadUrl: string;
  fileCount: number;
  sizeBytes: number;
  hasScripts: boolean;
  hasWorkflow: boolean;
  executionMode: "ai";
  runtimeSafety: SkillSafety;
}

export interface SkillsManifest {
  source: string;
  branch: string;
  commit: string;
  syncedAt: string;
  license: string;
  total: number;
  skills: CatalogSkill[];
}

export const skillsManifest = manifestJson as SkillsManifest;
export const skillCatalog = skillsManifest.skills;
export function findSkill(skillId: string) {
  return skillCatalog.find((skill) => skill.id === skillId);
}
