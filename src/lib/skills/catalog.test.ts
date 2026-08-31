import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { skillCatalog, skillsManifest } from "./catalog";

describe("FDE Skills catalog", () => {
  it("初始化 65 个唯一 Skill 并保留来源版本", () => {
    expect(skillsManifest.total).toBe(65);
    expect(skillsManifest.commit).toBe("504a52b");
    expect(new Set(skillCatalog.map((skill) => skill.id)).size).toBe(65);
  });
  it("每个 Skill 都有可下载 ZIP", () => {
    for (const skill of skillCatalog) {
      const path = join(process.cwd(), "public", skill.downloadUrl);
      expect(existsSync(path), skill.id).toBe(true);
      expect(statSync(path).size, skill.id).toBeGreaterThan(100);
    }
  });
  it("包含脚本的 Skill 强制使用 Prompt Only", () => {
    const scripted = skillCatalog.filter((skill) => skill.hasScripts);
    expect(scripted.length).toBeGreaterThan(0);
    expect(
      scripted.every((skill) => skill.runtimeSafety === "prompt_only"),
    ).toBe(true);
  });
});
