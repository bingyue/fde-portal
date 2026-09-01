import { describe, expect, it } from "vitest";
import {
  calculateAdoptionRate,
  calculateChecklistProgress,
  calculateEvalPassRate,
  calculateEvidenceCoverage,
  calculateProjectRisk,
  calculateRoi,
  calculateScenarioCompleteness,
  calculateUnitEffectiveCost,
} from "./metrics";

describe("FDE 项目核心指标", () => {
  it("计算场景完整度", () =>
    expect(
      calculateScenarioCompleteness({
        requiredFields: ["a", "b", "c", ""],
        hasBaseline: true,
        hasDataConditions: true,
        hasRiskBoundary: true,
        hasAcceptanceStandard: false,
      }),
    ).toBe(75));
  it("计算 Eval 通过率并处理零分母", () => {
    expect(calculateEvalPassRate(86, 100)).toBe(86);
    expect(calculateEvalPassRate(0, 0)).toBe(0);
  });
  it("计算证据覆盖率", () =>
    expect(calculateEvidenceCoverage(17, 23)).toBe(74));
  it("计算组织采纳与检查清单进度", () => {
    expect(calculateAdoptionRate(18, 24)).toBe(75);
    expect(calculateAdoptionRate(30, 24)).toBe(100);
    expect(calculateChecklistProgress(5, 8)).toBe(63);
  });
  it("计算年度 ROI 并处理零成本", () => {
    expect(calculateRoi(300000, 100000)).toBe(200);
    expect(calculateRoi(300000, 0)).toBe(0);
  });
  it("计算单位有效结果成本", () =>
    expect(
      calculateUnitEffectiveCost({
        modelCost: 30,
        toolCost: 10,
        reviewCost: 20,
        reworkCost: 12,
        acceptedResults: 100,
      }),
    ).toBe(0.72));
  it("综合计算项目风险", () => {
    expect(
      calculateProjectRisk({
        highRisks: 1,
        blockedDays: 2,
        severeFailures: 3,
        dataNotReady: false,
        missingCriteria: 2,
        delayed: false,
      }),
    ).toEqual({ score: 56, level: "中" });
    expect(
      calculateProjectRisk({
        highRisks: 2,
        blockedDays: 5,
        severeFailures: 4,
        dataNotReady: true,
        missingCriteria: 3,
        delayed: true,
      }).level,
    ).toBe("高");
  });
});
