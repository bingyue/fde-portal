"use client";

import {
  AlertOctagon,
  CalendarDays,
  Check,
  CheckCircle2,
  FileUp,
  LockKeyhole,
  Plus,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Progress,
  SectionTitle,
} from "@/components/ui";
import { useDemo } from "@/lib/store";

export default function PocPage() {
  const {
    state,
    submitStageReview,
    attachEvidence,
    closeRisk,
    addAcceptanceCriterion,
    toggleAcceptanceCriterion,
  } = useDemo();
  const [selectedId, setSelectedId] = useState(
    state.stages.find((stage) => stage.status === "进行中")?.id ||
      state.stages[0]?.id ||
      "",
  );
  const [criterionOpen, setCriterionOpen] = useState(false);
  const [criterionTitle, setCriterionTitle] = useState("");
  const stage =
    state.stages.find((item) => item.id === selectedId) || state.stages[0];
  if (!stage) return null;
  const risk = state.risks.find((item) => item.level === "高");
  const canSubmit =
    stage.criteriaTotal > 0 &&
    stage.blockers.length === 0 &&
    stage.criteriaPassed === stage.criteriaTotal &&
    stage.evidenceCount >= stage.criteriaTotal;
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="POC STAGE GATES"
        title="POC 工作台"
        description="每一阶段必须由验收项、证据与评审结论共同推进。系统自动识别缺失项与高风险阻塞。"
        actions={
          <Button
            onClick={() => submitStageReview(stage.id)}
            disabled={stage.status === "已通过"}
          >
            {stage.status === "已通过" ? (
              <>
                <Check size={14} />
                阶段已通过
              </>
            ) : (
              "提交阶段评审"
            )}
          </Button>
        }
      />
      <div className="mb-6 grid gap-2 md:grid-cols-6">
        {state.stages.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedId(item.id)}
            className={`border p-3 text-left transition ${selectedId === item.id ? "border-[#769d2d] bg-[#f1f7e7] dark:bg-[#1a301b]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[#9da8b5]"}`}
          >
            <div className="mb-5 flex justify-between">
              <span className="font-data text-xs font-extrabold">
                {item.code}
              </span>
              <span
                className={`size-2 ${item.status === "已通过" ? "bg-[#159a74]" : item.status === "存在风险" ? "bg-[#d17522]" : "bg-[#b8c0ca]"}`}
              />
            </div>
            <b className="block text-xs">{item.name}</b>
            <span className="mt-1 block text-[9px] text-[var(--muted)]">
              {item.status}
            </span>
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <main className="space-y-6">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-data grid size-10 place-items-center bg-[#0c1e3a] font-black text-[#b8f34b]">
                    {stage.code}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold">{stage.name}</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {stage.objective}
                    </p>
                  </div>
                </div>
              </div>
              <Badge
                tone={
                  stage.status === "已通过"
                    ? "success"
                    : stage.status === "存在风险"
                      ? "warning"
                      : "neutral"
                }
              >
                {stage.status}
              </Badge>
            </div>
            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-3">
              <div className="bg-[var(--surface)] py-5 sm:pr-4">
                <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                  <UserRound size={13} />
                  负责人
                </div>
                <b className="mt-2 block text-xs">{stage.owner}</b>
              </div>
              <div className="bg-[var(--surface)] p-5">
                <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                  <CalendarDays size={13} />
                  截止日期
                </div>
                <b className="font-data mt-2 block text-xs">{stage.dueDate}</b>
              </div>
              <div className="bg-[var(--surface)] py-5 sm:pl-4">
                <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
                  <CheckCircle2 size={13} />
                  验收进度
                </div>
                <div className="mt-2">
                  <Progress
                    value={
                      stage.criteriaTotal
                        ? (stage.criteriaPassed / stage.criteriaTotal) * 100
                        : 0
                    }
                    label={`${stage.criteriaPassed}/${stage.criteriaTotal}`}
                    tone="success"
                  />
                </div>
              </div>
            </div>
          </section>
          <section className="card p-5 sm:p-6">
            <SectionTitle
              title="必须完成的事项"
              meta="提交门禁前需要全部通过并绑定证据"
              action={
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCriterionOpen(true)}
                  >
                    <Plus size={14} />
                    创建验收项
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => attachEvidence(stage.id)}
                    disabled={!stage.criteriaTotal}
                  >
                    <FileUp size={14} />
                    关联证据
                  </Button>
                </div>
              }
            />
            <div>
              {Array.from({ length: stage.criteriaTotal }, (_, index) => {
                const criterion = stage.criteria?.[index];
                const passed = Boolean(criterion?.passed);
                const hasEvidence = index < stage.evidenceCount;
                return (
                  <div
                    key={index}
                    className="grid items-center gap-3 border-t border-[var(--line)] py-3.5 sm:grid-cols-[24px_1fr_auto_auto]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        criterion &&
                        toggleAcceptanceCriterion(stage.id, criterion.id)
                      }
                      className={`grid size-5 place-items-center border ${passed ? "border-[#159a74] bg-[#159a74] text-white" : "border-[#aab4c0]"}`}
                    >
                      {passed && <Check size={12} />}
                    </button>
                    <span className="text-xs font-semibold">
                      {criterion?.title || `验收项 ${index + 1}`}
                    </span>
                    <Badge tone={hasEvidence ? "success" : "warning"}>
                      {hasEvidence ? "已绑定证据" : "缺少证据"}
                    </Badge>
                    <span className="text-[10px] text-[var(--muted)]">
                      {passed ? "已通过" : "待完成"}
                    </span>
                  </div>
                );
              })}
              {!stage.criteriaTotal && (
                <p className="border-t border-[var(--line)] py-8 text-center text-xs text-[var(--muted)]">
                  尚未创建验收项
                </p>
              )}
            </div>
          </section>
          {stage.code === "P3" && risk && (
            <section className="border border-[#e2a16b] bg-[#fff8ee] p-5 dark:border-[#74471f] dark:bg-[#2c2116]">
              <SectionTitle title="关联风险" meta="高风险未关闭将阻塞门禁" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="grid size-10 shrink-0 place-items-center bg-[#fde7d0] text-[#bd6414] dark:bg-[#462c18]">
                  <AlertOctagon size={19} />
                </span>
                <div className="flex-1">
                  <div className="mb-1 flex gap-2">
                    <Badge tone="danger">高风险</Badge>
                    <Badge
                      tone={risk.status === "已关闭" ? "success" : "warning"}
                    >
                      {risk.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold leading-5">
                    {risk.title}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => closeRisk(risk.id)}
                  disabled={risk.status === "已关闭"}
                >
                  {risk.status === "已关闭" ? "已关闭" : "关闭并加入回归集"}
                </Button>
              </div>
            </section>
          )}
        </main>
        <aside className="space-y-6">
          <section className="card p-5">
            <SectionTitle
              title="提交条件检查"
              meta={canSubmit ? "已满足门禁要求" : "存在阻塞项"}
            />
            {[
              ["验收项全部通过", stage.criteriaPassed === stage.criteriaTotal],
              ["有效证据覆盖完整", stage.evidenceCount >= stage.criteriaTotal],
              [
                "无开放高风险",
                !state.risks.some(
                  (item) => item.level === "高" && item.status !== "已关闭",
                ),
              ],
              [
                "Eval 达到目标阈值",
                Boolean(state.evalSuites[0]) &&
                  (state.evalSuites[0]?.runs.at(-1)?.successRate || 0) >=
                    (state.evalSuites[0]?.threshold || 0),
              ],
            ].map(([label, ok]) => (
              <div
                key={String(label)}
                className="flex items-center gap-3 border-t border-[var(--line)] py-3 first:border-t-0"
              >
                <span
                  className={`grid size-6 place-items-center ${ok ? "bg-[#e5f6ef] text-[#087d5d] dark:bg-[#103529]" : "bg-[#fff0dd] text-[#bd6414] dark:bg-[#3a2815]"}`}
                >
                  {ok ? <Check size={13} /> : <LockKeyhole size={12} />}
                </span>
                <span className="text-xs">{String(label)}</span>
                <span className="ml-auto text-[10px] text-[var(--muted)]">
                  {ok ? "满足" : "未满足"}
                </span>
              </div>
            ))}
            <Button
              className="mt-4 w-full"
              onClick={() => submitStageReview(stage.id)}
              disabled={stage.status === "已通过"}
            >
              {canSubmit ? "提交阶段门禁" : "尝试提交并查看缺失项"}
            </Button>
          </section>
          {stage.blockers.length > 0 && (
            <section className="border border-[#e1a166] bg-[#fff8ee] p-5 dark:bg-[#2c2116]">
              <div className="flex items-center gap-2 text-[#a95711]">
                <ShieldAlert size={16} />
                <b className="text-xs">系统识别的阻塞项</b>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--muted)]">
                {stage.blockers.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
      <Modal
        open={criterionOpen}
        onClose={() => setCriterionOpen(false)}
        title={`为 ${stage.code} 创建验收项`}
        description="验收项必须可验证，并在阶段提交前绑定有效证据。"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addAcceptanceCriterion(stage.id, criterionTitle);
            setCriterionTitle("");
            setCriterionOpen(false);
          }}
          className="grid gap-5"
        >
          <Field label="验收标准">
            <Input
              required
              value={criterionTitle}
              onChange={(event) => setCriterionTitle(event.target.value)}
              placeholder="例如：核心任务成功率达到 85%"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCriterionOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!criterionTitle.trim()}>
              创建验收项
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
