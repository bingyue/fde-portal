import { emptyState } from "./empty-state";
import type { PortalState, Project, Workspace } from "./types";

type LegacyPortalState = Omit<Partial<PortalState>, "workspace" | "project"> & {
  workspace?: Partial<Omit<Workspace, "type">> & {
    type: string;
  };
  project: Omit<Project, "type"> & {
    type: string;
  };
};

export function normalizePortalState(saved: LegacyPortalState): PortalState {
  return {
    ...emptyState,
    ...saved,
    diagnoses: saved.diagnoses || [],
    workspace: {
      ...emptyState.workspace,
      ...saved.workspace,
      id: saved.workspace?.id || emptyState.workspace.id,
      name: saved.workspace?.id
        ? saved.workspace.name || emptyState.workspace.name
        : emptyState.workspace.name,
      members: saved.workspace?.id ? (saved.workspace.members ?? 1) : 1,
      type: saved.workspace?.type === "企业空间" ? "企业空间" : "团队空间",
    },
    flow: { ...emptyState.flow, ...saved.flow, workspaceCreated: true },
    project: {
      ...saved.project,
      type: saved.project.type === "企业POC" ? "企业POC" : "内部AI创新项目",
    },
    outcomeContract: {
      ...emptyState.outcomeContract,
      ...saved.outcomeContract,
    },
    stakeholders: saved.stakeholders || [],
    workflowSteps: saved.workflowSteps || [],
    hypotheses: saved.hypotheses || [],
    adoptionPlan: {
      ...emptyState.adoptionPlan,
      ...saved.adoptionPlan,
      items: saved.adoptionPlan?.items || emptyState.adoptionPlan.items,
    },
    productionProfile: {
      ...emptyState.productionProfile,
      ...saved.productionProfile,
      items:
        saved.productionProfile?.items || emptyState.productionProfile.items,
    },
    stages: (saved.stages || []).map((stage) => ({
      ...stage,
      criteria: stage.criteria?.map((criterion) => ({
        ...criterion,
        dimension: criterion.dimension || "技术",
      })),
    })),
  };
}
