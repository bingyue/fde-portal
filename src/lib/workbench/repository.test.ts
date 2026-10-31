import { mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProject } from "./model";
import {
  listProjects,
  mutateProject,
  projectPath,
  readProject,
  writeProject,
} from "./repository";
let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "fde-repository-test-"));
  vi.stubEnv("FDE_DATA_DIR", directory);
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
  vi.unstubAllEnvs();
});
const newProject = () =>
  createProject({
    name: "隔离项目",
    organization: "测试企业",
    goal: "验证项目记忆不会丢失",
    owner: "测试员",
  });
describe("persistent project repository", () => {
  it("persists across reads with private file permissions and project isolation", async () => {
    const a = newProject(),
      b = newProject();
    await writeProject(a);
    await writeProject(b);
    await mutateProject(
      a.id,
      (p) => {
        p.goal = "仅改变 A 项目";
        return p;
      },
      0,
    );
    expect((await readProject(a.id)).goal).toBe("仅改变 A 项目");
    expect((await readProject(b.id)).goal).toBe(b.goal);
    expect(await listProjects()).toHaveLength(2);
    expect((await stat(projectPath(a.id))).mode & 0o777).toBe(0o600);
  });
  it("serializes async updates without losing writes", async () => {
    const p = newProject();
    await writeProject(p);
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        mutateProject(p.id, (current) => {
          current.sources.push({
            id: String(i),
            text: "保存测试资料",
            title: String(i),
            kind: "note",
            createdAt: p.createdAt,
          });
          return current;
        }),
      ),
    );
    const result = await readProject(p.id);
    expect(result.sources).toHaveLength(8);
    expect(result.revision).toBe(8);
  });
  it("rejects stale confirmation without overwriting newer data", async () => {
    const p = newProject();
    await writeProject(p);
    await mutateProject(
      p.id,
      (current) => ({ ...current, goal: "新的业务目标" }),
      0,
    );
    await expect(
      mutateProject(p.id, (current) => ({ ...current, goal: "过期目标" }), 0),
    ).rejects.toThrow("已被更新");
    expect((await readProject(p.id)).goal).toBe("新的业务目标");
  });
  it("rejects paths outside the project repository", () => {
    expect(() => projectPath("../../.env.local")).toThrow("无效");
  });
});
