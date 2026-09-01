import type { PortalState, Project, Workspace } from "./types";

type LegacyPortalState = Omit<PortalState, "workspace" | "project"> & {
  workspace: Omit<Workspace, "type"> & {
    type: string;
  };
  project: Omit<Project, "type"> & {
    type: string;
  };
};

export function normalizePortalState(saved: LegacyPortalState): PortalState {
  return {
    ...saved,
    workspace: {
      ...saved.workspace,
      type: saved.workspace.type === "企业空间" ? "企业空间" : "团队空间",
    },
    project: {
      ...saved.project,
      type: saved.project.type === "企业POC" ? "企业POC" : "内部AI创新项目",
    },
  };
}
