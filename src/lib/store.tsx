"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AdoptionPlan,
  Asset,
  EvidenceDimension,
  EvalCase,
  EvalRun,
  EvalSuite,
  Hypothesis,
  OutcomeContract,
  PortalState,
  ProductionProfile,
  Project,
  Report,
  Review,
  ScenarioCard,
  Stakeholder,
  Workspace,
  WorkflowStep,
} from "./types";
import { blankScenario, createBlankStages, emptyState } from "./empty-state";
import {
  getMissingEvidenceDimensions,
  isEvidenceGateReady,
} from "./delivery-model";
import { normalizePortalState } from "./state-migration";
import type { DiagnosisSession } from "./diagnosis";
import { confirmDiagnosisProject } from "./diagnosis-project";

const STORAGE_KEY = "fde-portal-live-v2";

interface PortalContextValue {
  saveDiagnosis: (session: DiagnosisSession) => void;
  confirmDiagnosis: (sessionId: string, confirmedBy: string) => void;
  state: PortalState;
  hydrated: boolean;
  toast: string | null;
  createWorkspace: (workspace: Pick<Workspace, "name" | "type">) => void;
  createProject: (project: Partial<Project>) => void;
  updateOutcomeContract: (
    contract: Partial<OutcomeContract>,
    confirm?: boolean,
  ) => void;
  addStakeholder: (stakeholder: Omit<Stakeholder, "id">) => void;
  addWorkflowStep: (step: Omit<WorkflowStep, "id">) => void;
  addHypothesis: (
    hypothesis: Omit<Hypothesis, "id" | "status" | "evidence">,
  ) => void;
  updateHypothesis: (id: string, patch: Partial<Hypothesis>) => void;
  updateAdoptionPlan: (plan: Partial<Omit<AdoptionPlan, "items">>) => void;
  toggleAdoptionItem: (id: string) => void;
  updateProductionProfile: (
    profile: Partial<Omit<ProductionProfile, "items">>,
  ) => void;
  toggleProductionItem: (id: string) => void;
  updateScenario: (scenario: Partial<ScenarioCard>) => void;
  generateScenario: (
    answers: Record<string, string>,
  ) => Promise<Partial<ScenarioCard>>;
  confirmScenario: (preview: Partial<ScenarioCard>) => void;
  submitStageReview: (stageId: string) => void;
  attachEvidence: (stageId: string) => void;
  addAcceptanceCriterion: (
    stageId: string,
    title: string,
    dimension: EvidenceDimension,
  ) => void;
  toggleAcceptanceCriterion: (stageId: string, criterionId: string) => void;
  closeRisk: (riskId: string) => void;
  approveReview: (reviewId: string, status: Review["status"]) => void;
  createEvalSuite: (name: string) => void;
  addEvalCases: (suiteId: string, cases: EvalCase[]) => void;
  recordEvalRun: (
    suiteId: string,
    run: Omit<EvalRun, "id" | "createdAt">,
  ) => void;
  addAsset: (
    asset: Pick<Asset, "name" | "type" | "version" | "permission">,
  ) => void;
  promoteAsset: (id: string) => void;
  generateReport: (type: Report["type"]) => void;
  confirmReport: (id: string) => void;
  clearLocalData: () => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PortalState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let savedState: PortalState | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) savedState = normalizePortalState(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    queueMicrotask(() => {
      if (savedState) setState(savedState);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const activity = (
    text: string,
    tone: "neutral" | "success" | "warning" = "success",
  ) => ({
    id: uid("act"),
    text,
    actor: "当前用户",
    time: "刚刚",
    tone,
  });

  const value = useMemo<PortalContextValue>(
    () => ({
      state,
      hydrated,
      toast,
      saveDiagnosis: (session) => {
        setState((old) => ({
          ...old,
          diagnoses: old.diagnoses.some((item) => item.id === session.id)
            ? old.diagnoses.map((item) =>
                item.id === session.id && !item.confirmedAt ? session : item,
              )
            : [session, ...old.diagnoses],
        }));
      },
      confirmDiagnosis: (sessionId, confirmedBy) => {
        setState((old) => confirmDiagnosisProject(old, sessionId, confirmedBy));
      },
      createWorkspace: (workspace) => {
        setState((old) => ({
          ...old,
          workspace: { ...workspace, id: uid("ws"), members: 1 },
          flow: { ...old.flow, workspaceCreated: true },
          activities: [
            activity(`创建了 ${workspace.type}「${workspace.name}」`),
            ...old.activities,
          ],
        }));
        notify("Workspace 已创建并切换");
      },
      createProject: (project) => {
        const projectId = uid("project");
        setState((old) => ({
          ...old,
          project: {
            ...emptyState.project,
            ...project,
            id: projectId,
            updatedAt: "刚刚",
          },
          outcomeContract: {
            ...emptyState.outcomeContract,
            sponsor: project.businessOwner || "",
          },
          stakeholders: [],
          workflowSteps: [],
          hypotheses: [],
          adoptionPlan: {
            ...emptyState.adoptionPlan,
            items: emptyState.adoptionPlan.items.map((item) => ({ ...item })),
          },
          productionProfile: {
            ...emptyState.productionProfile,
            rollbackOwner: project.owner || "",
            items: emptyState.productionProfile.items.map((item) => ({
              ...item,
            })),
          },
          scenario: { ...blankScenario, id: uid("scenario") },
          stages: createBlankStages(),
          evalSuites: [],
          assets: [],
          risks: [],
          reviews: [],
          reports: [],
          flow: {
            ...emptyState.flow,
            workspaceCreated: Boolean(old.workspace.id),
            projectCreated: true,
            pocGenerated: true,
          },
          activities: [activity(`创建项目「${project.name || "未命名项目"}」`)],
        }));
        notify("项目已创建，已进入场景澄清阶段");
      },
      updateOutcomeContract: (contract, confirm = false) => {
        setState((old) => ({
          ...old,
          outcomeContract: {
            ...old.outcomeContract,
            ...contract,
            status: confirm ? "已确认" : old.outcomeContract.status,
          },
          activities: [
            activity(
              confirm ? "确认结果契约" : "更新结果契约",
              confirm ? "success" : "neutral",
            ),
            ...old.activities,
          ],
        }));
        notify(confirm ? "结果契约已确认" : "结果契约已保存");
      },
      addStakeholder: (stakeholder) => {
        setState((old) => ({
          ...old,
          stakeholders: [
            ...old.stakeholders,
            { ...stakeholder, id: uid("stakeholder") },
          ],
          activities: [
            activity(`登记干系人「${stakeholder.name}」`, "neutral"),
            ...old.activities,
          ],
        }));
        notify("干系人已加入现场发现地图");
      },
      addWorkflowStep: (step) => {
        setState((old) => ({
          ...old,
          workflowSteps: [
            ...old.workflowSteps,
            { ...step, id: uid("workflow") },
          ],
          activities: [
            activity(`补充英雄工作流节点「${step.name}」`, "neutral"),
            ...old.activities,
          ],
        }));
        notify("业务闭环节点已添加");
      },
      addHypothesis: (hypothesis) => {
        setState((old) => ({
          ...old,
          hypotheses: [
            {
              ...hypothesis,
              id: uid("hypothesis"),
              status: "待验证",
              evidence: "",
            },
            ...old.hypotheses,
          ],
          activities: [
            activity(`登记关键假设「${hypothesis.title}」`, "warning"),
            ...old.activities,
          ],
        }));
        notify("关键假设已登记");
      },
      updateHypothesis: (id, patch) => {
        setState((old) => ({
          ...old,
          hypotheses: old.hypotheses.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
          activities: [
            activity("更新假设实验结论", "neutral"),
            ...old.activities,
          ],
        }));
        notify("实验状态与证据已更新");
      },
      updateAdoptionPlan: (plan) => {
        setState((old) => ({
          ...old,
          adoptionPlan: { ...old.adoptionPlan, ...plan },
        }));
        notify("采纳指标已更新");
      },
      toggleAdoptionItem: (id) => {
        setState((old) => ({
          ...old,
          adoptionPlan: {
            ...old.adoptionPlan,
            items: old.adoptionPlan.items.map((item) =>
              item.id === id ? { ...item, completed: !item.completed } : item,
            ),
          },
          activities: [
            activity("更新组织采纳计划", "neutral"),
            ...old.activities,
          ],
        }));
        notify("采纳计划已更新");
      },
      updateProductionProfile: (profile) => {
        setState((old) => ({
          ...old,
          productionProfile: { ...old.productionProfile, ...profile },
        }));
        notify("生产运行边界已更新");
      },
      toggleProductionItem: (id) => {
        setState((old) => ({
          ...old,
          productionProfile: {
            ...old.productionProfile,
            items: old.productionProfile.items.map((item) =>
              item.id === id ? { ...item, completed: !item.completed } : item,
            ),
          },
          activities: [
            activity("更新生产就绪检查", "neutral"),
            ...old.activities,
          ],
        }));
        notify("生产就绪状态已更新");
      },
      updateScenario: (scenario) => {
        setState((old) => ({
          ...old,
          scenario: {
            ...old.scenario,
            ...scenario,
            version: old.scenario.version + 1,
            status: "草稿",
          },
          activities: [
            activity("更新了场景卡草稿", "neutral"),
            ...old.activities,
          ],
        }));
        notify("场景卡草稿已保存");
      },
      generateScenario: async (answers) => {
        const response = await fetch("/api/ai/scenario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        const payload = (await response.json()) as {
          output?: Partial<ScenarioCard>;
          error?: string;
        };
        if (!response.ok || !payload.output)
          throw new Error(payload.error || "DeepSeek 未返回有效场景卡");
        notify("DeepSeek 结构化结果已生成，请确认后写入");
        return payload.output;
      },
      confirmScenario: (preview) => {
        setState((old) => ({
          ...old,
          scenario: {
            ...old.scenario,
            ...preview,
            version: old.scenario.version + 1,
            status: "待评审",
          },
          flow: { ...old.flow, scenarioConfirmed: true },
          activities: [
            activity("确认 AI 场景卡预览并提交评审"),
            ...old.activities,
          ],
        }));
        notify("场景卡已确认写入，并创建评审记录");
      },
      submitStageReview: (stageId) => {
        setState((old) => {
          const stage = old.stages.find((item) => item.id === stageId);
          if (!stage || !isEvidenceGateReady(stage)) {
            const missingDimensions = stage
              ? getMissingEvidenceDimensions(stage)
              : [];
            notify(
              missingDimensions.length
                ? `门禁缺少${missingDimensions.join("、")}证据`
                : "阶段仍有阻塞项，请完成验收并补齐证据",
            );
            return old;
          }
          return {
            ...old,
            stages: old.stages.map((item) =>
              item.id === stageId
                ? { ...item, status: "待评审" as const }
                : item,
            ),
            reviews: [
              {
                id: uid("review"),
                type: "阶段门禁",
                title: `${stage.code} ${stage.name}阶段评审`,
                submitter: "当前用户",
                reviewer: "待分配",
                version: `v${old.scenario.version}`,
                status: "待评审",
                submittedAt: "刚刚",
              },
              ...old.reviews,
            ],
            flow: { ...old.flow, reviewSubmitted: true },
            activities: [
              activity(`提交 ${stage.code} 阶段门禁评审`),
              ...old.activities,
            ],
          };
        });
        notify("阶段评审已提交");
      },
      attachEvidence: (stageId) => {
        setState((old) => ({
          ...old,
          stages: old.stages.map((stage) =>
            stage.id === stageId
              ? {
                  ...stage,
                  evidenceCount: Math.min(
                    stage.criteriaTotal,
                    stage.evidenceCount + 1,
                  ),
                  blockers:
                    stage.evidenceCount + 1 >= stage.criteriaTotal
                      ? stage.blockers.filter(
                          (blocker) => !blocker.includes("证据"),
                        )
                      : stage.blockers,
                }
              : stage,
          ),
          activities: [activity("上传证据并关联到验收项"), ...old.activities],
        }));
        notify("证据已上传并完成有效性校验");
      },
      addAcceptanceCriterion: (stageId, title, dimension) => {
        setState((old) => ({
          ...old,
          stages: old.stages.map((stage) =>
            stage.id === stageId
              ? {
                  ...stage,
                  criteria: [
                    ...(stage.criteria || []),
                    { id: uid("criterion"), title, dimension, passed: false },
                  ],
                  criteriaTotal: stage.criteriaTotal + 1,
                }
              : stage,
          ),
          activities: [
            activity(`创建验收项「${title}」`, "neutral"),
            ...old.activities,
          ],
        }));
        notify("验收项已创建");
      },
      toggleAcceptanceCriterion: (stageId, criterionId) => {
        setState((old) => ({
          ...old,
          stages: old.stages.map((stage) => {
            if (stage.id !== stageId) return stage;
            const current = stage.criteria?.find(
              (item) => item.id === criterionId,
            );
            if (!current) return stage;
            return {
              ...stage,
              criteria: stage.criteria?.map((item) =>
                item.id === criterionId
                  ? { ...item, passed: !item.passed }
                  : item,
              ),
              criteriaPassed: Math.max(
                0,
                stage.criteriaPassed + (current.passed ? -1 : 1),
              ),
            };
          }),
          activities: [
            activity("更新验收项状态", "neutral"),
            ...old.activities,
          ],
        }));
        notify("验收状态已更新");
      },
      closeRisk: (riskId) => {
        setState((old) => ({
          ...old,
          risks: old.risks.map((risk) =>
            risk.id === riskId ? { ...risk, status: "已关闭" as const } : risk,
          ),
          stages: old.stages.map((stage) =>
            stage.code === "P3"
              ? {
                  ...stage,
                  blockers: stage.blockers.filter((_, index) => index !== 0),
                }
              : stage,
          ),
          activities: [
            activity("关闭高风险问题并加入回归集"),
            ...old.activities,
          ],
        }));
        notify("风险已关闭，并已加入回归测试");
      },
      approveReview: (reviewId, status) => {
        setState((old) => ({
          ...old,
          reviews: old.reviews.map((review) =>
            review.id === reviewId ? { ...review, status } : review,
          ),
          activities: [activity(`评审结论：${status}`), ...old.activities],
        }));
        notify(`评审已${status === "已通过" ? "通过" : "处理"}`);
      },
      createEvalSuite: (name) => {
        const suite: EvalSuite = {
          id: uid("eval"),
          name,
          version: "v0.1",
          threshold: 85,
          status: "草稿",
          caseCount: 0,
          cases: [],
          runs: [],
        };
        setState((old) => ({
          ...old,
          evalSuites: [suite, ...old.evalSuites],
          flow: { ...old.flow, evalCreated: true },
          activities: [
            activity(`创建 Eval Suite「${name}」`),
            ...old.activities,
          ],
        }));
        notify("Eval Suite 已创建");
      },
      addEvalCases: (suiteId, cases) => {
        setState((old) => ({
          ...old,
          evalSuites: old.evalSuites.map((suite) =>
            suite.id === suiteId
              ? {
                  ...suite,
                  cases: [...(suite.cases || []), ...cases],
                  caseCount: (suite.cases || []).length + cases.length,
                  status: "执行中" as const,
                }
              : suite,
          ),
          activities: [
            activity(`导入 ${cases.length} 条 Eval Case`),
            ...old.activities,
          ],
        }));
        notify(`已校验并导入 ${cases.length} 条案例`);
      },
      recordEvalRun: (suiteId, input) => {
        setState((old) => ({
          ...old,
          evalSuites: old.evalSuites.map((suite) => {
            if (suite.id !== suiteId) return suite;
            const run: EvalRun = {
              ...input,
              id: uid("run"),
              createdAt: new Date().toISOString().slice(0, 10),
            };
            return {
              ...suite,
              runs: [...suite.runs, run],
              status: "已完成" as const,
            };
          }),
          activities: [activity("登记一次新的 Eval Run"), ...old.activities],
        }));
        notify("Eval Run 已记录，版本对比已更新");
      },
      addAsset: (asset) => {
        setState((old) => ({
          ...old,
          assets: [
            {
              ...asset,
              id: uid("asset"),
              owner: "当前用户",
              status: "草稿",
              score: 0,
              reusable: false,
            },
            ...old.assets,
          ],
          flow: { ...old.flow, assetRegistered: true },
          activities: [
            activity(`登记 AI 资产「${asset.name}」`),
            ...old.activities,
          ],
        }));
        notify("AI 资产已登记");
      },
      promoteAsset: (id) => {
        setState((old) => ({
          ...old,
          assets: old.assets.map((asset) =>
            asset.id === id
              ? { ...asset, reusable: true, status: "可复用" as const }
              : asset,
          ),
          activities: [
            activity("将项目资产沉淀为团队可复用能力"),
            ...old.activities,
          ],
        }));
        notify("资产已进入团队复用目录");
      },
      generateReport: (type) => {
        setState((old) => ({
          ...old,
          reports: [
            {
              id: uid("report"),
              type,
              version: `v${old.reports.filter((report) => report.type === type).length + 1}.0`,
              status: "待确认",
              generatedAt: new Date().toISOString().slice(0, 10),
            },
            ...old.reports,
          ],
          flow: { ...old.flow, reportGenerated: true },
          activities: [activity(`生成${type}`), ...old.activities],
        }));
        notify(`${type}已生成，可在线预览`);
      },
      confirmReport: (id) => {
        setState((old) => ({
          ...old,
          reports: old.reports.map((report) =>
            report.id === id
              ? { ...report, status: "已确认" as const }
              : report,
          ),
        }));
        notify("业务负责人已确认报告");
      },
      clearLocalData: () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(emptyState);
        notify("本地业务数据已清空");
      },
    }),
    [state, hydrated, toast, notify],
  );

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("usePortal 必须在 PortalProvider 内使用");
  return context;
}
