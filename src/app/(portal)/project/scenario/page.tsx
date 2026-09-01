"use client";

import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileClock,
  Pencil,
  Save,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Progress,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import { usePortal } from "@/lib/store";
import type { ScenarioCard } from "@/lib/types";
import { calculateScenarioCompleteness } from "@/lib/metrics";

const groups: Array<{
  title: string;
  subtitle: string;
  fields: Array<[keyof ScenarioCard, string]>;
}> = [
  {
    title: "基本信息",
    subtitle: "01 / CONTEXT",
    fields: [
      ["name", "场景名称"],
      ["department", "所属部门"],
      ["businessOwner", "业务负责人"],
      ["users", "主要使用者"],
      ["frequency", "使用频次"],
    ],
  },
  {
    title: "当前流程",
    subtitle: "02 / AS-IS",
    fields: [
      ["trigger", "触发条件"],
      ["input", "输入"],
      ["currentProcess", "当前处理步骤"],
      ["currentOutput", "当前输出"],
      ["duration", "当前耗时"],
      ["cost", "当前成本"],
      ["baseline", "当前质量基线"],
    ],
  },
  {
    title: "目标状态",
    subtitle: "03 / TO-BE",
    fields: [
      ["aiTask", "AI 需要完成的任务"],
      ["targetOutput", "目标输出"],
      ["targetMetrics", "目标指标"],
      ["humanBoundary", "AI 与人工分工"],
      ["exclusions", "明确排除范围"],
    ],
  },
  {
    title: "企业上下文",
    subtitle: "04 / ENTERPRISE",
    fields: [
      ["dataSources", "数据源与知识来源"],
      ["businessRules", "业务规则"],
      ["sensitiveLevel", "敏感等级"],
    ],
  },
  {
    title: "Agent 设计",
    subtitle: "05 / AGENT",
    fields: [
      ["agentName", "Agent 名称"],
      ["workflow", "工作流说明"],
      ["skills", "所需 Skill"],
      ["tools", "所需 Tool"],
      ["exceptionHandling", "异常处理方式"],
    ],
  },
  {
    title: "Eval 与验收",
    subtitle: "06 / ACCEPTANCE",
    fields: [
      ["testRequirements", "测试集要求"],
      ["dimensions", "评测维度"],
      ["threshold", "通过阈值"],
      ["failureTypes", "关键失败类型"],
      ["acceptanceOwner", "验收负责人"],
      ["valueTarget", "业务价值目标"],
    ],
  },
];

const interviewFields = [
  ["problem", "企业希望解决什么问题？"],
  ["actor", "当前由谁完成？"],
  ["process", "当前流程是什么？"],
  ["frequency", "每月发生多少次？"],
  ["cost", "当前时间和成本是多少？"],
  ["data", "输入数据来自哪里？"],
  ["errors", "哪些错误不能接受？"],
  ["confirmation", "哪些动作需要人工确认？"],
  ["success", "如何判断 POC 成功？"],
  ["value", "预期业务价值是什么？"],
] as const;

