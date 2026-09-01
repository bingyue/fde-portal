"use client";

import {
  Beaker,
  CheckCircle2,
  CircleDashed,
  FlaskConical,
  Plus,
  ShieldAlert,
  TimerReset,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import { usePortal } from "@/lib/store";
import type { Hypothesis } from "@/lib/types";

const emptyHypothesis: Omit<Hypothesis, "id" | "status" | "evidence"> = {
  title: "",
  dimension: "技术",
  uncertainty: "高",
  experiment: "",
  threshold: "",
  owner: "",
};

export default function ExperimentsPage() {
  const { state, addHypothesis, updateHypothesis } = usePortal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyHypothesis);
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const total = state.hypotheses.length;
  const validated = state.hypotheses.filter(
    (item) => item.status === "已验证",
  ).length;
  const testing = state.hypotheses.filter(
    (item) => item.status === "实验中",
  ).length;
  const highUnknowns = state.hypotheses.filter(
    (item) => item.uncertainty === "高" && item.status === "待验证",
  ).length;
  const progress = total ? Math.round((validated / total) * 100) : 0;
  const stats: Array<[string, string | number, LucideIcon, string]> = [
    ["关键假设", total, CircleDashed, "全部待验证对象"],
    ["高不确定性", highUnknowns, ShieldAlert, "优先投入实验"],
    ["实验进行中", testing, FlaskConical, "正在获取证据"],
    ["已验证比例", `${progress}%`, CheckCircle2, `${validated}/${total || 0}`],
  ];

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="ASSUMPTION → EXPERIMENT → EVIDENCE"
        title="假设与实验中心"
        description="项目进度由不确定性消除速度衡量。每个实验只验证一个关键假设，并用真实任务证据形成继续、调整或停止决策。"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={14} /> 登记关键假设
          </Button>
        }
      />

      <section className="mb-6 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon, hint]) => (
          <div key={String(label)} className="bg-[var(--surface)] p-5">
            <div className="mb-4 flex items-center justify-between text-[var(--muted)]">
              <span className="text-[10px] font-bold uppercase tracking-[.12em]">
                {String(label)}
              </span>
              <Icon size={16} className="text-[var(--primary)]" />
            </div>
            <b className="font-data text-2xl">{String(value)}</b>
            <p className="mt-1 text-[10px] text-[var(--muted)]">
              {String(hint)}
            </p>
          </div>
        ))}
      </section>

      <section className="card p-5 sm:p-6">
        <SectionTitle
          title="实验学习队列"
          meta="优先处理高不确定性、且可能改变项目方向的假设"
        />
        {state.hypotheses.length ? (
          <div className="space-y-4">
            {state.hypotheses.map((item) => (
              <article
                key={item.id}
                className={`rounded-[var(--radius-md)] border bg-[var(--surface)] p-5 ${item.uncertainty === "高" && item.status === "待验证" ? "border-[var(--warning-border)]" : "border-[var(--line)]"}`}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          item.dimension === "技术"
                            ? "info"
                            : item.dimension === "业务"
                              ? "success"
                              : "warning"
                        }
                      >
                        {item.dimension}假设
                      </Badge>
                      <Badge
                        tone={
                          item.uncertainty === "高"
                            ? "danger"
                            : item.uncertainty === "中"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {item.uncertainty}不确定性
                      </Badge>
                      <Badge
                        tone={
                          item.status === "已验证"
                            ? "success"
                            : item.status === "已否定"
                              ? "danger"
                              : item.status === "实验中"
                                ? "info"
                                : "neutral"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <h2 className="mt-3 text-base font-bold">{item.title}</h2>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Owner：{item.owner || "待分配"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {item.status === "待验证" && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          updateHypothesis(item.id, { status: "实验中" })
                        }
                      >
                        <Beaker size={14} /> 开始实验
                      </Button>
                    )}
                    {item.status === "实验中" && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            updateHypothesis(item.id, {
                              status: "已否定",
                              evidence: evidence[item.id] || item.evidence,
                            })
                          }
                        >
                          <XCircle size={14} /> 否定
                        </Button>
                        <Button
                          onClick={() =>
                            updateHypothesis(item.id, {
                              status: "已验证",
                              evidence: evidence[item.id] || item.evidence,
                            })
                          }
                          disabled={
                            !String(evidence[item.id] || item.evidence).trim()
                          }
                        >
                          <CheckCircle2 size={14} /> 验证通过
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-5 grid gap-px overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--line)] md:grid-cols-2">
                  <div className="bg-[var(--surface-subtle)] p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      最小实验
                    </span>
                    <p className="mt-2 text-xs leading-5">
                      {item.experiment || "尚未定义实验"}
                    </p>
                  </div>
                  <div className="bg-[var(--surface-subtle)] p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      通过阈值
                    </span>
                    <p className="mt-2 text-xs leading-5">
                      {item.threshold || "尚未定义阈值"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Field
                    label="真实证据"
                    hint="记录任务数据、用户行为或业务结果；展示不是证据"
                  >
                    <Textarea
                      aria-label={`${item.title}的真实证据`}
                      value={evidence[item.id] ?? item.evidence}
                      onChange={(event) =>
                        setEvidence((old) => ({
                          ...old,
                          [item.id]: event.target.value,
                        }))
                      }
                      onBlur={() => {
                        const value = evidence[item.id];
                        if (value !== undefined)
                          updateHypothesis(item.id, { evidence: value });
                      }}
                      placeholder="例如：100 条真实工单中 87 条无需修改即可进入下一业务动作"
                    />
                  </Field>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<TimerReset size={22} />}
            title="尚未登记关键假设"
            description="从模型可行性、业务改善和用户采纳三个维度，先登记最可能让项目失败的未知条件。"
            action={
              <Button onClick={() => setOpen(true)}>登记第一个假设</Button>
            }
          />
        )}
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="登记关键假设"
        description="一个假设只对应一个最小实验和一个可判定阈值。"
        wide
      >
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            addHypothesis(form);
            setForm(emptyHypothesis);
            setOpen(false);
          }}
        >
          <Field label="假设陈述">
            <Textarea
              required
              aria-label="假设陈述"
              value={form.title}
              onChange={(event) =>
                setForm((old) => ({ ...old, title: event.target.value }))
              }
              placeholder="我们相信……如果……那么……"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="证据维度">
              <Select
                aria-label="假设证据维度"
                value={form.dimension}
                onChange={(event) =>
                  setForm((old) => ({
                    ...old,
                    dimension: event.target.value as Hypothesis["dimension"],
                  }))
                }
              >
                <option>技术</option>
                <option>业务</option>
                <option>采纳</option>
              </Select>
            </Field>
            <Field label="不确定性">
              <Select
                value={form.uncertainty}
                onChange={(event) =>
                  setForm((old) => ({
                    ...old,
                    uncertainty: event.target
                      .value as Hypothesis["uncertainty"],
                  }))
                }
              >
                <option>高</option>
                <option>中</option>
                <option>低</option>
              </Select>
            </Field>
            <Field label="Owner">
              <Input
                aria-label="假设 Owner"
                value={form.owner}
                onChange={(event) =>
                  setForm((old) => ({ ...old, owner: event.target.value }))
                }
                placeholder="对学习结果负责的人"
              />
            </Field>
          </div>
          <Field label="最小实验">
            <Textarea
              required
              aria-label="最小实验"
              value={form.experiment}
              onChange={(event) =>
                setForm((old) => ({ ...old, experiment: event.target.value }))
              }
              placeholder="用最少数据和最短时间如何验证？"
            />
          </Field>
          <Field label="判定阈值">
            <Input
              required
              aria-label="判定阈值"
              value={form.threshold}
              onChange={(event) =>
                setForm((old) => ({ ...old, threshold: event.target.value }))
              }
              placeholder="例如：真实任务成功率 ≥ 85%，严重失败 = 0"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!form.title || !form.experiment || !form.threshold}
            >
              登记并进入队列
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
