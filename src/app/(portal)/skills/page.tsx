"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Clock3,
  Code2,
  Download,
  ExternalLink,
  FileArchive,
  GitFork,
  LoaderCircle,
  Search,
  ShieldCheck,
  TerminalSquare,
  Workflow,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Modal,
  PageHeader,
  Textarea,
} from "@/components/ui";
import {
  skillCatalog,
  skillsManifest,
  type CatalogSkill,
} from "@/lib/skills/catalog";

interface TaskView {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  provider: string;
  logs: Array<{ at: string; message: string }>;
  result?: string;
  error?: string;
}
function formatBytes(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
}
function statusMeta(status: TaskView["status"]) {
  return {
    queued: ["排队中", "neutral", Clock3],
    running: ["后台执行中", "info", LoaderCircle],
    completed: ["已完成", "success", CheckCircle2],
    failed: ["执行失败", "danger", XCircle],
  }[status] as [
    string,
    "neutral" | "info" | "success" | "danger",
    typeof Clock3,
  ];
}

export default function SkillsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [selected, setSelected] = useState<CatalogSkill | null>(null);
  const [taskInput, setTaskInput] = useState(
    "请基于我们的企业 AI 客服 POC，输出可执行的分析框架、关键问题、交付物清单和验收标准。当前目标是把平均处理时间从 8 分钟降低到 2 分钟。",
  );
  const [task, setTask] = useState<TaskView | null>(null);
  const [error, setError] = useState("");
  const categories = useMemo(
    () => ["全部", ...new Set(skillCatalog.map((skill) => skill.category))],
    [],
  );
  const filtered = useMemo(
    () =>
      skillCatalog.filter(
        (skill) =>
          (category === "全部" || skill.category === category) &&
          `${skill.name} ${skill.summary} ${skill.sourcePath}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [category, query],
  );
  const openSkill = (skill: CatalogSkill) => {
    setSelected(skill);
    setTask(null);
    setError("");
  };
  const close = () => {
    setSelected(null);
    setTask(null);
    setError("");
  };

  const run = async () => {
    if (!selected) return;
    setError("");
    setTask(null);
    const response = await fetch("/api/skills/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: selected.id, input: taskInput }),
    });
    const body = (await response.json()) as { task?: TaskView; error?: string };
    if (!response.ok || !body.task) {
      setError(body.error || "无法创建后台任务");
      return;
    }
    setTask(body.task);
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const poll = await fetch(`/api/skills/tasks/${body.task.id}`, {
        cache: "no-store",
      });
      if (!poll.ok) {
        setError("任务状态已过期，请重新执行");
        return;
      }
      const next = (await poll.json()) as { task: TaskView };
      setTask(next.task);
      if (["completed", "failed"].includes(next.task.status)) return;
    }
    setError("任务执行超时，请稍后在后台任务中查看");
  };

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="FDE SKILL REGISTRY"
        title="Skill 中心"
        description="已将 bingyue/fde-skills 初始化为可检索、可下载、可在线触发的项目技能目录。脚本型 Skill 默认只运行 Prompt，任何仓库代码都不会被自动执行。"
        actions={
          <a
            href={`${skillsManifest.source}/archive/refs/heads/${skillsManifest.branch}.zip`}
            className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold"
            target="_blank"
            rel="noreferrer"
          >
            <GitFork size={14} />
            下载完整仓库
          </a>
        }
      />
      <section className="mb-6 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["已初始化 Skill", skillsManifest.total],
          ["分类", categories.length - 1],
          ["同步 Commit", skillsManifest.commit],
          ["仓库 License", skillsManifest.license],
        ].map(([label, value], index) => (
          <div key={String(label)} className="bg-[var(--surface)] p-4">
            <span className="text-[10px] text-[var(--muted)]">{label}</span>
            <b
              className={`font-data mt-1 block ${index < 2 ? "text-2xl" : "text-lg"} ${index === 3 ? "text-[var(--warning)]" : ""}`}
            >
              {value}
            </b>
          </div>
        ))}
      </section>
      <section className="card mb-6 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-h-10 flex-1 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3">
            <Search size={15} className="text-[var(--muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="搜索 Skill 名称、说明或路径…"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:max-w-[65%]">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-[var(--radius-sm)] border px-3 py-2 text-xs ${category === item ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-ink)]" : "border-[var(--line)] text-[var(--muted)]"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">
          找到 <b className="font-data text-[var(--ink)]">{filtered.length}</b>{" "}
          个 Skill
        </p>
        <a
          href={skillsManifest.source}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]"
        >
          查看 GitHub 源仓库 <ExternalLink size={12} />
        </a>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((skill) => (
          <article
            key={skill.id}
            className="card group flex min-h-64 flex-col p-5 transition hover:-translate-y-0.5 hover:border-[var(--primary-border)]"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                {skill.hasScripts ? (
                  <Code2 size={17} />
                ) : (
                  <Workflow size={17} />
                )}
              </span>
              <Badge tone={skill.hasScripts ? "warning" : "success"}>
                {skill.hasScripts ? "脚本已隔离" : "可在线触发"}
              </Badge>
            </div>
            <h2 className="mt-4 text-sm font-bold">{skill.name}</h2>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--muted)]">
              {skill.summary}
            </p>
            <div className="mt-auto flex items-end justify-between border-t border-[var(--line)] pt-4">
              <div>
                <Badge tone="info">{skill.category}</Badge>
                <p className="font-data mt-2 text-[9px] text-[var(--muted)]">
                  {skill.fileCount} files · {formatBytes(skill.sizeBytes)}
                </p>
              </div>
              <button
                onClick={() => openSkill(skill)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]"
              >
                查看与运行 <ChevronRight size={13} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="grid min-h-56 place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-[var(--surface)] text-center">
          <div>
            <Search className="mx-auto text-[var(--muted)]" />
            <b className="mt-3 block">没有匹配的 Skill</b>
            <button
              onClick={() => {
                setQuery("");
                setCategory("全部");
              }}
              className="mt-2 text-xs text-[var(--primary)]"
            >
              清除筛选
            </button>
          </div>
        </div>
      )}
      <Modal
        open={!!selected}
        onClose={close}
        title={selected?.name || "Skill 详情"}
        description={
          selected ? `${selected.category} · ${selected.sourcePath}` : ""
        }
        wide
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  {selected.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="info">{selected.category}</Badge>
                  <Badge tone="neutral">{selected.fileCount} 个文件</Badge>
                  <Badge tone={selected.hasScripts ? "warning" : "success"}>
                    {selected.hasScripts
                      ? "包含脚本 · Prompt Only"
                      : "Safe Prompt"}
                  </Badge>
                  {selected.hasWorkflow && (
                    <Badge tone="neutral">包含工作流</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-row gap-2 sm:flex-col">
                <a
                  href={selected.downloadUrl}
                  download
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--primary)] bg-[var(--primary)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--primary-hover)] dark:text-[#071426]"
                >
                  <Download size={14} />
                  下载 ZIP
                </a>
                <a
                  href={selected.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] px-3.5 py-2 text-xs font-semibold"
                >
                  <ExternalLink size={14} />
                  查看源码
                </a>
              </div>
            </div>
            <section className="rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--primary)]"
                />
                <div>
                  <b className="text-xs">在线执行安全边界</b>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    后台只把 Skill Prompt 和你的任务背景交给 AI
                    Provider。Python、Shell、MCP 与外部 Tool
                    不会自动运行；下载后由使用者自行审计。最多 3
                    个并发任务，输入上限 8,000 字。
                  </p>
                </div>
              </div>
            </section>
            <section>
              <div className="mb-4">
                <h2 className="text-[15px] font-bold">在线触发</h2>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  提交后立即返回 Task ID，后台执行并轮询日志
                </p>
              </div>
              <Field label="任务背景与期望产物">
                <Textarea
                  value={taskInput}
                  onChange={(event) => setTaskInput(event.target.value)}
                  className="min-h-32"
                />
              </Field>
              {error && (
                <div className="mt-3 flex items-center gap-2 bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={run}
                  disabled={
                    !!task && ["queued", "running"].includes(task.status)
                  }
                >
                  <CirclePlay size={15} />
                  {task && ["queued", "running"].includes(task.status)
                    ? "后台执行中"
                    : "触发 Skill"}
                </Button>
              </div>
            </section>
            {task && (
              <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)]">
                <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TerminalSquare size={15} />
                    <b className="text-xs">后台任务</b>
                    <span className="font-data text-[9px] text-[var(--muted)]">
                      {task.id.slice(0, 8)}
                    </span>
                  </div>
                  {(() => {
                    const [label, tone, Icon] = statusMeta(task.status);
                    return (
                      <Badge tone={tone}>
                        <Icon
                          size={11}
                          className={
                            task.status === "running" ? "animate-spin" : ""
                          }
                        />
                        {label}
                      </Badge>
                    );
                  })()}
                </div>
                <div className="bg-[var(--console-bg)] p-4 font-data text-[11px] leading-6 text-[var(--console-ink)]">
                  {task.logs.map((item, index) => (
                    <p key={`${item.at}-${index}`}>
                      <span className="text-[var(--console-muted)]">
                        {new Date(item.at).toLocaleTimeString("zh-CN", {
                          hour12: false,
                        })}
                      </span>{" "}
                      <span className="text-[var(--primary)]">›</span>{" "}
                      {item.message}
                    </p>
                  ))}
                </div>
                {task.error && (
                  <div className="bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]">
                    {task.error}
                  </div>
                )}
                {task.result && (
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <b className="text-xs">工作产物</b>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(task.result || "")
                        }
                        className="text-[10px] text-[var(--primary)]"
                      >
                        复制 Markdown
                      </button>
                    </div>
                    <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-subtle)] p-4 font-sans text-xs leading-6 text-[var(--ink)]">
                      {task.result}
                    </pre>
                  </div>
                )}
              </section>
            )}
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 text-[10px] text-[var(--muted)]">
              <span className="inline-flex items-center gap-1">
                <FileArchive size={12} />
                下载包 {formatBytes(selected.sizeBytes)}
              </span>
              <span>
                来源 commit {skillsManifest.commit} · License{" "}
                {skillsManifest.license}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
