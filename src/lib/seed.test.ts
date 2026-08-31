import { describe, expect, it } from "vitest";
import { emptyState } from "./empty-state";

describe("空白数据初始化", () => {
  it("启动时不加载任何业务样例数据", () => {
    expect(emptyState.project.id).toBe("");
    expect(emptyState.stages).toHaveLength(0);
    expect(emptyState.evalSuites).toHaveLength(0);
    expect(emptyState.assets).toHaveLength(0);
    expect(emptyState.reports).toHaveLength(0);
  });
});
