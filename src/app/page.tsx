"use client";

import {
  ArrowRight,
  Building2,
  Check,
  CircleCheck,
  KeyRound,
  LockKeyhole,
  Plus,
  ServerCog,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeSelector } from "@/components/theme-provider";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { PortalProvider, usePortal } from "@/lib/store";
import type { Workspace } from "@/lib/types";

const deliveryStages = [
  ["P0", "场景立项", "价值假设与边界"],
  ["P1", "场景澄清", "人机协作与基线"],
  ["P2", "评测准备", "测试集与阈值"],
  ["P3", "技术验证", "多版本 Eval"],
  ["P4", "业务试用", "真实用户验证"],
  ["P5", "生产决策", "证据与验收结论"],
] as const;

function Welcome() {
  const router = useRouter();
  const { state, createWorkspace } = usePortal();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Workspace["type"]>("企业空间");
  const [aiConfigured, setAiConfigured] = useState(false);

  useEffect(() => {
    void fetch("/api/ai/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { configured?: boolean }) =>
        setAiConfigured(Boolean(data.configured)),
      );
  }, []);

  const readiness = [
    [
      "01",
      "Workspace",
      Boolean(state.workspace.id),
      state.workspace.id ? state.workspace.name : "尚未创建",
    ],
    [
      "02",
      "DeepSeek API",
      aiConfigured,
      aiConfigured ? "真实连接已配置" : "等待服务端密钥",
    ],
    [
      "03",
      "业务项目",
      Boolean(state.project.id),
      state.project.id ? state.project.name : "等待创建",
    ],
  ] as const;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(circle_at_72%_16%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_38%),linear-gradient(180deg,var(--surface),transparent)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary)] font-data font-black text-white shadow-sm">
              F
            </span>
            <div>
              <b className="font-data block tracking-[.08em]">FDE PORTAL</b>
              <span className="block text-[8px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">
                AI DELIVERY MANAGEMENT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 text-xs text-[var(--muted)] sm:flex">
              <LockKeyhole size={13} className="text-[var(--success)]" />
              真实数据模式 · 服务端密钥隔离
            </div>
            <ThemeSelector />
          </div>
        </header>

        <section className="grid items-center gap-12 py-14 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
          <div className="animate-rise">
            <p className="font-data mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[var(--primary)]">
              <span className="h-px w-8 bg-[var(--primary)]" />
              FDE AI DELIVERY OPERATING SYSTEM
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.15] tracking-[-.035em] sm:text-5xl lg:text-[62px]">
              让 AI 项目从场景定义，
              <br />
              <span className="text-[var(--primary)]">走到可验收交付。</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              为 FDE 团队统一管理需求澄清、POC、Eval、风险、评审与验收，
              让每个生产决策都有真实数据和可追溯证据。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {state.workspace.id ? (
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="!px-5"
                >
                  进入 {state.workspace.name} <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={() => setWorkspaceOpen(true)}
                  className="!px-5"
                >
                  <Plus size={15} />
                  创建 Workspace
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => router.push("/settings/ai")}
              >
                <KeyRound size={15} />
                配置 DeepSeek
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs text-[var(--muted)]">
              {["需求可追踪", "评测可复现", "验收有证据"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CircleCheck size={14} className="text-[var(--success)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="animate-rise-2 relative">
            <div className="absolute -inset-5 rounded-[20px] border border-[var(--primary-border)]/60 bg-[var(--primary-soft)]/50" />
            <div className="relative rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-data text-[10px] font-bold uppercase tracking-[.18em] text-[var(--primary)]">
                    DELIVERY READINESS
                  </p>
                  <h2 className="mt-2 text-xl font-bold">项目交付就绪度</h2>
                </div>
                <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--primary)]">
                  LIVE
                </span>
              </div>
              <div className="mt-7 space-y-3">
                {readiness.map(([code, label, ready, detail]) => (
                  <div
                    key={code}
                    className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-subtle)] p-4"
                  >
                    <span
                      className={`font-data grid size-9 place-items-center rounded-[var(--radius-sm)] text-[10px] font-black ${
                        ready
                          ? "bg-[var(--success-soft)] text-[var(--success)]"
                          : "bg-[var(--surface-hover)] text-[var(--muted)]"
                      }`}
                    >
                      {ready ? <Check size={15} /> : code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="text-sm">{label}</b>
                      <p className="mt-1 truncate text-[10px] text-[var(--muted)]">
                        {detail}
                      </p>
                    </div>
                    <span
                      className={`size-2 rounded-full ${ready ? "bg-[var(--success)]" : "bg-[var(--line-strong)]"}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--primary-soft)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
                <ServerCog
                  size={16}
                  className="mt-0.5 shrink-0 text-[var(--primary)]"
                />
                <span>
                  <b className="text-[var(--primary-ink)]">真实模型连接</b>
                  <br />
                  DeepSeek 配置保存在服务端，写入业务数据前必须人工确认。
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-rise-3 mb-14 rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="font-data text-[10px] font-bold uppercase tracking-[.18em] text-[var(--primary)]">
                DELIVERY GATES
              </p>
              <h2 className="mt-2 text-xl font-bold">
                从业务问题到生产决策的六道门禁
              </h2>
            </div>
            <p className="text-xs text-[var(--muted)]">
              每一阶段都有负责人、验收项与证据
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {deliveryStages.map(([code, title, detail], index) => (
              <div
                key={code}
                className="group relative rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-subtle)] p-4 transition hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-data text-xs font-black text-[var(--primary)]">
                    {code}
                  </span>
                  {index < deliveryStages.length - 1 && (
                    <ArrowRight
                      size={13}
                      className="hidden text-[var(--line-strong)] lg:block"
                    />
                  )}
                </div>
                <b className="mt-5 block text-sm">{title}</b>
                <p className="mt-1 text-[10px] leading-5 text-[var(--muted)]">
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-auto flex flex-col justify-between gap-3 border-t border-[var(--line)] py-5 text-[10px] uppercase tracking-[.12em] text-[var(--muted)] sm:flex-row">
          <span>FDE 专用 AI 交付项目管理平台</span>
          <span>DEEPSEEK · SUPABASE READY · VERCEL READY</span>
        </footer>
      </div>

      <Modal
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        title="创建 Workspace"
        description="建立企业 AI 项目的数据与权限边界。"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createWorkspace({ name, type });
            setWorkspaceOpen(false);
            router.push("/dashboard");
          }}
          className="grid gap-5"
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              ["团队空间", UsersRound],
              ["企业空间", Building2],
            ].map(([item, Icon]) => (
              <button
                type="button"
                key={String(item)}
                onClick={() => setType(item as Workspace["type"])}
                className={`grid place-items-center gap-2 rounded-[var(--radius-md)] border p-3 text-xs transition ${
                  type === item
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-ink)]"
                    : "border-[var(--line)] hover:border-[var(--primary-border)]"
                }`}
              >
                <Icon size={18} />
                {String(item)}
              </button>
            ))}
          </div>
          <Field label="Workspace 名称">
            <Input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="输入 Workspace 名称"
            />
          </Field>
          <Field label="数据区域">
            <Select defaultValue="cn">
              <option value="cn">中国大陆</option>
              <option value="sg">新加坡</option>
            </Select>
          </Field>
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] p-3 text-xs leading-5 text-[var(--muted)]">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-[var(--primary)]"
              size={16}
            />
            本地模式只保存你主动创建的业务数据；可随时在侧栏清空。
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setWorkspaceOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              创建并进入
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

export default function Home() {
  return (
    <PortalProvider>
      <Welcome />
    </PortalProvider>
  );
}
