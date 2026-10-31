import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkProject } from "./model";

// Single-node persistent repository. The UI talks to this API, never localStorage.
const root = () =>
  path.join(
    process.env.FDE_DATA_DIR || path.join(process.cwd(), ".data"),
    "workbench",
  );
const locks = globalThis as typeof globalThis & {
  workbenchWriteQueue?: Promise<unknown>;
};
export function projectPath(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("项目标识无效");
  return path.join(root(), `${id}.json`);
}
export async function readProject(id: string): Promise<WorkProject> {
  try {
    return JSON.parse(await readFile(projectPath(id), "utf8")) as WorkProject;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new Error("项目不存在");
    throw error;
  }
}
export async function listProjects() {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  const names = (await readdir(root())).filter((name) =>
    /^[0-9a-f-]{36}\.json$/i.test(name),
  );
  const projects = await Promise.all(
    names.map((name) => readProject(name.slice(0, -5))),
  );
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function writeProject(project: WorkProject) {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  const file = projectPath(project.id);
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(project), { mode: 0o600 });
  await rename(temporary, file);
}
export async function mutateProject(
  id: string,
  update: (project: WorkProject) => WorkProject,
  revision?: number,
) {
  const operation = (locks.workbenchWriteQueue || Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const project = await readProject(id);
      if (revision !== undefined && revision !== project.revision)
        throw new Error("项目已被更新，请刷新后再确认");
      const result = update(structuredClone(project));
      result.revision = project.revision + 1;
      result.updatedAt = new Date().toISOString();
      await writeProject(result);
      return result;
    });
  locks.workbenchWriteQueue = operation;
  return operation;
}
