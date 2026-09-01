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
  Asset,
  PortalState,
  EvalCase,
  EvalRun,
  EvalSuite,
  Project,
  Report,
  Review,
  ScenarioCard,
  Workspace,
} from "./types";
import { blankScenario, createBlankStages, emptyState } from "./empty-state";
import { normalizePortalState } from "./state-migration";

const STORAGE_KEY = "fde-portal-live-v2";

interface PortalContextValue {
  state: PortalState;
  hydrated: boolean;
  toast: string | null;
  createWorkspace: (workspace: Pick<Workspace, "name" | "type">) => void;
  createProject: (project: Partial<Project>) => void;
  updateScenario: (scenario: Partial<ScenarioCard>) => void;
  generateScenario: (
    answers: Record<string, string>,
  ) => Promise<Partial<ScenarioCard>>;
  confirmScenario: (preview: Partial<ScenarioCard>) => void;
  submitStageReview: (stageId: string) => void;
  attachEvidence: (stageId: string) => void;
  addAcceptanceCriterion: (stageId: string, title: string) => void;
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
          if (!stage || stage.blockers.length > 0) {
            notify("阶段仍有阻塞项，请先关闭风险并补齐证据");
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
      addAcceptanceCriterion: (stageId, title) => {
        setState((old) => ({
          ...old,
          stages: old.stages.map((stage) =>
            stage.id === stageId
              ? {
                  ...stage,
                  criteria: [
                    ...(stage.criteria || []),
                    { id: uid("criterion"), title, passed: false },
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