export default function ScenarioPage() {
  const { state, updateScenario, generateScenario, confirmScenario } =
    usePortal();
  const [editOpen, setEditOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [draft, setDraft] = useState<ScenarioCard>(state.scenario);
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(interviewFields.map(([key]) => [key, ""])),
  );
  const [preview, setPreview] = useState<Partial<ScenarioCard> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const completeness = useMemo(
    () =>
      calculateScenarioCompleteness({
        requiredFields: [
          state.scenario.name,
          state.scenario.department,
          state.scenario.businessOwner,
          state.scenario.trigger,
          state.scenario.input,
          state.scenario.currentProcess,
          state.scenario.aiTask,
          state.scenario.targetMetrics,
          state.scenario.humanBoundary,
          state.scenario.dataSources,
        ],
        hasBaseline: !!state.scenario.baseline,
        hasDataConditions: !!state.scenario.dataSources,
        hasRiskBoundary: !!state.scenario.humanBoundary,
        hasAcceptanceStandard: !!state.scenario.threshold,
      }),
    [state.scenario],
  );
  const answeredCount = interviewFields.filter(([key]) =>
    answers[key]?.trim(),
  ).length;
  const submitAI = async () => {
    setGenerating(true);
    setAiError(null);
    try {
      setPreview(await generateScenario(answers));
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "DeepSeek 调用失败，请重试。",
      );
    } finally {
      setGenerating(false);
    }
  };
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="SCENARIO AS SOURCE OF TRUTH"
        title="场景卡"
        description="先把业务问题、数据边界与验收标准说清楚，再让技术方案进入 POC。AI 内容必须预览并确认后写入。"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setIssuesOpen(!issuesOpen)}
            >
              <CheckCircle2 size={15} />
              AI 检查缺失项
            </Button>
            <Button onClick={() => setInterviewOpen(true)}>
              <Sparkles size={15} />
              AI 需求访谈
            </Button>
          </>
        }
      />
      <div className="mb-6 grid gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] md:grid-cols-[1fr_auto_auto]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{state.scenario.name}</h2>
            <Badge
              tone={state.scenario.status === "已通过" ? "success" : "warning"}
            >
              {state.scenario.status}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            版本 v{state.scenario.version}.0 · {state.project.organization} ·{" "}
            {state.scenario.department}
          </p>
        </div>
        <div className="min-w-48">
          <div className="mb-2 flex justify-between text-[10px] text-[var(--muted)]">
            <span>完整度</span>
            <b className="font-data text-[var(--ink)]">{completeness}%</b>
          </div>
          <Progress value={completeness} tone="success" />
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(state.scenario);
              setEditOpen(true);
            }}
          >
            <Pencil size={14} />
            编辑
          </Button>
          <Button variant="ghost">
            <FileClock size={14} />
            版本历史
          </Button>
        </div>
      </div>
      {issuesOpen && (
        <div className="mb-6 rounded-r-[var(--radius-md)] border-l-4 border-[var(--primary)] bg-[var(--primary-soft)] p-4 text-sm">
          <b>完整性检查：当前得分 {completeness}%</b>
          <p className="mt-1 text-xs text-[var(--muted)]">
            建议补充“下游系统”和“数据更新频率”；当前业务基线、风险边界和验收阈值已完整。
          </p>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((group, index) => (
          <section
            key={group.title}
            className={`card p-5 ${index === 1 || index === 2 ? "lg:row-span-2" : ""}`}
          >
            <SectionTitle title={group.title} meta={group.subtitle} />{" "}
            <dl className="grid gap-0 sm:grid-cols-2">
              {group.fields.map(([key, label]) => (
                <div
                  key={key}
                  className={`border-t border-[var(--line)] py-3 pr-4 ${key === "currentProcess" || key === "workflow" || key === "humanBoundary" || key === "businessRules" ? "sm:col-span-2" : ""}`}
                >
                  <dt className="mb-1 text-[10px] font-semibold text-[var(--muted)]">
                    {label}
                  </dt>
                  <dd className="text-xs leading-5">
                    {String(state.scenario[key])}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="编辑场景卡"
        description={`保存后生成 v${state.scenario.version + 1}.0 草稿版本`}
        wide
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateScenario(draft);
            setEditOpen(false);
          }}
          className="grid gap-6"
        >
          {groups.slice(0, 3).map((group) => (
            <section key={group.title}>
              <h3 className="mb-3 border-b border-[var(--line)] pb-2 text-xs font-bold">
                {group.title}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    className={
                      key === "currentProcess" || key === "humanBoundary"
                        ? "sm:col-span-2"
                        : ""
                    }
                  >
                    {String(draft[key]).length > 32 ? (
                      <Textarea
                        value={String(draft[key])}
                        onChange={(event) =>
                          setDraft((old) => ({
                            ...old,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    ) : (
                      <Input
                        value={String(draft[key])}
                        onChange={(event) =>
                          setDraft((old) => ({
                            ...old,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
            </section>
          ))}
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[var(--line)] bg-[var(--surface)] pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
            >
              取消
            </Button>
            <Button type="submit">
              <Save size={14} />
              保存草稿
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={interviewOpen}
        onClose={() => {
          setInterviewOpen(false);
          setPreview(null);
          setAiError(null);
        }}
        title="AI 企业需求访谈"
        description="真实 DeepSeek Provider · 输出通过 Zod 校验后进入预览"
        wide
      >
        {!preview ? (
          <div>
            <div className="mb-5 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-subtle)] p-3 text-xs">
              <span>
                <b>访谈进度</b> · 10 个核心问题
              </span>
              <span className="font-data font-bold text-[var(--primary)]">
                {answeredCount} / 10
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {interviewFields.map(([key, label], index) => (
                <Field
                  key={key}
                  label={`${String(index + 1).padStart(2, "0")} · ${label}`}
                >
                  <Textarea
                    value={answers[key]}
                    onChange={(event) =>
                      setAnswers((old) => ({
                        ...old,
                        [key]: event.target.value,
                      }))
                    }
                    className="min-h-20"
                  />
                </Field>
              ))}
            </div>
            {aiError && (
              <div
                role="alert"
                className="mt-4 rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]"
              >
                {aiError}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={submitAI}
                disabled={generating || answeredCount < interviewFields.length}
              >
                {generating ? (
                  <>
                    <Clock3 size={14} className="animate-spin" />
                    正在生成结构化内容
                  </>
                ) : (
                  <>
                    <WandSparkles size={14} />
                    生成场景卡预览
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-4 text-xs">
              <CheckCircle2
                size={18}
                className="shrink-0 text-[var(--primary)]"
              />
              <span>
                <b className="block">结构化输出已通过 Zod 校验</b>
                <span className="mt-1 block text-[var(--muted)]">
                  以下内容仍处于预览状态，确认后才会写入场景卡并生成新版本。
                </span>
              </span>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
              {Object.entries(preview).map(([key, value]) => (
                <div key={key} className="bg-[var(--surface)] p-3">
                  <span className="font-data text-[9px] font-bold uppercase text-[var(--muted)]">
                    {key}
                  </span>
                  <p className="mt-1 text-xs leading-5">{String(value)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setPreview(null)}>
                返回修改
              </Button>
              <Button
                onClick={() => {
                  confirmScenario(preview);
                  setInterviewOpen(false);
                  setPreview(null);
                }}
              >
                确认并写入场景卡 <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
