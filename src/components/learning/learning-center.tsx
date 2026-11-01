"use client";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Layers3,
  Search,
} from "lucide-react";
import { ThemeSelector } from "@/components/theme-provider";
import {
  learningStacks,
  practiceSteps,
  glossary,
  starterPrompt,
  type StackCategory,
} from "@/lib/learning";

const progressKey = "fde-learning-progress-v1";
function subscribeProgress(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("fde-learning-progress", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("fde-learning-progress", notify);
  };
}
function progressSnapshot() {
  try {
    return localStorage.getItem(progressKey) || "[]";
  } catch {
    return "unavailable";
  }
}
function parseProgress(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? [
          ...new Set(
            parsed.filter(
              (id: unknown): id is string =>
                typeof id === "string" &&
                practiceSteps.some((step) => step.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
export function LearningCenter() {
  const [category, setCategory] = useState<StackCategory | "全部">("全部");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("next-supabase");
  const saved = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    () => "[]",
  );
  const storageReady = useSyncExternalStore(
    subscribeProgress,
    () => true,
    () => false,
  );
  const [temporaryDone, setTemporaryDone] = useState<string[] | null>(null);
  const done = temporaryDone ?? parseProgress(saved);
  const [notice, setNotice] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const detail = useRef<HTMLHeadingElement>(null);
  const prompt = useRef<HTMLTextAreaElement>(null);
  const results = learningStacks.filter(
    (s) =>
      (category === "全部" || s.category === category) &&
      [s.name, s.goal, s.summary, s.fit, ...s.parts.map((p) => p.name)]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const stack = results.find((s) => s.id === selected) || results[0];
  function choose(id: string) {
    setSelected(id);
    setCopyNotice("");
    requestAnimationFrame(() => {
      detail.current?.focus({ preventScroll: true });
      detail.current?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }
  function toggle(id: string) {
    const next = done.includes(id)
      ? done.filter((x) => x !== id)
      : [...done, id];
    try {
      localStorage.setItem(progressKey, JSON.stringify(next));
      setTemporaryDone(null);
      window.dispatchEvent(new Event("fde-learning-progress"));
      setNotice("");
    } catch {
      setTemporaryDone(next);
      setNotice("浏览器未允许保存，进度仅保留到关闭本页。");
    }
  }
  async function copyPrompt() {
    if (!stack) return;
    try {
      await navigator.clipboard.writeText(starterPrompt(stack));
      setCopyNotice("已复制，替换方括号中的内容即可使用。");
    } catch {
      prompt.current?.focus();
      prompt.current?.select();
      setCopyNotice("自动复制不可用，已选中提示词，请手动复制。");
    }
  }
  return (
    <div className="learn-app">
      <header className="learn-header">
        <Link className="learn-brand" href="/workbench">
          <span>
            <Layers3 size={20} />
          </span>
          FDE <b>Workbench</b>
        </Link>
        <nav aria-label="学习中心导航">
          <a href="#stacks">技术栈</a>
          <a href="#practice">实践路线</a>
          <a href="#terms">概念速查</a>
          <ThemeSelector />
          <Link className="learn-return" href="/workbench">
            <ArrowLeft size={15} />
            返回工作台
          </Link>
        </nav>
      </header>
      <main className="learn-main">
        <section className="learn-hero">
          <div>
            <div className="learn-eyebrow">
              <BookOpen size={14} /> FIELD GUIDE / 学习中心
            </div>
            <h1>
              把想法，写成
              <br />
              <em>能运行的产品。</em>
            </h1>
            <p>
              从 Vibe Coding
              开始，理解你正在构建什么。按业务场景选择技术栈，用一条真实的用户路径完成第一次交付。
            </p>
            <a className="learn-primary" href="#stacks">
              找到适合我的技术栈 <ArrowUpRight size={17} />
            </a>
          </div>
          <aside className="learn-blueprint" aria-label="应用的四层结构">
            <span>ANATOMY OF AN APP</span>
            <h2>先认清四层，再开始写代码</h2>
            {[
              ["01", "界面", "用户看到什么、如何操作"],
              ["02", "服务", "规则、权限和模型调用"],
              ["03", "数据", "记录存在哪里、谁能访问"],
              ["04", "交付", "如何部署、验证与恢复"],
            ].map(([n, title, body]) => (
              <div key={n}>
                <small>{n}</small>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            ))}
            <footer>AI 帮你实现，人来定义目标、核实结果。</footer>
          </aside>
        </section>
        <section id="stacks" className="learn-section">
          <div className="learn-section-head">
            <div>
              <span className="learn-eyebrow">01 / CHOOSE YOUR STACK</span>
              <h2>从要做的产品，找到技术组合</h2>
            </div>
            <p>7 套参考组合 · 选型建议是实践判断，版本与限制以官方文档为准</p>
          </div>
          <div className="learn-toolbar">
            <div className="learn-filters" aria-label="技术栈分类">
              {(["全部", "网页与产品", "AI 与数据", "部署与交付"] as const).map(
                (c) => (
                  <button
                    type="button"
                    key={c}
                    aria-pressed={category === c}
                    onClick={() => {
                      setCategory(c);
                      setCopyNotice("");
                    }}
                  >
                    {c}
                  </button>
                ),
              )}
            </div>
            <label className="learn-search">
              <Search size={16} />
              <input
                aria-label="搜索技术栈或场景"
                placeholder="搜索 React、Python、看板…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCopyNotice("");
                }}
                type="search"
              />
            </label>
          </div>
          <p className="learn-result-count" aria-live="polite">
            找到 {results.length} 套技术组合
          </p>
          {stack ? (
            <div className="learn-stack-layout">
              <div className="learn-stack-list" aria-label="技术栈选择">
                {results.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={stack.id === s.id}
                    onClick={() => choose(s.id)}
                  >
                    <span className="learn-stack-meta">
                      {s.category}
                      <span>{s.level}</span>
                    </span>
                    <strong>{s.name}</strong>
                    <p>{s.goal}</p>
                    <span className="learn-stack-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
              <article className="learn-detail" aria-labelledby="stack-title">
                <div className="learn-detail-top">
                  <span className="learn-eyebrow">
                    STACK NOTES / {stack.level}
                  </span>
                  <h3 id="stack-title" ref={detail} tabIndex={-1}>
                    {stack.name}
                  </h3>
                  <p>{stack.summary}</p>
                </div>
                <dl className="learn-parts">
                  {stack.parts.map((p) => (
                    <div key={p.name}>
                      <dt>{p.name}</dt>
                      <dd>{p.role}</dd>
                    </div>
                  ))}
                </dl>
                <div className="learn-fit">
                  <div>
                    <h4>什么时候选</h4>
                    <p>{stack.fit}</p>
                  </div>
                  <div>
                    <h4>需要想清楚的取舍</h4>
                    <p>{stack.tradeoff}</p>
                  </div>
                </div>
                <div className="learn-exercise">
                  <span>动手练习</span>
                  <h4>{stack.exercise}</h4>
                  <ol>
                    {stack.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div className="learn-checks">
                  <h4>做到这些，再算完成</h4>
                  {stack.checks.map((check) => (
                    <p key={check}>
                      <Check size={15} />
                      {check}
                    </p>
                  ))}
                </div>
                <details className="learn-prompt" key={stack.id}>
                  <summary>给 AI 编程助手的开工提示词</summary>
                  <textarea
                    ref={prompt}
                    aria-label="开工提示词"
                    readOnly
                    value={starterPrompt(stack)}
                    rows={13}
                  />
                  <button type="button" onClick={() => void copyPrompt()}>
                    <Copy size={14} />
                    复制提示词
                  </button>
                  <p role="status">{copyNotice}</p>
                </details>
                <footer className="learn-docs">
                  <span>继续阅读 · 官方文档</span>
                  {stack.docs.map((d) => (
                    <a
                      key={d.url}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {d.name}
                      <ArrowUpRight size={13} />
                    </a>
                  ))}
                </footer>
              </article>
            </div>
          ) : (
            <div className="learn-empty">
              <h3>没有找到匹配的技术栈</h3>
              <p>试试框架名称或产品场景，例如“Python”“表单”“部署”。</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("全部");
                }}
              >
                清除筛选
              </button>
            </div>
          )}
        </section>
        <section id="practice" className="learn-section">
          <div className="learn-section-head">
            <div>
              <span className="learn-eyebrow">02 / BUILD A REAL SLICE</span>
              <h2>从第一句需求，到第一次交付</h2>
            </div>
            <div className="learn-progress">
              <strong>
                {done.length} / {practiceSteps.length}
              </strong>
              <span>已自查 · 仅保存在当前浏览器</span>
            </div>
          </div>
          <div className="learn-steps">
            {practiceSteps.map((s, i) => (
              <article
                key={s.id}
                className={done.includes(s.id) ? "is-done" : ""}
              >
                <span className="learn-step-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <small>产出：{s.deliverable}</small>
                <label>
                  <input
                    type="checkbox"
                    disabled={!storageReady}
                    checked={done.includes(s.id)}
                    onChange={() => toggle(s.id)}
                  />
                  我已完成这一步自查
                </label>
              </article>
            ))}
          </div>
          <p className="learn-storage-notice" role="status">
            {notice}
          </p>
        </section>
        <section id="terms" className="learn-section">
          <div className="learn-section-head">
            <div>
              <span className="learn-eyebrow">
                03 / SPEAK THE SAME LANGUAGE
              </span>
              <h2>几个概念，先弄明白</h2>
            </div>
            <p>遇到不熟悉的术语，先问它解决的是哪一层问题。</p>
          </div>
          <div className="learn-glossary">
            {glossary.map(([title, body]) => (
              <details key={title}>
                <summary>{title}</summary>
                <p>{body}</p>
              </details>
            ))}
          </div>
        </section>
        <aside className="learn-project-note">
          <div>
            <span className="learn-eyebrow">LEARN FROM THIS WORKBENCH</span>
            <h2>把所学带回真实项目</h2>
            <p>
              这个工作台使用 Next.js、React、TypeScript、Tailwind CSS 和服务端
              DeepSeek 调用，部署在 Ubuntu 的 Docker
              容器中。当前数据以单机文件持久化；Supabase
              是可选扩展方向，尚未接入。
            </p>
          </div>
          <Link href="/workbench">
            打开工作台 <ArrowUpRight size={17} />
          </Link>
        </aside>
        <footer className="learn-footer">
          <span>FDE FIELD GUIDE · 内容核对于 2026-11-01</span>
          <p>
            练习说明不写入企业项目，也不会自动调用模型。官方文档在新标签页打开。
          </p>
        </footer>
      </main>
    </div>
  );
}
