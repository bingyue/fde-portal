"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Layers3, Plus, Settings2 } from "lucide-react";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { ThemeSelector } from "@/components/theme-provider";
import { stages, type WorkProject } from "@/lib/workbench/model";
import { api, type ProjectSummary } from "./helpers";
import { ProjectDesk } from "./project-desk";

export function WorkbenchApp() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selected, setSelected] = useState("");
  const [project, setProject] = useState<WorkProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [legacy, setLegacy] = useState("");

  useEffect(() => {
    let active = true;
    api<{ projects: ProjectSummary[] }>("/api/workbench/projects")
      .then(({ projects: items }) => {
        if (!active) return;
        setProjects(items);
        const remembered = localStorage.getItem("fde-workbench-project");
        setSelected(
          items.some((item) => item.id === remembered)
            ? remembered!
            : items[0]?.id || "",
        );
        setLoading(false);
        const old = localStorage.getItem("fde-portal-live-v2");
        if (old) {
          try {
            const data = JSON.parse(old);
            if (data.project?.name)
              setLegacy(JSON.stringify(data, null, 2).slice(0, 60000));
          } catch {
            /* legacy storage is optional */
          }
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoading(false);
        }
      });
    api<{ configured: boolean }>("/api/ai/config")
      .then((value) => {
        if (active) setConfigured(value.configured);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    api<{ project: WorkProject }>(`/api/workbench/projects/${selected}`)
      .then(({ project: value }) => {
        if (active) {
          setProject(value);
          localStorage.setItem("fde-workbench-project", selected);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [selected]);

  function update(value: WorkProject) {
    setProject((current) =>
      current?.id !== value.id || current.revision > value.revision
        ? current
        : value,
    );
    setProjects((current) =>
      current.map((item) => (item.id === value.id ? value : item)),
    );
  }
  return (
    <div className="wb-app">
      <header className="wb-topbar">
        <Link className="wb-brand" href="/workbench">
          <span className="wb-brand-icon">
            <Layers3 size={20} />
          </span>
          <span>
            FDE <b>Workbench</b>
            <small>企业 AI 转型智能工作台</small>
          </span>
        </Link>
        <div className="wb-project-switch">
          <Select
            aria-label="当前项目"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setError("");
            }}
          >
            <option value="" disabled>
              {loading ? "正在加载…" : "选择项目"}
            </option>
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Plus size={15} />
            新建项目
          </Button>
        </div>
        <nav className="wb-topnav">
          <Link href="/settings/ai">
            <Settings2 size={15} />
            <span>模型配置</span>
          </Link>
          <ThemeSelector />
        </nav>
      </header>
      {error && (
        <div role="alert" className="wb-error wb-global-error">
          {error}
          <Button variant="ghost" onClick={() => location.reload()}>
            重新加载
          </Button>
        </div>
      )}
      {loading ? (
        <div className="wb-loading" role="status">
          正在读取项目…
        </div>
      ) : !selected ? (
        <main className="wb-welcome">
          <div className="wb-welcome-copy">
            <span className="wb-eyebrow">
              FROM BUSINESS PROBLEM TO REAL IMPACT
            </span>
            <h1>
              把企业问题，
              <br />
              推进成可交付的成果。
            </h1>
            <p>
              输入现场信息，让专业 Skills
              帮你理清事实、找到下一步。每一次判断都有依据，每一步推进由你确认。
            </p>
            <div className="wb-row">
              <Button onClick={() => setCreating(true)}>
                <Plus size={16} />
                创建第一个项目
              </Button>
              <Link className="wb-text-link" href="/settings/ai">
                连接 DeepSeek <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="wb-welcome-points">
              <span>
                <Check size={14} />
                真实资料驱动
              </span>
              <span>
                <Check size={14} />
                人工决策留痕
              </span>
              <span>
                <Check size={14} />
                项目记忆持续保留
              </span>
            </div>
          </div>
          <section className="wb-welcome-map" aria-label="企业 AI 项目全流程">
            <div className="wb-row wb-between">
              <span className="wb-eyebrow">THE FDE LIFECYCLE</span>
              <span className="wb-muted">9 个阶段 · 12 项专业能力</span>
            </div>
            {stages.map((stage, i) => (
              <div className="wb-welcome-stage" key={stage.id}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{stage.name}</strong>
                <p>{stage.goal}</p>
              </div>
            ))}
          </section>
          <footer className="wb-welcome-footer">
            从业务事实出发，经过验证再推进。
            <Link href="/dashboard">
              查看旧版项目记录 <ArrowUpRight size={14} />
            </Link>
          </footer>
        </main>
      ) : project?.id === selected ? (
        <ProjectDesk
          key={project.id}
          project={project}
          onUpdate={update}
          configured={configured}
        />
      ) : (
        <div className="wb-loading" role="status">
          正在打开项目…
        </div>
      )}
      {creating && (
        <CreateProjectDialog
          legacy={legacy}
          onClose={() => setCreating(false)}
          onCreated={(value) => {
            setProjects((items) => [value, ...items]);
            setProject(value);
            setSelected(value.id);
            setCreating(false);
            setError("");
          }}
        />
      )}
    </div>
  );
}

function CreateProjectDialog({
  legacy,
  onClose,
  onCreated,
}: {
  legacy: string;
  onClose: () => void;
  onCreated: (project: WorkProject) => void;
}) {
  const [input, setInput] = useState({
    name: "",
    organization: "",
    goal: "",
    owner: "",
  });
  const [importLegacy, setImportLegacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title="创建企业项目"
      description="从真实的问题开始，后续资料、任务和成果都保存在这个项目里。"
    >
      <form
        className="wb-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const { project } = await api<{ project: WorkProject }>(
              "/api/workbench/projects",
              { ...input, ...(importLegacy ? { legacyText: legacy } : {}) },
            );
            onCreated(project);
          } catch (e) {
            setError(e instanceof Error ? e.message : "创建失败");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label="项目名称">
          <Input
            required
            autoFocus
            minLength={2}
            maxLength={100}
            placeholder="如：售后知识检索效率提升"
            value={input.name}
            onChange={(e) => setInput({ ...input, name: e.target.value })}
          />
        </Field>
        <div className="wb-two">
          <Field label="企业 / 团队">
            <Input
              required
              maxLength={100}
              value={input.organization}
              onChange={(e) =>
                setInput({ ...input, organization: e.target.value })
              }
            />
          </Field>
          <Field label="FDE 负责人">
            <Input
              required
              maxLength={100}
              value={input.owner}
              onChange={(e) => setInput({ ...input, owner: e.target.value })}
            />
          </Field>
        </div>
        <Field label="要解决的业务问题">
          <Textarea
            required
            minLength={5}
            maxLength={2000}
            placeholder="谁在什么场景遇到了什么问题？这次希望改变什么？"
            value={input.goal}
            onChange={(e) => setInput({ ...input, goal: e.target.value })}
          />
        </Field>
        {legacy && (
          <label className="wb-check">
            <input
              type="checkbox"
              checked={importLegacy}
              onChange={(e) => setImportLegacy(e.target.checked)}
            />
            将此浏览器的旧版项目记录作为待核实资料导入
          </label>
        )}
        {error && (
          <p role="alert" className="wb-error">
            {error}
          </p>
        )}
        <Button disabled={busy} type="submit">
          {busy ? "正在创建…" : "创建项目并进入工作台"}
        </Button>
      </form>
    </Modal>
  );
}
