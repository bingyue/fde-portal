"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  FileText,
  LoaderCircle,
  MessageSquarePlus,
  Paperclip,
  Play,
  Send,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import {
  evidenceOptions,
  gateBlockers,
  projectMarkdown,
  stages,
  type StageId,
  type WorkProject,
} from "@/lib/workbench/model";
import type { Command } from "@/lib/workbench/engine";
import { routeSkills, workSkills, skillName } from "@/lib/workbench/skills";
import { documentTypes } from "@/lib/workbench/workflow";
import { api, download, statusLabels, time } from "./helpers";
import { DecisionDialog, type DraftCommand } from "./decision-dialog";
import { ProjectPanel, type Panel } from "./project-panel";
import { CoreInsights, ActionMetadata } from "./core-insights";

export function ProjectDesk({
  project,
  onUpdate,
  configured,
}: {
  project: WorkProject;
  onUpdate: (project: WorkProject) => void;
  configured: boolean | null;
}) {
  const [stage, setStage] = useState<StageId>(project.currentStage);
  const [panel, setPanel] = useState<Panel>("stage");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"note" | "file">("note");
  const [intent, setIntent] = useState("分析当前资料，判断下一步");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [showSkills, setShowSkills] = useState(false);
  const [analysisId, setAnalysisId] = useState("");
  const [draft, setDraft] = useState<DraftCommand | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedFacts, setSelectedFacts] = useState<string[]>([]);
  const [sourceId, setSourceId] = useState(project.sources.at(-1)?.id || "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const updateRef = useRef(onUpdate);
  useEffect(() => {
    updateRef.current = onUpdate;
  }, [onUpdate]);
  const running = project.analyses.some((item) => item.status === "running");
  const active =
    analysisId === "new"
      ? undefined
      : project.analyses.find((item) => item.id === analysisId) ||
        project.analyses[0];
  const staleAnalysis =
    !!active &&
    (active.stage !== project.currentStage ||
      (active.stageRevision || 0) !== (project.stageRevision || 0) ||
      project.completedStages.includes(project.currentStage));
  const recommended = routeSkills(
    `${intent}\n${text || project.sources.find((s) => s.id === sourceId)?.text || ""}`,
    project.currentStage,
    skillIds,
  );
  const facts = active
    ? project.facts.filter((fact) => fact.analysisId === active.id)
    : [];
  const blockers = gateBlockers(project);
  const stageDef = stages.find((item) => item.id === project.currentStage)!;

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await api<{ project: WorkProject }>(
          `/api/workbench/projects/${project.id}`,
        );
        if (!cancelled) updateRef.current(result.project);
      } catch {
        if (!cancelled) setError("读取执行进度失败，正在重试。资料已保留。");
      }
      if (!cancelled) timer = setTimeout(poll, 2000);
    };
    timer = setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [project.id, running]);

  // Reconcile another browser's updates on focus, without replacing local input drafts.
  useEffect(() => {
    const refresh = () => {
      void api<{ project: WorkProject }>(
        `/api/workbench/projects/${project.id}`,
      )
        .then((result) => updateRef.current(result.project))
        .catch(() => {});
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [project.id]);

  async function command(value: Command) {
    try {
      const result = await api<{ project: WorkProject }>(
        `/api/workbench/projects/${project.id}/commands`,
        { revision: project.revision, command: value },
      );
      onUpdate(result.project);
      setSelectedFacts([]);
      setError("");
      setStage(result.project.currentStage);
      if (value.type === "actions") {
        setPanel("tasks");
        setNotice(
          "行动已写入任务；确认后的文档在资产区生成并等待审核。阶段仍需单独确认。",
        );
      } else if (value.type === "task" && value.status === "done") {
        const followup = result.project.analyses.find(
          (a) => a.trigger === "task.completed" && a.status === "running",
        );
        if (followup) setAnalysisId(followup.id);
        setNotice(
          "任务已完成，正在根据最新项目记忆复查下一步；有分析运行时会排队执行。",
        );
      } else if (
        ["build-document", "approve-asset", "revise-asset"].includes(value.type)
      ) {
        setPanel("assets");
        setNotice("文档操作已记录，待审核草稿不能作为阶段证据。");
      } else setNotice("判断已保存，可在决策记录中追溯。");
    } catch (e) {
      const current = await api<{ project: WorkProject }>(
        `/api/workbench/projects/${project.id}`,
      ).catch(() => null);
      if (current) onUpdate(current.project);
      throw e;
    }
  }
  async function analyze(existingId?: string, saveOnly = false) {
    setBusy(true);
    setError("");
    setNotice("");
    let current = project;
    let target = existingId || sourceId;
    try {
      if (!existingId && text.trim()) {
        const saved = await api<{ project: WorkProject; sourceId: string }>(
          `/api/workbench/projects/${project.id}/sources`,
          {
            revision: project.revision,
            title:
              title.trim() ||
              `现场记录 · ${new Date().toLocaleDateString("zh-CN")}`,
            text,
            kind,
          },
        );
        current = saved.project;
        target = saved.sourceId;
        setSourceId(target);
        onUpdate(current);
        setText("");
        setTitle("");
        setKind("note");
      }
      if (!target) throw new Error("请先输入企业问题、访谈记录或上传资料。");
      if (saveOnly) {
        setNotice("资料已保存到项目记忆，可随时用于分析与阶段证据。");
        setPanel("memory");
        return;
      }
      const result = await api<{ project: WorkProject }>(
        `/api/workbench/projects/${project.id}/analyze`,
        { revision: current.revision, sourceId: target, intent, skillIds },
      );
      setAnalysisId(result.project.analyses[0].id);
      setSelectedFacts([]);
      onUpdate(result.project);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
      const refreshed = await api<{ project: WorkProject }>(
        `/api/workbench/projects/${project.id}`,
      ).catch(() => null);
      if (refreshed) onUpdate(refreshed.project);
    } finally {
      setBusy(false);
    }
  }
  function focusInput() {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!/\.(txt|md|csv|json)$/i.test(file.name)) {
      setError(
        "当前支持 TXT、Markdown、CSV、JSON。其他业务文档请导出文本后上传。",
      );
      return;
    }
    if (file.size > 200_000) {
      setError("单份资料最多 200 KB，请拆分后上传。");
      return;
    }
    try {
      const value = await file.text();
      if (
        value.length > 60000 ||
        value.trim().length < 5 ||
        value.includes("\u0000")
      )
        throw new Error("请上传 5–60,000 字的 UTF-8 文本资料。");
      if (text.trim()) {
        setError("输入区已有未保存的资料，请先保存或清空后再上传。");
        return;
      }
      setTitle(file.name);
      setText(value);
      setKind("file");
      focusInput();
      setNotice("文件内容已载入输入区，保存后纳入项目资料。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件读取失败");
    }
  }

  return (
    <main className="wb-desk">
      <section className="wb-project-heading">
        <div>
          <div className="wb-row">
            <span className="wb-eyebrow">PROJECT WORKBENCH</span>
            <span className="wb-separator">/</span>
            <span className="wb-muted">{project.organization}</span>
          </div>
          <h1>{project.name}</h1>
          <p>{project.goal}</p>
        </div>
        <div className="wb-project-meta">
          <span className="wb-avatar">{project.owner.slice(0, 1)}</span>
          <div>
            <strong>{project.owner}</strong>
            <small>项目负责人 · 持续保存</small>
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              download(`${project.name}-项目记录.md`, projectMarkdown(project))
            }
          >
            <ArrowDownToLine size={15} />
            导出
          </Button>
        </div>
      </section>
      <section className="wb-map-card" aria-label="项目全流程">
        <div className="wb-row wb-between">
          <div className="wb-row">
            <span className="wb-eyebrow">PROJECT JOURNEY</span>
            <strong>全流程地图</strong>
          </div>
          <span className="wb-muted">
            {project.completedStages.length} / 9 阶段已确认
          </span>
        </div>
        <div className="wb-stage-scroll">
          <div className="wb-stages">
            {stages.map((item, i) => {
              const done = project.completedStages.includes(item.id);
              const current = project.currentStage === item.id;
              const pending = project.tasks.filter(
                (task) => task.stage === item.id && task.status !== "done",
              ).length;
              return (
                <button
                  key={item.id}
                  className={`wb-stage ${current ? "is-current" : ""} ${done ? "is-done" : ""} ${stage === item.id ? "is-selected" : ""}`}
                  onClick={() => {
                    setStage(item.id);
                    setPanel("stage");
                  }}
                  aria-pressed={stage === item.id}
                  aria-label={`${i + 1}. ${item.name}，${done ? "已完成" : current ? "当前阶段" : "未开始"}`}
                >
                  <span className="wb-stage-number">
                    {done ? (
                      <Check size={16} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <strong>{item.name}</strong>
                  <small>
                    {done
                      ? "已确认完成"
                      : current
                        ? "当前阶段"
                        : pending
                          ? `${pending} 项并行任务`
                          : "待推进"}
                  </small>
                </button>
              );
            })}
          </div>
        </div>
        <div className="wb-map-footer">
          <span>
            <span className="wb-live-dot" />
            {stageDef.name} ·{" "}
            {blockers.length
              ? `${blockers.length} 项待核实 / 处理`
              : "完成条件已满足，等待 FDE 确认"}
          </span>
          <button
            onClick={() => {
              setStage(project.currentStage);
              setPanel("stage");
            }}
          >
            查看完成条件 <ChevronRight size={14} />
          </button>
        </div>
      </section>
      {configured === false && (
        <div className="wb-config-banner">
          <Sparkles size={17} />
          <span>连接 DeepSeek 后即可执行分析。企业资料可以先保存。</span>
          <Link href="/settings/ai">
            上传密钥文件 <ArrowRight size={14} />
          </Link>
        </div>
      )}
      {error && (
        <div className="wb-error" role="alert">
          {error}
          <button aria-label="关闭错误提示" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="wb-notice" role="status">
          <CircleCheck size={15} />
          {notice}
          <button aria-label="关闭提示" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      <div className="wb-content-grid">
        <div className="wb-copilot-column">
          <section className="wb-composer wb-card">
            <div className="wb-card-heading">
              <div className="wb-row">
                <span className="wb-copilot-icon">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h2>岚舟 · FDE Copilot</h2>
                  <p>理解现场信息，和你一起判断下一步</p>
                </div>
              </div>
              <Button
                variant="ghost"
                title="开启新一轮输入，保留项目记忆"
                onClick={() => {
                  setAnalysisId("new");
                  setSelectedFacts([]);
                  focusInput();
                }}
              >
                <MessageSquarePlus size={16} />
                <span>新一轮</span>
              </Button>
            </div>
            <div className="wb-composer-body">
              <div className="wb-intents">
                {[
                  "分析当前资料，判断下一步",
                  "分析访谈中的事实与冲突",
                  "设计下一次访谈提纲",
                  "评估场景与验证路径",
                ].map((item) => (
                  <button
                    className={intent === item ? "active" : ""}
                    key={item}
                    onClick={() => setIntent(item)}
                  >
                    {item
                      .replace("分析当前资料，", "")
                      .replace("分析访谈中的", "访谈")
                      .replace("设计下一次", "")}
                  </button>
                ))}
              </div>
              <Input
                aria-label="资料标题"
                placeholder="资料标题（选填）"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                ref={inputRef}
                aria-label="企业问题或访谈记录"
                className="wb-input"
                maxLength={60000}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setKind("note");
                }}
                placeholder={
                  "粘贴客户的问题、访谈原文或会议纪要…\n也可以上传业务资料，或选择已有资料继续分析。"
                }
              />
              {!text && project.sources.length > 0 && (
                <Field label="基于已有资料继续分析">
                  <Select
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                  >
                    <option value="">选择资料</option>
                    {project.sources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.title}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <div className="wb-composer-tools">
                <div className="wb-row">
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    accept=".txt,.md,.csv,.json"
                    onChange={(e) => {
                      void upload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                  >
                    <Paperclip size={15} />
                    上传资料
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSkills(!showSkills)}
                    aria-expanded={showSkills}
                  >
                    <SlidersHorizontal size={15} />
                    调整 Skills
                  </Button>
                </div>
                <span className="wb-muted">
                  {text.length.toLocaleString()} / 60,000
                </span>
              </div>
              {showSkills && (
                <div className="wb-skill-picker">
                  <p>
                    可指定最多 3
                    项专业分析；系统按依赖补齐信息提取、缺口、阶段检查与行动规划。
                  </p>
                  <div>
                    {workSkills
                      .filter((skill) => skill.id !== "fde-deliverable-builder")
                      .map((skill) => (
                        <label key={skill.id} title={skill.when}>
                          <input
                            type="checkbox"
                            checked={skillIds.includes(skill.id)}
                            disabled={
                              !skillIds.includes(skill.id) &&
                              skillIds.length >= 3
                            }
                            onChange={(e) =>
                              setSkillIds(
                                e.target.checked
                                  ? [...skillIds, skill.id]
                                  : skillIds.filter((id) => id !== skill.id),
                              )
                            }
                          />
                          {skill.name}
                        </label>
                      ))}
                  </div>
                  <Button variant="ghost" onClick={() => setSkillIds([])}>
                    恢复自动推荐
                  </Button>
                  <Field label="本轮重点 / 路线调整说明">
                    <Textarea
                      value={intent}
                      maxLength={2000}
                      onChange={(e) => setIntent(e.target.value)}
                    />
                  </Field>
                </div>
              )}
              <div className="wb-composer-submit">
                <div>
                  <span className="wb-label">
                    {skillIds.length
                      ? "本轮执行链（含必要步骤）"
                      : "推荐执行链"}
                  </span>
                  <div className="wb-inline-skills">
                    {recommended.map((id) => (
                      <span key={id}>{skillName(id)}</span>
                    ))}
                  </div>
                </div>
                <div className="wb-row">
                  <Button
                    variant="secondary"
                    disabled={busy || running || text.trim().length < 5}
                    onClick={() => void analyze(undefined, true)}
                  >
                    保存资料
                  </Button>
                  <Button
                    disabled={
                      busy ||
                      running ||
                      (!text.trim() && !sourceId) ||
                      !intent.trim()
                    }
                    onClick={() => void analyze()}
                  >
                    {busy || running ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    {running ? "分析中" : "分析并建议"}
                  </Button>
                </div>
              </div>
            </div>
          </section>
          <section className="wb-judgment wb-card" aria-label="FDE 判断卡">
            <div className="wb-card-heading">
              <div>
                <span className="wb-eyebrow">FDE JUDGMENT</span>
                <h2>当前判断与下一步</h2>
              </div>
              {project.analyses.length > 0 && (
                <Select
                  aria-label="分析记录"
                  value={active?.id || "new"}
                  onChange={(e) => {
                    setAnalysisId(e.target.value);
                    setSelectedFacts([]);
                  }}
                >
                  <option value="new">新一轮输入</option>
                  {project.analyses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {time(item.createdAt)} · {statusLabels[item.status]}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            {!active ? (
              <div className="wb-analysis-empty">
                <span className="wb-empty-orbit">
                  <Sparkles size={25} />
                </span>
                <h3>
                  {project.facts.some((fact) => fact.status === "confirmed")
                    ? "带着项目记忆，继续下一轮"
                    : "先了解问题，再决定下一步"}
                </h3>
                <p>
                  分析会提炼事实、信息缺口和行动建议。你确认后，系统再将它们写入项目记录。
                </p>
                <div>
                  <span>01 提交资料</span>
                  <ChevronRight size={14} />
                  <span>02 专业分析</span>
                  <ChevronRight size={14} />
                  <span>03 FDE 确认</span>
                </div>
              </div>
            ) : (
              <div className="wb-judgment-body">
                <div className="wb-row wb-between">
                  <span className="wb-muted">
                    <FileText size={13} />
                    {
                      project.sources.find(
                        (source) => source.id === active.sourceId,
                      )?.title
                    }
                  </span>
                  <Badge
                    tone={
                      active.status === "failed"
                        ? "danger"
                        : active.status === "running"
                          ? "info"
                          : "success"
                    }
                  >
                    {statusLabels[active.status]}
                  </Badge>
                </div>
                <div className="wb-run-list">
                  {active.runs.map((run) => (
                    <details key={run.skillId}>
                      <summary>
                        <span>
                          {run.status === "running" ? (
                            <LoaderCircle size={14} className="animate-spin" />
                          ) : run.status === "completed" ? (
                            <Check size={14} />
                          ) : (
                            "!"
                          )}
                          {skillName(run.skillId)}
                        </span>
                        <small>{statusLabels[run.status]}</small>
                      </summary>
                      {run.error ? (
                        <p className="wb-error">{run.error}</p>
                      ) : run.output ? (
                        <p>{run.output.summary}</p>
                      ) : (
                        <p>
                          {run.status === "queued"
                            ? `等待前序结果：${(run.dependsOn || []).map(skillName).join("、") || "准备开始"}`
                            : "正在调用 DeepSeek，完成后自动保存到项目。"}
                        </p>
                      )}
                    </details>
                  ))}
                </div>
                {active.status === "failed" && (
                  <div className="wb-note">
                    <p>{active.error}</p>
                    <Button
                      variant="secondary"
                      disabled={busy || running}
                      onClick={() =>
                        active.purpose === "deliverable"
                          ? setDraft({
                              type: "build-document",
                              documentType:
                                documentTypes.find(
                                  (t) => t === active.documentType,
                                ) || "行动计划",
                            })
                          : void analyze(active.sourceId)
                      }
                    >
                      重试本轮资料
                    </Button>
                  </div>
                )}
                {active.purpose === "deliverable" &&
                  active.status === "completed" && (
                    <div className="wb-note">
                      交付草稿已生成。请在资产区核对正文，审核后才可作为项目证据。
                      <Button
                        variant="secondary"
                        onClick={() => setPanel("assets")}
                      >
                        查看并审核文档
                      </Button>
                    </div>
                  )}
                {active.judgment && active.purpose !== "deliverable" && (
                  <>
                    <div className="wb-verdict">
                      <span className="wb-label">AI 建议 · 等待你的判断</span>
                      <p>{active.judgment.recommendation}</p>
                      <small>
                        建议关注：
                        {
                          stages.find(
                            (s) => s.id === active.judgment!.suggestedStage,
                          )?.name
                        }{" "}
                        · 当前阶段由 FDE 确认后推进
                      </small>
                    </div>
                    <details className="wb-summary">
                      <summary>查看完整分析判断</summary>
                      <p>{active.judgment.summary}</p>
                    </details>
                    <div className="wb-facts-heading">
                      <h3>01 · 识别到的事实</h3>
                      <span>
                        {
                          facts.filter((fact) => fact.status === "confirmed")
                            .length
                        }{" "}
                        / {facts.length} 已确认
                      </span>
                    </div>
                    {facts.length === 0 ? (
                      <p className="wb-muted">
                        本轮没有新增可逐字核对的事实；已有事实保留在项目记忆中。
                      </p>
                    ) : (
                      <div className="wb-facts">
                        {facts.map((fact) => (
                          <div className="wb-fact" key={fact.id}>
                            <label>
                              <input
                                type="checkbox"
                                disabled={fact.status !== "proposed"}
                                checked={selectedFacts.includes(fact.id)}
                                onChange={(e) =>
                                  setSelectedFacts(
                                    e.target.checked
                                      ? [...selectedFacts, fact.id]
                                      : selectedFacts.filter(
                                          (id) => id !== fact.id,
                                        ),
                                  )
                                }
                              />
                              <span>{fact.text}</span>
                              <Badge
                                tone={
                                  fact.status === "confirmed"
                                    ? "success"
                                    : fact.status === "rejected"
                                      ? "neutral"
                                      : "warning"
                                }
                              >
                                {statusLabels[fact.status]}
                              </Badge>
                            </label>
                            <details>
                              <summary>查看来源与原文</summary>
                              <blockquote>{fact.quote}</blockquote>
                              <small>
                                {
                                  project.sources.find(
                                    (s) => s.id === fact.sourceId,
                                  )?.title
                                }
                                {fact.confirmedBy &&
                                  ` · ${fact.confirmedBy} · ${time(fact.confirmedAt!)}`}
                              </small>
                            </details>
                          </div>
                        ))}
                      </div>
                    )}
                    {facts.some((f) => f.status === "proposed") && (
                      <div className="wb-fact-actions">
                        <button
                          onClick={() =>
                            setSelectedFacts(
                              facts
                                .filter((f) => f.status === "proposed")
                                .map((f) => f.id),
                            )
                          }
                        >
                          选择全部待核实
                        </button>
                        <Button
                          variant="ghost"
                          disabled={!selectedFacts.length}
                          onClick={() =>
                            setDraft({
                              type: "facts",
                              factIds: selectedFacts,
                              status: "rejected",
                            })
                          }
                        >
                          否决提取
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={!selectedFacts.length}
                          onClick={() =>
                            setDraft({
                              type: "facts",
                              factIds: selectedFacts,
                              status: "confirmed",
                            })
                          }
                        >
                          确认事实（{selectedFacts.length}）
                        </Button>
                      </div>
                    )}
                    <CoreInsights analysis={active} project={project} />
                    <div className="wb-gaps">
                      <div>
                        <h3>信息缺口</h3>
                        {active.judgment.missing.length ? (
                          <ul>
                            {active.judgment.missing.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>
                            本轮未提出新的信息缺口；请继续核对阶段完成条件。
                          </p>
                        )}
                      </div>
                      <div>
                        <h3>矛盾与不确定性</h3>
                        {active.judgment.contradictions.length ? (
                          <ul>
                            {active.judgment.contradictions.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>当前资料未识别出明确冲突。</p>
                        )}
                      </div>
                    </div>
                    <div className="wb-facts-heading">
                      <h3>02 · 推荐行动</h3>
                      <span>
                        {active.actionsConfirmedAt
                          ? "已写入项目"
                          : "待 FDE 确认"}
                      </span>
                    </div>
                    <ol className="wb-recommendations">
                      {active.judgment.actions.map((action, index) => (
                        <li key={index}>
                          <span>{index + 1}</span>
                          <div>
                            <strong>{action.title}</strong>
                            <ActionMetadata action={action} project={project} />
                            <small>
                              {action.owner} ·{" "}
                              {stages.find((s) => s.id === action.stage)?.name}
                              {action.blocking ? " · 阶段必需" : " · 可并行"}
                            </small>
                          </div>
                        </li>
                      ))}
                    </ol>
                    {active.judgment.deliverables.length > 0 && (
                      <details className="wb-draft-assets">
                        <summary>
                          查看 {active.judgment.deliverables.length} 份交付物
                          {active.actionsConfirmedAt ? "正文" : "草稿"}
                        </summary>
                        {active.judgment.deliverables.map((asset, i) => (
                          <details key={i}>
                            <summary>{asset.title}</summary>
                            <pre>{asset.content}</pre>
                          </details>
                        ))}
                      </details>
                    )}
                    <div className="wb-judgment-actions">
                      <Button
                        disabled={
                          !!active.actionsConfirmedAt ||
                          staleAnalysis ||
                          !active.judgment.actions.length
                        }
                        onClick={() =>
                          setDraft({
                            type: "actions",
                            analysisId: active.id,
                            actions: active.judgment!.actions,
                          })
                        }
                      >
                        <Play size={14} />
                        {active.actionsConfirmedAt
                          ? "行动已确认"
                          : "确认并执行"}
                      </Button>
                      <Button variant="secondary" onClick={focusInput}>
                        补充信息
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!!active.actionsConfirmedAt || staleAnalysis}
                        onClick={() =>
                          setDraft({
                            type: "actions",
                            analysisId: active.id,
                            actions: active.judgment!.actions.length
                              ? active.judgment!.actions
                              : [
                                  {
                                    title: "",
                                    owner: project.owner,
                                    stage: project.currentStage,
                                    blocking: true,
                                  },
                                ],
                          })
                        }
                      >
                        修改建议
                      </Button>
                    </div>
                    {staleAnalysis && !active.actionsConfirmedAt && (
                      <p className="wb-muted">
                        项目阶段或事实依据已变化，请重新分析后确认行动。
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </div>
        <ProjectPanel
          project={project}
          stage={stage}
          panel={panel}
          setPanel={setPanel}
          onCommand={setDraft}
          onAnalyze={(id) => {
            setSourceId(id);
            void analyze(id);
          }}
          busy={busy || running}
        />
      </div>
      <footer className="wb-desk-footer">
        <span>
          <CircleCheck size={13} />
          记录已保存 · {time(project.updatedAt)} ·{" "}
          {evidenceOptions(project).length} 项可追溯证据
        </span>
        <Link href="/dashboard">
          旧版项目与工具 <ArrowRight size={13} />
        </Link>
      </footer>
      {draft && (
        <DecisionDialog
          project={project}
          draft={draft}
          onClose={() => setDraft(null)}
          onSubmit={command}
        />
      )}
    </main>
  );
}
