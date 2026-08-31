export interface CompletenessInput {
  requiredFields: Array<unknown>;
  hasBaseline: boolean;
  hasDataConditions: boolean;
  hasRiskBoundary: boolean;
  hasAcceptanceStandard: boolean;
}

export function calculateScenarioCompleteness(
  input: CompletenessInput,
): number {
  const fieldScore =
    input.requiredFields.length === 0
      ? 0
      : input.requiredFields.filter(
          (value) => String(value ?? "").trim().length > 0,
        ).length / input.requiredFields.length;
  const readiness =
    [
      input.hasBaseline,
      input.hasDataConditions,
      input.hasRiskBoundary,
      input.hasAcceptanceStandard,
    ].filter(Boolean).length / 4;
  return Math.round((fieldScore * 0.6 + readiness * 0.4) * 100);
}

export function calculateEvalPassRate(
  passed: number,
  completed: number,
): number {
  if (completed <= 0) return 0;
  return Math.round((Math.max(0, passed) / completed) * 100);
}

export function calculateEvidenceCoverage(
  withEvidence: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return Math.round((Math.max(0, withEvidence) / total) * 100);
}

export function calculateUnitEffectiveCost(input: {
  modelCost: number;
  toolCost: number;
  reviewCost: number;
  reworkCost: number;
  acceptedResults: number;
}): number {
  if (input.acceptedResults <= 0) return 0;
  return Number(
    (
      (input.modelCost + input.toolCost + input.reviewCost + input.reworkCost) /
      input.acceptedResults
    ).toFixed(2),
  );
}

export function calculateProjectRisk(input: {
  highRisks: number;
  blockedDays: number;
  severeFailures: number;
  dataNotReady: boolean;
  missingCriteria: number;
  delayed: boolean;
}): { score: number; level: "低" | "中" | "高" } {
  const score = Math.min(
    100,
    input.highRisks * 18 +
      Math.min(input.blockedDays, 10) * 2 +
      input.severeFailures * 8 +
      (input.dataNotReady ? 15 : 0) +
      Math.min(input.missingCriteria, 5) * 5 +
      (input.delayed ? 12 : 0),
  );
  return { score, level: score >= 60 ? "高" : score >= 30 ? "中" : "低" };
}
