"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  LoaderCircle,
  MessageCircle,
  Plus,
  Send,
  Square,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  Progress,
  Textarea,
} from "@/components/ui";
import { usePortal } from "@/lib/store";
import {
  createDiagnosisSession,
  diagnosisReplySchema,
  diagnosisSteps,
  factLabels,
  isProposalReady,
  persona,
  proposalMarkdown,
  type DiagnosisFacts,
  type DiagnosisSession,
} from "@/lib/diagnosis";

export default function ChatPage() {
  const { state, saveDiagnosis, confirmDiagnosis } = usePortal();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedBy, setConfirmedBy] = useState("");
  const [accepted, setAccepted] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const session =
    state.diagnoses.find((item) => item.id === activeId) || state.diagnoses[0];
  const result = session?.result;
  const plan = result?.plan;
  const ready = isProposalReady(result || null);
  const mismatch = Boolean(
    session &&
    !session.confirmedAt &&
    (session.projectId || "") !== state.project.id,
  );
  const pendingReply = session?.messages.at(-1)?.role === "user";
  const factsCount = result
    ? Object.values(result.facts).filter((value) => value.trim()).length
    : 0;

  useEffect(() => {
    void fetch("/api/ai/config", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data: { configured: boolean }) => setConfigured(data.configured))
      .catch(() => setConfigured(false));
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [session?.messages.length, busy]);

  const newSession = () => {
    const next = createDiagnosisSession(
      state.project.id || null,
      state.project.id
        ? JSON.stringify({
            project: state.project,
            scenario: state.scenario,
            outcomeContract: state.outcomeContract,
          })
        : "",
    );
    saveDiagnosis(next);
    setActiveId(next.id);
    setInput("");
    setError("");
    return next;
  };
  const send = async (message?: string, retry = false) => {
    if (busy || configured !== true || mismatch || session?.confirmedAt) return;
    const content = (message ?? input).trim();
    if (!retry && (!content || content.length > 6000)) return;
    const current = session || newSession();
    const next: DiagnosisSession = retry
      ? current
      : {
          ...current,
          title:
            current.messages.length === 1
              ? content.slice(0, 28)
              : current.title,
          messages: [
            ...current.messages,
            { id: crypto.randomUUID(), role: "user", content },
          ],
          result: current.result
            ? { ...current.result, plan: null, suggestions: [] }
            : null,
        };
    saveDiagnosis(next);
    setActiveId(next.id);
    setInput("");
    setError("");
    setBusy(true);
    const aborter = new AbortController();
    controller.current = aborter;
    try {
      const response = await fetch("/api/ai/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: aborter.signal,
        body: JSON.stringify({
          messages: next.messages.map(({ role, content }) => ({
            role,
            content,
          })),
          context: next.context,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "回复失败，请重试。");
      const reply = diagnosisReplySchema.parse(data);
      if (aborter.signal.aborted) return;
      saveDiagnosis({
        ...next,
        result: reply,
        messages: [
          ...next.messages,
          { id: crypto.randomUUID(), role: "assistant", content: reply.reply },
        ],
      });
    } catch (reason) {
      if (!aborter.signal.aborted)
        setError(
          reason instanceof Error ? reason.message : "网络异常，请重试。",
        );
    } finally {
      if (controller.current === aborter) {
        controller.current = null;
        setBusy(false);
      }
    }
  };
  const download = () => {
    if (!session) return;
    const url = URL.createObjectURL(
      new Blob([proposalMarkdown(session)], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "POC方案.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-rise space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[#739ca8] text-2xl font-bold text-white shadow-sm"
          >
            岚
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">岚舟 · 场景诊断</h1>
              <Badge tone="info">AI 顾问</Badge>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {persona.description}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={newSession} disabled={busy}>
          <Plus size={15} />
          新建诊断
        </Button>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
        <section className="card flex min-w-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`size-2 rounded-full ${configured ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`}
              />
              {configured === null
                ? "正在连接…"
                : configured
                  ? "岚舟已就绪"
                  : "等待连接 DeepSeek"}
            </div>
            <span className="text-xs text-[var(--muted)]">
              {session?.confirmedAt
                ? "已确认 · 只读记录"
                : state.project.name
                  ? `关联：${state.project.name}`
                  : "确认后创建首个项目"}
            </span>
          </div>
          {state.diagnoses.length > 0 && (
            <div className="border-b border-[var(--line)] px-5 py-3">
              <select
                aria-label="诊断会话"
                disabled={busy}
                value={session?.id || ""}
                onChange={(event) => {
                  setActiveId(event.target.value);
                  setError("");
                  setInput("");
                }}
                className="w-full min-w-0 bg-transparent text-xs text-[var(--muted)]"
              >
                {state.diagnoses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.confirmedAt ? "✓ " : ""}
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div
            role="log"
            aria-label="与岚舟的对话"
            aria-live="polite"
            className="h-[min(56vh,640px)] min-h-80 space-y-6 overflow-y-auto px-4 py-6 sm:px-6"
          >
            {(
              session?.messages || [
                { id: "welcome", role: "assistant", content: persona.greeting },
              ]
            ).map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]"
                  >
                    岚
                  </span>
                )}
                <div
                  className={`max-w-[88%] ${message.role === "user" ? "rounded-2xl rounded-tr-sm bg-[var(--primary)] px-4 py-3 text-white" : "pt-1"}`}
                >
                  <p
                    className={`mb-2 text-[10px] ${message.role === "user" ? "text-white/75" : "text-[var(--muted)]"}`}
                  >
                    {message.role === "user" ? "客户" : "岚舟 · AI"}
                  </p>
                  <div className="whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {busy && (
              <div
                role="status"
                className="flex items-center gap-2 text-xs text-[var(--muted)]"
              >
                <LoaderCircle className="animate-spin" size={15} />
                岚舟正在梳理你的回答…
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="border-t border-[var(--line)] p-4 sm:p-5">
            {configured === false && (
              <p className="mb-3 text-sm text-[var(--warning)]">
                请先
                <Link href="/settings/ai" className="underline">
                  连接 DeepSeek
                </Link>
                ，然后返回开始真实访谈。
              </p>
            )}
            {mismatch && (
              <p className="mb-3 text-sm text-[var(--warning)]">
                当前项目已切换，请新建诊断以关联当前项目。此会话保留供查看。
              </p>
            )}
            {session?.confirmedAt ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-[var(--success)]">
                  <CheckCircle2 className="mr-2 inline" size={16} />
                  {session.confirmedBy} 已确认此版方案
                </span>
                {session.projectId === state.project.id && (
                  <Link
                    href="/project/scenario"
                    className="font-semibold text-[var(--primary)]"
                  >
                    查看场景卡 →
                  </Link>
                )}
              </div>
            ) : (
              <>
                {!busy && !pendingReply && result?.suggestions.length ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {result.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        disabled={mismatch || !configured}
                        onClick={() => void send(suggestion)}
                        className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--primary)]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
                {error && (
                  <p role="alert" className="mb-3 text-sm text-[var(--danger)]">
                    {error}
                  </p>
                )}
                {pendingReply && !busy && (
                  <div className="mb-3 flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                    <span>上一条消息尚未收到回复，已保留。</span>
                    <Button
                      variant="secondary"
                      onClick={() => void send(undefined, true)}
                      disabled={!configured || mismatch}
                    >
                      重试回复
                    </Button>
                  </div>
                )}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void send();
                  }}
                >
                  <Textarea
                    aria-label="发送给岚舟的消息"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    maxLength={6000}
                    disabled={busy || !configured || mismatch || pendingReply}
                    placeholder="描述你的业务问题，或补充、修改刚才的回答…"
                    className="!min-h-24"
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault();
                        if (!pendingReply) void send();
                      }
                    }}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] text-[var(--muted)]">
                      Enter 发送 · Shift + Enter 换行 · 对话保存在此浏览器
                    </span>
                    {busy ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => controller.current?.abort()}
                      >
                        <Square size={13} />
                        停止
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={
                          !input.trim() ||
                          !configured ||
                          mismatch ||
                          pendingReply
                        }
                      >
                        <Send size={14} />
                        发送
                      </Button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-5">
          <section className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-semibold">一起走到可验证的方案</h2>
              <span className="text-xs text-[var(--muted)]">
                {Math.min((result?.step || 0) + 1, 6)} / 6
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {diagnosisSteps.map((label, index) => (
                <div
                  key={label}
                  className={`rounded-lg border p-3 text-xs ${index === (result?.step || 0) ? "border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--line)] text-[var(--muted)]"}`}
                >
                  <span className="mb-2 block font-data">
                    {index < (result?.step || 0) ? (
                      <Check size={14} />
                    ) : (
                      `0${index + 1}`
                    )}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </section>
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">需求备忘录</h2>
              <Badge tone="neutral">
                {factsCount} / {Object.keys(factLabels).length}
              </Badge>
            </div>
            <Progress
              value={(factsCount / Object.keys(factLabels).length) * 100}
            />
            <p className="mt-3 text-[11px] leading-5 text-[var(--muted)]">
              岚舟从对话中整理的事实，你可以随时在聊天中纠正。
            </p>
            <dl className="mt-4 max-h-80 space-y-3 overflow-y-auto">
              {Object.entries(factLabels).map(([key, label]) => (
                <div
                  key={key}
                  className="border-b border-[var(--line)] pb-3 last:border-0"
                >
                  <dt className="text-[10px] text-[var(--muted)]">{label}</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-xs leading-6">
                    {result?.facts[key as keyof DiagnosisFacts] || (
                      <span className="text-[var(--muted)]">待了解</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          {result?.openQuestions.length ? (
            <section className="rounded-xl border border-[var(--primary-border)] bg-[var(--primary-soft)] p-5">
              <h2 className="text-sm font-semibold">还需要一起确认</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-xs leading-6">
                {result.openQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {!plan && (
            <section className="card p-5 text-sm">
              <Sparkles size={20} className="mb-3 text-[var(--primary)]" />
              <h2 className="font-semibold">POC 方案正在形成</h2>
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                明确目标、数据、边界和验收方式后，岚舟会在这里整理完整方案供你确认。
              </p>
            </section>
          )}
        </aside>
      </div>

      {plan && (
        <section className="card p-5 sm:p-8" aria-label="POC 方案预览">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone={session.confirmedAt ? "success" : "warning"}>
                {session.confirmedAt ? "客户已确认" : "待客户确认"}
              </Badge>
              <h2 className="mt-3 text-xl font-bold">{plan.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted)]">
                {plan.summary}
              </p>
            </div>
            <Button variant="secondary" onClick={download}>
              <Download size={14} />
              导出方案
            </Button>
          </div>
          <h3 className="mb-2 mt-6 font-semibold">最小闭环设计</h3>
          <p className="whitespace-pre-wrap text-sm leading-7">
            {plan.solution}
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold">实施里程碑</h3>
              <div className="space-y-3">
                {plan.milestones.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[var(--line)] p-4 text-xs leading-6"
                  >
                    <b>
                      {item.stage} · {item.title}
                    </b>
                    <p>{item.deliverable}</p>
                    <p className="text-[var(--muted)]">
                      {item.timing} · {item.owner}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-semibold">三维验收标准</h3>
              <div className="space-y-3">
                {plan.criteria.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[var(--line)] p-4 text-xs leading-6"
                  >
                    <Badge tone="info">{item.dimension}</Badge>
                    <p className="mt-2">{item.title}</p>
                  </div>
                ))}
              </div>
              <h3 className="mb-3 mt-6 font-semibold">风险与停止条件</h3>
              <ul className="list-inside list-disc space-y-2 text-xs leading-6">
                {plan.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs leading-6">{plan.stopCondition}</p>
            </div>
          </div>
          {!session.confirmedAt && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
              <p className="text-xs text-[var(--muted)]">
                如需调整，直接在对话中告诉岚舟，更新后再确认。
              </p>
              <Button
                disabled={!ready || busy || pendingReply || mismatch}
                onClick={() => {
                  setConfirmOpen(true);
                  setAccepted(false);
                }}
              >
                <CheckCircle2 size={15} />
                确认 POC 方案
              </Button>
            </div>
          )}
        </section>
      )}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="确认这一版 POC 方案"
        description={
          state.project.id
            ? `将更新「${state.project.name}」的场景卡与结果契约，补充里程碑、验收项、风险和评审记录。`
            : "将创建工作空间和首个项目，并写入场景卡、POC 里程碑、验收项、风险和评审记录。"
        }
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!session || !accepted || !ready || mismatch) return;
            confirmDiagnosis(session.id, confirmedBy);
            setConfirmOpen(false);
          }}
        >
          <Field label="确认人姓名">
            <Input
              required
              maxLength={80}
              value={confirmedBy}
              onChange={(event) => setConfirmedBy(event.target.value)}
            />
          </Field>
          <label className="flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1"
            />
            我已核对需求备忘录、实施范围和验收标准，同意以此版方案开展 POC。
          </label>
          <p className="text-xs text-[var(--muted)]">
            方案确认会留存本轮对话与确认人；内部评审和实际验收仍需后续完成。
          </p>
          <Button
            type="submit"
            disabled={!accepted || !confirmedBy.trim()}
            className="w-full"
          >
            确认并写入项目
            <ArrowRight size={14} />
          </Button>
        </form>
      </Modal>
      <p className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
        <MessageCircle size={13} />
        岚舟是虚拟 AI 顾问。对话内容将发送给已配置的 DeepSeek 用于诊断。
      </p>
    </div>
  );
}
