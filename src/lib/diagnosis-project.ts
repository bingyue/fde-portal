import { blankScenario, createBlankStages } from "./empty-state";
import { isProposalReady } from "./diagnosis";
import type { PortalState } from "./types";

/** Explicit customer confirmation is the only operation that writes a proposal into the project. */
export function confirmDiagnosisProject(
  state: PortalState,
  sessionId: string,
  confirmedBy: string,
): PortalState {
  const session = state.diagnoses.find((item) => item.id === sessionId);
  if (!session || session.confirmedAt) return state;
  if (
    !isProposalReady(session.result) ||
    session.messages.at(-1)?.role !== "assistant" ||
    !confirmedBy.trim()
  )
    return state;
  // Prevent an older customer session from modifying a different current project.
  if ((session.projectId || "") !== state.project.id) return state;
  const { facts, plan } = session.result!;
  const proposal = plan!;
  const timestamp = new Date().toISOString();
  const projectId = state.project.id || crypto.randomUUID();
  const stages = state.stages.length ? state.stages : createBlankStages();
  return {
    ...state,
    workspace: state.workspace.id
      ? state.workspace
      : {
          id: crypto.randomUUID(),
          name: facts.organization,
          type: "企业空间",
          members: 1,
        },
    project: {
      ...state.project,
      id: projectId,
      name: state.project.name || proposal.title,
      organization: state.project.organization || facts.organization,
      type: state.project.type || "企业POC",
      goal: facts.goal,
      businessOwner: facts.owner,
      owner: state.project.owner || facts.owner,
      status: state.project.status || "进行中",
      stage: state.project.stage || "P0 场景立项",
      updatedAt: timestamp,
    },
    scenario: {
      ...(state.project.id ? state.scenario : blankScenario),
      id: state.scenario.id || crypto.randomUUID(),
      name: proposal.title,
      department: facts.organization,
      users: facts.users,
      businessOwner: facts.owner,
      currentProcess: facts.workflow,
      baseline: facts.baseline,
      aiTask: facts.scope,
      targetOutput: facts.goal,
      targetMetrics: facts.acceptance,
      humanBoundary: facts.humanBoundary,
      exclusions: facts.exclusions,
      dataSources: facts.data,
      workflow: proposal.solution,
      testRequirements: proposal.criteria.map((c) => c.title).join("\n"),
      acceptanceOwner: facts.owner,
      threshold: facts.acceptance,
      valueTarget: facts.goal,
      version: state.scenario.version + 1,
      status: "待评审",
    },
    outcomeContract: {
      ...state.outcomeContract,
      sponsor: facts.owner,
      baselineValue: facts.baseline,
      targetValue: facts.goal,
      successCondition: facts.acceptance,
      stopCondition: proposal.stopCondition,
      status: "草稿",
    },
    stages: stages.map((stage) => {
      const milestones = proposal.milestones.filter(
        (item) => item.stage === stage.code,
      );
      const criteria =
        stage.code === "P3"
          ? [
              ...(stage.criteria || []),
              ...proposal.criteria.map((c) => ({
                ...c,
                id: crypto.randomUUID(),
                passed: false,
              })),
            ]
          : stage.criteria || [];
      return {
        ...stage,
        objective: milestones.length
          ? milestones.map((m) => `${m.title}：${m.deliverable}`).join("\n")
          : stage.objective,
        owner: milestones[0]?.owner || stage.owner,
        dueDate: milestones[0]?.timing || stage.dueDate,
        criteria,
        criteriaTotal: criteria.length,
      };
    }),
    risks: [
      ...state.risks,
      ...proposal.risks.map((title) => ({
        id: crypto.randomUUID(),
        title,
        level: "中" as const,
        status: "开放" as const,
        owner: facts.owner,
      })),
    ],
    reviews: [
      {
        id: crypto.randomUUID(),
        type: "POC方案",
        title: `${proposal.title} · 客户已确认，待内部评审`,
        submitter: confirmedBy.trim(),
        reviewer: facts.owner,
        version: `v${state.scenario.version + 1}`,
        status: "待评审",
        submittedAt: timestamp,
      },
      ...state.reviews,
    ],
    diagnoses: state.diagnoses.map((item) =>
      item.id === sessionId
        ? {
            ...item,
            projectId,
            confirmedBy: confirmedBy.trim(),
            confirmedAt: timestamp,
          }
        : item,
    ),
    flow: {
      ...state.flow,
      workspaceCreated: true,
      projectCreated: true,
      scenarioConfirmed: true,
      pocGenerated: true,
      reviewSubmitted: true,
    },
    activities: [
      {
        id: crypto.randomUUID(),
        text: `客户 ${confirmedBy.trim()} 确认诊断方案「${proposal.title}」`,
        actor: "岚舟 · AI 顾问",
        time: timestamp,
        tone: "success",
      },
      ...state.activities,
    ],
  };
}
