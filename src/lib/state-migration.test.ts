import { describe, expect, it } from "vitest";
import { emptyState } from "./empty-state";
import { normalizePortalState } from "./state-migration";

describe("portal state migration", () => {
  it("initializes the default space for missing or uncreated legacy data", () => {
    const saved = { ...emptyState, workspace: undefined };
    expect(normalizePortalState(saved).workspace.id).toBe(
      emptyState.workspace.id,
    );
    const migrated = normalizePortalState({
      ...saved,
      workspace: {
        id: "",
        name: "尚未创建 Workspace",
        members: 0,
        type: "团队空间",
      },
      flow: { ...saved.flow, workspaceCreated: false },
    });
    expect(migrated.workspace).toEqual(emptyState.workspace);
    expect(migrated.flow.workspaceCreated).toBe(true);
  });
  it("retains an existing workspace identity and all customer project records", () => {
    const saved = {
      ...emptyState,
      workspace: {
        ...emptyState.workspace,
        id: "existing-workspace",
        name: "原团队",
      },
      project: {
        ...emptyState.project,
        id: "existing-project",
        name: "客户项目",
      },
      scenario: { ...emptyState.scenario, name: "真实客户场景" },
    };
    const migrated = normalizePortalState(saved);
    expect(migrated.workspace.id).toBe("existing-workspace");
    expect(migrated.project).toEqual(saved.project);
    expect(migrated.scenario).toEqual(saved.scenario);
  });
  it("maps unsupported legacy types to supported delivery types", () => {
    const migrated = normalizePortalState({
      ...emptyState,
      workspace: { ...emptyState.workspace, type: "retired-workspace-type" },
      project: { ...emptyState.project, type: "retired-project-type" },
    });

    expect(migrated.workspace.type).toBe("团队空间");
    expect(migrated.project.type).toBe("内部AI创新项目");
    expect(migrated.outcomeContract.status).toBe("草稿");
    expect(migrated.adoptionPlan.items).toHaveLength(6);
    expect(migrated.productionProfile.items).toHaveLength(8);
  });
});
