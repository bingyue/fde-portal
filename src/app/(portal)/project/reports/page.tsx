"use client";

import {
  CheckCircle2,
  Download,
  Eye,
  FileBarChart2,
  FileCheck2,
  FileText,
  Plus,
  Printer,
} from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Modal,
  PageHeader,
  Progress,
  SectionTitle,
} from "@/components/ui";
import { useDemo } from "@/lib/store";
import type { Report } from "@/lib/types";
import {
  calculateEvidenceCoverage,
  calculateScenarioCompleteness,
} from "@/lib/metrics";

const reportMeta: Record<
  Report["type"],
  { icon: typeof FileText; desc: string }
> = {
  POC立项书: {
    icon: FileText,
    desc: "业务问题、价值假设、场景边界与 POC 计划",
  },
  Eval评测报告: {
    icon: FileBarChart2,
    desc: "版本对比、失败分析、成本与延迟表现",
  },
  POC验收报告: { icon: FileCheck2, desc: "验收结论、证据覆盖、风险与生产建议" },
};

export default function ReportsPage() {
  const { state, generateReport, confirmReport } = useDemo();
  const [preview, setPreview] = useState<Report | null>(null);
  const latestRun = state.evalSuites[0]?.runs.at(-1);
  const scenario = state.scenario;
  const scenarioCompleteness = calculateScenarioCompleteness({
    requiredFields: [
      scenario.name,
      scenario.department,
      scenario.businessOwner,
      scenario.trigger,
      scenario.input,
      scenario.currentProcess,
      scenario.aiTask,
      scenario.targetMetrics,
      scenario.humanBoundary,
      scenario.dataSources,
    ],
    hasBaseline: !!scenario.baseline,
    hasDataConditions: !!scenario.dataSources,
    hasRiskBoundary: !!scenario.humanBoundary,
    hasAcceptanceStandard: !!scenario.threshold,
  });
  const criteriaTotal = state.stages.reduce(
    (sum, stage) => sum + stage.criteriaTotal,
    0,
  );
  const evidenceCoverage = calculateEvidenceCoverage(
    state.stages.reduce((sum, stage) => sum + stage.evidenceCount, 0),
    criteriaTotal,
  );
  const riskClosure = state.risks.length
    ? Math.round(
        (state.risks.filter((risk) => risk.status === "已关闭").length /
          state.risks.length) *
          100,
      )
    : 0;
  const htmlExport = () => {
    if (!preview) return;
    const blob = new Blob(
      [
        `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${preview.type}</title><body><h1>${state.project.name} · ${preview.type}</h1><p>${state.project.goal}</p><p>Eval通过率：${latestRun?.successRate}%</p><p>版本：${preview.version}</p></body></html>`,
      ],
      { type: "text/html" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preview.type}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="REPORTS & ACCEPTANCE"
        title="报告与验收"
        description="从结构化项目数据生成可追溯报告；支持在线预览、业务确认、HTML 导出与浏览器打印 PDF。"
        actions={
          <Button onClick={() => generateReport("POC验收报告")}>
            <Plus size={14} />
            生成验收报告
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {(Object.keys(reportMeta) as Report["type"][]).map((type) => {
          const meta = reportMeta[type];
          const report = state.reports.find((item) => item.type === type);
          const Icon = meta.icon;
          return (
            <section key={type} className="card flex min-h-72 flex-col p-5">
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon size={20} />
                </span>
                {report && (
                  <Badge
                    tone={
                      report.status === "已确认"
                        ? "success"
                        : report.status === "待确认"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {report.status}
                  </Badge>
                )}
              </div>
              <h2 className="mt-5 font-bold">{type}</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                {meta.desc}
              </p>
              {report ? (
                <div className="mt-auto pt-6">
                  <div className="mb-4 flex justify-between border-t border-[var(--line)] pt-3 text-[10px] text-[var(--muted)]">
                    <span>{report.version}</span>
                    <span>{report.generatedAt}</span>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setPreview(report)}
                  >
                    <Eye size={14} />
                    在线预览
                  </Button>
                </div>
              ) : (
                <Button
                  className="mt-auto"
                  onClick={() => generateReport(type)}
                >
                  生成报告
                </Button>
              )}
            </section>
          );
        })}
      </div>
      <section className="card mt-6 p-5 sm:p-6">
        <SectionTitle title="验收准备度" meta="基于当前项目数据自动计算" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["场景与边界", scenarioCompleteness],
            ["Eval目标达成", latestRun?.successRate || 0],
            ["证据覆盖", evidenceCoverage],
            ["风险关闭", riskClosure],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="border-l-2 border-[var(--line)] pl-4"
            >
              <div className="mb-3 flex justify-between">
                <span className="text-xs text-[var(--muted)]">{label}</span>
                <b className="font-data text-xs">{value}%</b>
              </div>
              <Progress
                value={Number(value)}
                tone={Number(value) < 70 ? "warning" : "success"}
              />
            </div>
          ))}
        </div>
      </section>
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.type} · ${preview.version}` : "报告预览"}
        description="由 FDE Portal 结构化项目数据生成"
        wide
      >
        {preview && (
          <article className="text-sm leading-7">
            <div className="border-b-4 border-[var(--primary)] pb-6">
              <p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-[var(--primary)]">
                FDE PORTAL · ACCEPTANCE EVIDENCE
              </p>
              <h1 className="mt-3 text-3xl font-bold">{state.project.name}</h1>
              <p className="mt-2 text-[var(--muted)]">
                {preview.type} · {preview.version} · {preview.generatedAt}
              </p>
            </div>
            <section className="py-6">
              <h2 className="mb-3 font-bold">01 · 项目目标</h2>
              <p>{state.project.goal}</p>
            </section>
            <section className="grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
              {[
                ["场景完整度", `${scenarioCompleteness}%`],
                ["Eval通过率", `${latestRun?.successRate || 0}%`],
                ["证据覆盖率", `${evidenceCoverage}%`],
                ["单位有效成本", latestRun ? `¥${latestRun.cost}` : "—"],
              ].map(([label, value]) => (
                <div key={label} className="bg-[var(--surface)] p-4">
                  <span className="text-[10px] text-[var(--muted)]">
                    {label}
                  </span>
                  <b className="font-data mt-2 block text-xl">{value}</b>
                </div>
              ))}
            </section>
            <section className="py-6">
              <h2 className="mb-3 font-bold">02 · 验收结论</h2>
              <p>
                {latestRun
                  ? `最新 Eval Run 通过率为 ${latestRun.successRate}%，记录 ${latestRun.severeFailures} 条严重失败。`
                  : "当前尚无 Eval Run，无法形成技术验收结论。"}
              </p>
            </section>
            <section className="rounded-r-[var(--radius-md)] border-l-4 border-[var(--warning)] bg-[var(--warning-soft)] p-4">
              <b>生产决策建议</b>
              <p className="mt-1 text-xs text-[var(--muted)]">
                仅在场景、Eval、证据和风险均达到项目验收标准后做生产决策。
              </p>
            </section>
            <div className="no-print mt-7 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={htmlExport}>
                <Download size={14} />
                导出 HTML
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer size={14} />
                打印 / PDF
              </Button>
              <Button
                onClick={() => confirmReport(preview.id)}
                disabled={preview.status === "已确认"}
              >
                <CheckCircle2 size={14} />
                {preview.status === "已确认" ? "业务已确认" : "业务负责人确认"}
              </Button>
            </div>
          </article>
        )}
      </Modal>
    </div>
  );
}
