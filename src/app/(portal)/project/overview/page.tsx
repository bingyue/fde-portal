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
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Progress,
  SectionTitle,
} from "@/components/ui";
import { useDemo } from "@/lib/store";
import {
  calculateEvidenceCoverage,
  calculateProjectRisk,
  calculateScenarioCompleteness,
} from "@/lib/metrics";

export default function ProjectOverview() {
  const { state } = useDemo();
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
      <section className="mb-6 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-6">
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
              className="text-xs font-bold text-[#567c13]"
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
                className="border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:-translate-y-0.5 hover:border-[#9dbb61]"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span
                    className={`font-data grid size-7 place-items-center text-[10px] font-extrabold ${stage.status === "已通过" ? "bg-[#b8f34b] text-[#10223e]" : "bg-[#edf1f4] text-[#738093] dark:bg-[#15273b]"}`}
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
          <section className="border border-[#b5ce7d] bg-[#f2f8e7] p-5 dark:border-[#486824] dark:bg-[#172b18]">
            <div className="flex items-center gap-2 text-[#527411] dark:text-[#b8f34b]">
              <Sparkles size={16} />
              <b>下一步建议</b>
            </div>
            <p className="mt-3 text-sm leading-6">
              {completeness < 80
                ? "先完成场景卡的业务基线、数据来源和验收阈值，再设计 Eval。"
                : !latest
                  ? "场景信息已具备基础条件，可以创建第一套 Eval Suite。"
                  : "根据最新 Eval 结果补齐证据并处理开放风险。"}
            </p>
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
