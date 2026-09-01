import { describe, expect, it } from "vitest";
import { emptyState } from "./empty-state";
import { normalizePortalState } from "./state-migration";

describe("portal state migration", () => {
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
