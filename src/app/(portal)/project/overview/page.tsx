"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Check,
  CircleDollarSign,
  Database,
  FileCheck2,
  Gauge,
  ListChecks,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Progress,
  SectionTitle,
} from "@/components/ui";
import { usePortal } from "@/lib/store";
import {
  calculateAdoptionRate,
  calculateChecklistProgress,
  calculateEvidenceCoverage,
  calculateProjectRisk,
  calculateRoi,
  calculateScenarioCompleteness,
} from "@/lib/metrics";

export default function ProjectOverview() {
  const { state } = usePortal();
  const s = state.scenario;
  const completeness = calculateScenarioCompleteness({
    requiredFields: [
      s.name,
      s.department,
      s.businessOwner,
      s.trigger,
      s.input,
      s.currentProcess,
      s.aiTask,
      s.targetMetrics,
      s.humanBoundary,
      s.dataSources,
    ],
    hasBaseline: !!s.baseline,
    hasDataConditions: !!s.dataSources,
    hasRiskBoundary: !!s.humanBoundary,
    hasAcceptanceStandard: !!s.threshold,
  });
  const dataReadiness = Math.round(
    ([s.input, s.dataSources, s.businessRules, s.sensitiveLevel].filter(
      (value) => value.trim(),
    ).length /
      4) *
      100,
  );
  const total = state.stages.reduce((sum, item) => sum + item.criteriaTotal, 0);
  const evidence = state.stages.reduce(
    (sum, item) => sum + item.evidenceCount,
    0,
  );
  const coverage = calculateEvidenceCoverage(evidence, total);
  const latest = state.evalSuites[0]?.runs.at(-1);
  const openRisks = state.risks.filter((item) => item.status !== "已关闭");
  const risk = calculateProjectRisk({
    highRisks: openRisks.filter((item) => item.level === "高").length,
    blockedDays: 0,
    severeFailures: latest?.severeFailures || 0,
    dataNotReady: dataReadiness < 60,
    missingCriteria:
      total - state.stages.reduce((sum, item) => sum + item.criteriaPassed, 0),
    delayed: false,
  });
  const hypothesisProgress = calculateChecklistProgress(
    state.hypotheses.filter((item) => item.status === "已验证").length,
    state.hypotheses.length,
  );
  const productionProgress = calculateChecklistProgress(
    state.productionProfile.items.filter((item) => item.completed).length,
    state.productionProfile.items.length,
  );
  const adoptionChecklist = calculateChecklistProgress(
    state.adoptionPlan.items.filter((item) => item.completed).length,
    state.adoptionPlan.items.length,
  );
  const adoptionRate = calculateAdoptionRate(
    state.adoptionPlan.activeUsers,
    state.adoptionPlan.targetUsers,
  );
  const stageProgress = calculateChecklistProgress(
    state.stages.filter((item) => item.status === "已通过").length,
    state.stages.length,
  );
  const technicalSpiral = Math.round(
    completeness * 0.2 +
      hypothesisProgress * 0.2 +
      (latest ? 20 : 0) +
      stageProgress * 0.2 +
      productionProgress * 0.2,
  );
  const stakeholderCoverage = calculateChecklistProgress(
    new Set(state.stakeholders.map((item) => item.level)).size,
    3,
  );
  const organizationalSpiral = Math.round(
    (state.outcomeContract.status === "已确认" ? 20 : 0) +
      stakeholderCoverage * 0.2 +
      Math.min(20, state.workflowSteps.length * 5) +
      adoptionChecklist * 0.2 +
      adoptionRate * 0.2,
  );
  const roi = calculateRoi(
    state.outcomeContract.annualValue,
    state.outcomeContract.annualCost,
  );
  const biggestUnknown = state.hypotheses.find(
    (item) => item.uncertainty === "高" && item.status === "待验证",
  );
  const metrics = [
    ["场景完整度", `${completeness}%`, "来自场景卡", Target, completeness],
    [
      "数据准备度",
      `${dataReadiness}%`,
      "来自数据字段",
      Database,
      dataReadiness,
    ],
    [
      "Eval 通过率",
      `${latest?.successRate || 0}%`,
      latest ? `阈值 ≥${state.evalSuites[0]?.threshold}%` : "尚无 Eval Run",
      Gauge,
      latest?.successRate || 0,
    ],
    [
      "证据覆盖率",
      `${coverage}%`,
      total ? `${evidence}/${total} 项已绑定` : "尚无验收项",
      FileCheck2,
      coverage,
    ],
    [
      "单位有效结果成本",
      latest ? `¥${latest.cost.toFixed(2)}` : "—",
      latest ? "来自最新 Run" : "尚无成本记录",
      CircleDollarSign,
      latest ? Math.max(0, 100 - latest.cost * 50) : 0,
    ],
    [
      "项目风险",
      risk.level,
      `${risk.score}/100 风险分`,
      AlertTriangle,
      100 - risk.score,
    ],
  ] as const;
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="PROJECT CONTROL ROOM"
        title={state.project.name}
        description={state.project.goal}
        actions={
          <>
            <Link href="/project/scenario">
              <Button variant="secondary">填写场景卡</Button>
            </Link>
            <Link href="/project/reports">
              <Button>报告与验收</Button>
            </Link>
          </>
        }
      />
      <section className="mb-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="grid lg:grid-cols-[1fr_1fr_.8fr]">
          <div className="border-b border-[var(--line)] p-5 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                <Workflow size={17} />
              </span>
              <div>
                <b className="text-sm">技术价值螺旋</b>
                <p className="text-[10px] text-[var(--muted)]">
                  发现 → 实验 → Eval → 生产
                </p>
              </div>
              <b className="font-data ml-auto text-xl">{technicalSpiral}%</b>
            </div>
            <Progress value={technicalSpiral} />
          </div>
          <div className="border-b border-[var(--line)] p-5 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-[var(--success-soft)] text-[var(--success)]">
                <UsersRound size={17} />
              </span>
              <div>
                <b className="text-sm">组织采纳螺旋</b>
                <p className="text-[10px] text-[var(--muted)]">
                  共识 → 共创 → 采纳 → 制度化
                </p>
              </div>
              <b className="font-data ml-auto text-xl">
                {organizationalSpiral}%
              </b>
            </div>
            <Progress value={organizationalSpiral} tone="success" />
          </div>
          <div className="bg-[var(--primary-soft)] p-5">
            <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--primary)]">
              当前最大不确定性
            </span>
            <p className="mt-3 text-xs font-semibold leading-5">
              {biggestUnknown?.title ||
                "尚未登记高不确定性假设，请先识别最可能让项目失败的未知条件。"}
            </p>
            <Link
              href="/project/experiments"
              className="mt-4 inline-block text-xs font-bold text-[var(--primary)]"
            >
              进入实验中心 →
            </Link>
          </div>
        </div>
      </section>
      <section className="mb-6 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map(([label, value, hint, Icon, progress]) => (
          <div key={label} className="bg-[var(--surface)] p-4">
            <div className="mb-5 flex items-center justify-between text-[var(--muted)]">
              <span className="text-[11px] font-semibold">{label}</span>
              <Icon size={15} />
            </div>
            <b className="font-data block text-2xl">{value}</b>
            <p className="mb-3 mt-1 text-[10px] text-[var(--muted)]">{hint}</p>
            <Progress
              value={Number(progress)}
              tone={label === "项目风险" ? "warning" : "signal"}
            />
          </div>
        ))}
      </section>
      <section className="card mb-6 p-5 sm:p-6">
        <SectionTitle
          title="POC 阶段门禁"
          meta="阶段框架已创建，验收数据等待真实录入"
          action={
            <Link
              href="/project/poc"
              className="text-xs font-bold text-[var(--primary)]"
            >
              进入工作台 →
            </Link>
          }
        />
        <div className="grid gap-3 lg:grid-cols-6">
          {state.stages.map((stage) => {
            const progress = stage.criteriaTotal
              ? (stage.criteriaPassed / stage.criteriaTotal) * 100
              : 0;
            return (
              <Link
                href="/project/poc"
                key={stage.id}
                className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--primary-border)] hover:shadow-[var(--shadow)]"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span
                    className={`font-data grid size-7 place-items-center rounded-[var(--radius-sm)] text-[10px] font-extrabold ${stage.status === "已通过" ? "bg-[var(--success)] text-white" : "bg-[var(--surface-hover)] text-[var(--muted)]"}`}
                  >
                    {stage.status === "已通过" ? (
                      <Check size={13} />
                    ) : (
                      stage.code
                    )}
                  </span>
                  <Badge
                    tone={
                      stage.status === "已通过"
                        ? "success"
                        : stage.status === "进行中"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {stage.status}
                  </Badge>
                </div>
                <b className="text-sm">
                  {stage.code} {stage.name}
                </b>
                <p className="mt-2 text-[10px] text-[var(--muted)]">
                  验收 {stage.criteriaPassed}/{stage.criteriaTotal} · 证据{" "}
                  {stage.evidenceCount}
                </p>
                <Progress value={progress} />
              </Link>
            );
          })}
        </div>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <section className="card p-5">
          <SectionTitle title="当前阶段验收项" meta="只展示真实创建的验收项" />
          {total ? (
            <div className="py-6 text-center text-xs text-[var(--muted)]">
              已创建 {total} 项验收标准，请前往 POC 工作台查看。
            </div>
          ) : (
            <EmptyState
              icon={<ListChecks size={20} />}
              title="尚无验收项"
              description="进入 POC 工作台，为当前阶段建立可验证的验收标准。"
              action={
                <Link href="/project/poc">
                  <Button>创建验收项</Button>
                </Link>
              }
            />
          )}
        </section>
        <aside className="space-y-6">
          <section className="rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-5">
            <div className="flex items-center gap-2 text-[var(--primary-ink)]">
              <Sparkles size={16} />
              <b>下一步建议</b>
            </div>
            <p className="mt-3 text-sm leading-6">
              {state.outcomeContract.status !== "已确认"
                ? "先确认结果契约，锁定基线、目标值、价值公式与停止条件。"
                : biggestUnknown
                  ? "优先验证当前高不确定性假设，不要用功能完成度掩盖未知风险。"
                  : completeness < 80
                    ? "补齐场景卡的数据来源、人机边界和验收阈值。"
                    : !latest
                      ? "场景信息已具备基础条件，可以创建第一套 Eval Suite。"
                      : productionProgress < 100
                        ? "技术证据已形成，下一步补齐采纳与生产就绪检查。"
                        : "交付闭环已具备生产决策条件，准备结果验收与能力沉淀。"}
            </p>
            {state.outcomeContract.annualCost > 0 && (
              <p className="font-data mt-3 text-xs font-bold text-[var(--primary)]">
                当前结果契约预期 ROI：{roi}%
              </p>
            )}
          </section>
          <section className="card p-5">
            <SectionTitle title="未关闭风险" meta={`${openRisks.length} 项`} />
            {openRisks.length ? (
              openRisks.map((item) => (
                <div
                  key={item.id}
                  className="border-t border-[var(--line)] py-3 first:border-t-0"
                >
                  <Badge tone={item.level === "高" ? "danger" : "warning"}>
                    {item.level}风险
                  </Badge>
                  <p className="mt-2 text-xs leading-5">{item.title}</p>
                </div>
              ))
            ) : (
              <p className="border-t border-[var(--line)] py-6 text-center text-xs text-[var(--muted)]">
                尚未登记风险
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
