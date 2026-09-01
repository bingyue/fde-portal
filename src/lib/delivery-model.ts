import type { EvidenceDimension, PocStage } from "./types";

const stageDimensions: Record<string, EvidenceDimension[]> = {
  P0: ["业务"],
  P1: ["业务", "采纳"],
  P2: ["技术"],
  P3: ["技术"],
  P4: ["业务", "采纳"],
  P5: ["技术", "业务", "采纳"],
};

export function getRequiredEvidenceDimensions(
  stageCode: string,
): EvidenceDimension[] {
  return stageDimensions[stageCode] || ["技术"];
}

export function getMissingEvidenceDimensions(
  stage: PocStage,
): EvidenceDimension[] {
  const present = new Set(
    (stage.criteria || [])
      .filter((criterion) => criterion.passed)
      .map((criterion) => criterion.dimension),
  );
  return getRequiredEvidenceDimensions(stage.code).filter(
    (dimension) => !present.has(dimension),
  );
}

export function isEvidenceGateReady(stage: PocStage): boolean {
  return (
    stage.criteriaTotal > 0 &&
    stage.criteriaPassed === stage.criteriaTotal &&
    stage.evidenceCount >= stage.criteriaTotal &&
    stage.blockers.length === 0 &&
    getMissingEvidenceDimensions(stage).length === 0
  );
}
