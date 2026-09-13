"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileCheck2,
  KeyRound,
  MessagesSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePortal } from "@/lib/store";
import {
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Progress,
  SectionTitle,
} from "@/components/ui";

export default function DashboardPage() {
  const { state } = usePortal();
  const [aiConfigured, setAiConfigured] = useState(false);
  useEffect(() => {
    void fetch("/api/ai/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { configured?: boolean }) =>
        setAiConfigured(Boolean(data.configured)),
      );
  }, []);
  if (!state.project.id)
    return (
      <div className="animate-rise">
        <PageHeader
          eyebrow="GET STARTED"
          title="开始你的 AI 项目"
          description="和岚舟聊聊业务问题，或直接创建项目。"
          actions={
            <Link href="/projects/new">
              <Button>
                <Plus size={15} />
                创建项目
              </Button>
            </Link>
          }
        />
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Link
            href="/chat"
            className="card p-5 transition hover:border-[var(--primary-border)]"
          >
            <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
              <MessagesSquare size={18} />
            </span>
            <b className="mt-5 block">与岚舟诊断场景</b>
            <p className="mt-1 text-xs text-[var(--muted)]">
              逐步梳理需求，一起确认 POC 方案
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]">
              开始对话 <ArrowRight size={12} />
            </span>
          </Link>
          <Link
            href="/settings/ai"
            className="card group p-5 transition hover:border-[var(--primary-border)]"
          >
            <span
              className={`grid size-10 place-items-center rounded-[var(--radius-md)] ${aiConfigured ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--warning-soft)] text-[var(--warning)]"}`}
            >
              <KeyRound size={18} />
            </span>
            <b className="mt-5 block">DeepSeek API</b>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {aiConfigured ? "真实模型连接已配置" : "等待密钥文件或 API Key"}
            </p>
            <Badge tone={aiConfigured ? "success" : "warning"} className="mt-4">
              {aiConfigured ? "已连接" : "待配置"}
            </Badge>
          </Link>
          <Link
            href="/projects/new"
            className="card group p-5 transition hover:border-[var(--primary-border)]"
          >
            <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
              <BriefcaseBusiness size={18} />
            </span>
            <b className="mt-5 block">第一个项目</b>
            <p className="mt-1 text-xs text-[var(--muted)]">
              从空白业务目标与场景卡开始
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]">
              创建项目 <ArrowRight size={12} />
            </span>
          </Link>
        </div>
        <EmptyState
          icon={<Sparkles size={20} />}
          title="还没有项目"
          description="确认诊断方案或创建项目后，即可继续完善场景卡、评测与验收。"
        />
      </div>
    );

  const latestRun = state.evalSuites[0]?.runs.at(-1);
  const evidenceTotal = state.stages.reduce(
    (sum, stage) => sum + stage.evidenceCount,
    0,
  );
  const criteriaTotal = state.stages.reduce(
    (sum, stage) => sum + stage.criteriaTotal,
    0,
  );
  const coverage = criteriaTotal
    ? Math.round((evidenceTotal / criteriaTotal) * 100)
    : 0;
  const openRisks = state.risks.filter((risk) => risk.status !== "已关闭");
  const pendingReviews = state.reviews.filter(
    (review) => review.status === "待评审",
  );
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="PROJECT DELIVERY"
        title="项目交付工作台"
        description="所有指标来自当前项目的真实记录；未录入的数据保持为空或 0。"
        actions={
          <Link href="/projects/new">
            <Button>
              <Plus size={15} />
              创建新项目
            </Button>
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          [
            FileCheck2,
            String(pendingReviews.length),
            "待评审",
            pendingReviews.length ? "warning" : "neutral",
          ],
          [
            AlertTriangle,
            String(openRisks.length),
            "开放风险",
            openRisks.some((risk) => risk.level === "高")
              ? "danger"
              : "neutral",
          ],
          [
            CheckCircle2,
            `${coverage}%`,
            "证据覆盖率",
            coverage >= 80 ? "success" : "neutral",
          ],
        ].map(([Icon, value, label, tone]) => (
          <div key={String(label)} className="card flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
              <Icon size={20} />
            </span>
            <div className="flex-1">
              <b className="font-data text-2xl">{String(value)}</b>
              <p className="text-xs text-[var(--muted)]">{String(label)}</p>
            </div>
            <Badge tone={tone as "neutral" | "success" | "warning" | "danger"}>
              实时
            </Badge>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="card p-5 sm:p-6">
          <SectionTitle
            title="当前项目"
            meta="最近创建"
            action={
              <Link
                href="/project/overview"
                className="text-xs font-semibold text-[var(--primary)]"
              >
                进入项目 →
              </Link>
            }
          />
          <div className="grid gap-4 border-t border-[var(--line)] pt-5 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <b>{state.project.name}</b>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {state.project.organization || "未设置组织"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--muted)]">当前阶段</span>
              <p className="mt-2">
                <Badge tone="info">
                  {state.project.stage || "P0 场景立项"}
                </Badge>
              </p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--muted)]">
                Eval 通过率
              </span>
              <div className="mt-3">
                <Progress
                  value={latestRun?.successRate || 0}
                  label={`${latestRun?.successRate || 0}%`}
                  tone="success"
                />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[var(--muted)]">证据覆盖</span>
              <div className="mt-3">
                <Progress value={coverage} label={`${coverage}%`} />
              </div>
            </div>
          </div>
        </section>
        <aside className="card p-5">
          <SectionTitle
            title="最近活动"
            meta={`${state.activities.length} 条真实操作`}
          />
          {state.activities.length ? (
            state.activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="border-t border-[var(--line)] py-3 first:border-t-0"
              >
                <p className="text-xs font-semibold">{activity.text}</p>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  {activity.actor} · {activity.time}
                </p>
              </div>
            ))
          ) : (
            <p className="border-t border-[var(--line)] py-6 text-center text-xs text-[var(--muted)]">
              尚无项目活动
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
