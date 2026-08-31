"use client";

import { Check, MessageSquareText, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import { calculateEvidenceCoverage } from "@/lib/metrics";
import { useDemo } from "@/lib/store";
import type { Review } from "@/lib/types";

export default function ReviewsPage() {
  const { state, approveReview } = useDemo();
  const [active, setActive] = useState<Review | null>(null);
  const [comment, setComment] = useState("");
  const reviewCounts = {
    pending: state.reviews.filter((item) => item.status === "待评审").length,
    approved: state.reviews.filter((item) => item.status === "已通过").length,
    returned: state.reviews.filter((item) => item.status === "退回修改").length,
  };
  const criteriaTotal = state.stages.reduce(
    (sum, stage) => sum + stage.criteriaTotal,
    0,
  );
  const evidenceTotal = state.stages.reduce(
    (sum, stage) => sum + stage.evidenceCount,
    0,
  );
  const evidenceCoverage = calculateEvidenceCoverage(
    evidenceTotal,
    criteriaTotal,
  );
  const latestRun = state.evalSuites.flatMap((suite) => suite.runs).at(-1);

  const conclude = (status: Review["status"]) => {
    if (!active) return;
    approveReview(active.id, status);
    setActive(null);
    setComment("");
  };

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="REVIEWS & GATES"
        title="待办与评审"
        description="场景卡、Eval 设计、阶段门禁和最终验收共享同一套可审计评审记录。"
      />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="card p-5">
          <SectionTitle
            title="评审队列"
            meta={`${reviewCounts.pending} 项待处理`}
          />
          {state.reviews.length ? (
            <div className="space-y-2">
              {state.reviews.map((review) => (
                <button
                  key={review.id}
                  onClick={() => setActive(review)}
                  className="flex w-full flex-col gap-3 border border-[var(--line)] p-4 text-left transition hover:border-[#8fae52] sm:flex-row sm:items-center"
                >
                  <span className="grid size-10 shrink-0 place-items-center bg-[#edf2f5] text-[#315d88] dark:bg-[#14283d]">
                    <MessageSquareText size={17} />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-xs">{review.title}</b>
                      <Badge tone="info">{review.type}</Badge>
                    </div>
                    <p className="mt-2 text-[10px] text-[var(--muted)]">
                      {review.submitter} 提交 · {review.version} ·{" "}
                      {review.submittedAt}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      tone={
                        review.status === "已通过"
                          ? "success"
                          : review.status === "待评审"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {review.status}
                    </Badge>
                    <p className="mt-2 text-[10px] text-[var(--muted)]">
                      评审人：{review.reviewer}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquareText size={20} />}
              title="暂无评审"
              description="提交场景卡或阶段门禁后，评审记录会出现在这里。"
            />
          )}
        </section>
        <aside className="space-y-6">
          <section className="card p-5">
            <SectionTitle title="评审概览" />
            <div className="grid grid-cols-3 gap-px bg-[var(--line)]">
              <div className="bg-[var(--surface)] py-4 text-center">
                <b className="font-data text-xl">{reviewCounts.pending}</b>
                <span className="block text-[9px] text-[var(--muted)]">
                  待评审
                </span>
              </div>
              <div className="bg-[var(--surface)] py-4 text-center">
                <b className="font-data text-xl">{reviewCounts.approved}</b>
                <span className="block text-[9px] text-[var(--muted)]">
                  已通过
                </span>
              </div>
              <div className="bg-[var(--surface)] py-4 text-center">
                <b className="font-data text-xl">{reviewCounts.returned}</b>
                <span className="block text-[9px] text-[var(--muted)]">
                  已退回
                </span>
              </div>
            </div>
          </section>
          <section className="border border-[#b5ce7d] bg-[#f2f8e7] p-5 dark:bg-[#172b18]">
            <div className="flex items-center gap-2 text-[#527411] dark:text-[#b8f34b]">
              <ShieldCheck size={16} />
              <b className="text-xs">评审原则</b>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
              评分必须引用 Eval
              结果或有效证据。高风险未关闭时，不建议直接通过阶段门禁。
            </p>
          </section>
        </aside>
      </div>
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.title || "评审"}
        description={
          active
            ? `${active.type} · ${active.version} · 提交人 ${active.submitter}`
            : ""
        }
      >
        {active && (
          <div>
            <div className="grid grid-cols-2 gap-px border border-[var(--line)] bg-[var(--line)]">
              <div className="bg-[var(--surface)] p-3">
                <span className="text-[10px] text-[var(--muted)]">
                  证据覆盖
                </span>
                <b className="font-data mt-1 block">{evidenceCoverage}%</b>
              </div>
              <div className="bg-[var(--surface)] p-3">
                <span className="text-[10px] text-[var(--muted)]">
                  Eval 通过率
                </span>
                <b className="font-data mt-1 block">
                  {latestRun ? `${latestRun.successRate}%` : "暂无"}
                </b>
              </div>
            </div>
            <Field label="评审意见" className="mt-5">
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="说明结论依据和需要修改的内容…"
              />
            </Field>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <Button variant="secondary" onClick={() => conclude("退回修改")}>
                <RotateCcw size={13} />
                退回修改
              </Button>
              <Button
                variant="secondary"
                onClick={() => conclude("有条件通过")}
              >
                有条件通过
              </Button>
              <Button onClick={() => conclude("已通过")}>
                <Check size={13} />
                通过
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
