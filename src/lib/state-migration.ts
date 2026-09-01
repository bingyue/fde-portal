import { emptyState } from "./empty-state";
import type { PortalState, Project, Workspace } from "./types";

type LegacyPortalState = Omit<Partial<PortalState>, "workspace" | "project"> & {
  workspace: Omit<Workspace, "type"> & {
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
    workspace: {
      ...saved.workspace,
      type: saved.workspace.type === "企业空间" ? "企业空间" : "团队空间",
    },
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
