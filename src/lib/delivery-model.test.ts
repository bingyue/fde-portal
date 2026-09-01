import { describe, expect, it } from "vitest";
import {
  getMissingEvidenceDimensions,
  getRequiredEvidenceDimensions,
  isEvidenceGateReady,
} from "./delivery-model";
import type { PocStage } from "./types";

const stage: PocStage = {
  id: "p4",
  code: "P4",
  name: "业务试用",
  objective: "验证业务与采纳证据",
  status: "进行中",
  owner: "FDE",
  dueDate: "2026-09-30",
  criteriaTotal: 2,
  criteriaPassed: 2,
  evidenceCount: 2,
  blockers: [],
  criteria: [
    { id: "1", title: "周期下降", dimension: "业务", passed: true },
    { id: "2", title: "用户采用", dimension: "采纳", passed: true },
  ],
};

describe("FDE 三维证据门禁", () => {
  it("按阶段返回必须覆盖的证据维度", () => {
    expect(getRequiredEvidenceDimensions("P0")).toEqual(["业务"]);
    expect(getRequiredEvidenceDimensions("P5")).toEqual([
      "技术",
      "业务",
      "采纳",
    ]);
  });

  it("只有验收、证据和维度都完整时才允许提交", () => {
    expect(isEvidenceGateReady(stage)).toBe(true);
    expect(
      getMissingEvidenceDimensions({
        ...stage,
        criteria: [stage.criteria![0]],
      }),
    ).toEqual(["采纳"]);
  });
});
