"use client";

import {
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Plus,
  ServerCog,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, Input, Modal, Select } from "@/components/ui";
import { DemoProvider, useDemo } from "@/lib/store";
import type { Workspace } from "@/lib/types";

function Welcome() {
  const router = useRouter();
  const { state, createWorkspace } = useDemo();
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
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09182d] text-white">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(184,243,75,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(184,243,75,.06) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div className="absolute -right-32 top-20 size-[520px] rounded-full border border-[#b8f34b]/10" />
      <div className="absolute -right-16 top-36 size-[390px] rounded-full border border-[#b8f34b]/10" />
      <div className="relative mx-auto flex min-h-screen max-w-[1380px] flex-col px-6 py-6 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center bg-[#b8f34b] font-data font-black text-[#09182d]">
              F
            </span>
            <div>
              <b className="font-data tracking-[.1em]">FDE PORTAL</b>
              <span className="ml-3 hidden text-[10px] uppercase tracking-[.2em] text-[#7890ae] sm:inline">
                Proof before scale
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#94a5b9]">
            <LockKeyhole size={13} />
            真实数据模式 · 服务端密钥隔离
          </div>
        </header>
        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div className="animate-rise">
            <p className="font-data mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.24em] text-[#b8f34b]">
              <span className="h-px w-8 bg-[#b8f34b]" />
              AI PROJECT DELIVERY OS
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.16] tracking-tight sm:text-5xl lg:text-[64px]">
              从空白业务问题，
              <br />
              <span className="text-[#b8f34b]">建立可验收的 AI 项目。</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#a9b6c8] sm:text-lg">
              系统不再加载任何样例项目。创建 Workspace，配置真实
              DeepSeek，再从你的企业场景开始建立证据链。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              {state.workspace.id ? (
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="!border-[#b8f34b] !bg-[#b8f34b] !px-5 !text-[#09182d]"
                >
                  进入 {state.workspace.name} <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={() => setWorkspaceOpen(true)}
                  className="!border-[#b8f34b] !bg-[#b8f34b] !px-5 !text-[#09182d]"
                >
                  <Plus size={15} />
                  创建 Workspace
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => router.push("/settings/ai")}
                className="!border-white/20 !bg-white/[.06] !text-white"
              >
                <KeyRound size={15} />
                配置 DeepSeek
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs text-[#8ea0b7]">
              {[
                "零预置业务数据",
                "密钥不进入浏览器存储",
                "AI 输出需确认后写入",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check size={13} className="text-[#b8f34b]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="animate-rise-2 relative">
            <div className="absolute -inset-5 border border-[#b8f34b]/10" />
            <div className="relative border border-white/15 bg-[#0e213d]/90 p-6 shadow-2xl backdrop-blur sm:p-8">
              <p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-[#7890ae]">
                LIVE READINESS
              </p>
              <h2 className="mt-3 text-xl font-bold">生产连接准备</h2>
              <div className="mt-7 space-y-3">
                {[
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
                    aiConfigured ? "连接已配置" : "等待密钥",
                  ],
                  [
                    "03",
                    "业务项目",
                    Boolean(state.project.id),
                    state.project.id ? state.project.name : "等待创建",
                  ],
                ].map(([code, label, ready, detail]) => (
                  <div
                    key={String(code)}
                    className="flex items-center gap-4 border border-white/10 bg-white/[.025] p-4"
                  >
                    <span
                      className={`font-data grid size-8 place-items-center text-[10px] font-black ${ready ? "bg-[#b8f34b] text-[#09182d]" : "border border-[#58708d] text-[#8ea0b7]"}`}
                    >
                      {String(code)}
                    </span>
                    <div className="flex-1">
                      <b className="text-sm">{String(label)}</b>
                      <p className="mt-1 text-[10px] text-[#7f92aa]">
                        {String(detail)}
                      </p>
                    </div>
                    <span
                      className={`size-2 ${ready ? "bg-[#b8f34b]" : "bg-[#536b86]"}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-3 border-l-2 border-[#b8f34b] bg-white/[.04] px-4 py-3 text-xs leading-5 text-[#a9b6c8]">
                <ServerCog
                  size={16}
                  className="mt-0.5 shrink-0 text-[#b8f34b]"
                />
                <span>
                  <b className="text-white">DeepSeek V4 接口</b>
                  <br />
                  默认使用 deepseek-v4-flash；保存前通过 `/models` 真实验证。
                </span>
              </div>
            </div>
          </div>
        </section>
        <footer className="flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[.14em] text-[#5f748e] sm:flex-row">
          <span>FDE 课程实训 × 企业 AI 项目交付</span>
          <span>DEEPSEEK V4 · SUPABASE READY · VERCEL READY</span>
        </footer>
      </div>
      <Modal
        open={workspaceOpen}
        onClose={() => setWorkspaceOpen(false)}
        title="创建 Workspace"
        description="不会载入任何示例项目或业务数据。"
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
          <div className="grid grid-cols-3 gap-2">
            {[
              ["课程空间", GraduationCap],
              ["团队空间", UsersRound],
              ["企业空间", Building2],
            ].map(([item, Icon]) => (
              <button
                type="button"
                key={String(item)}
                onClick={() => setType(item as Workspace["type"])}
                className={`grid place-items-center gap-2 border p-3 text-xs ${type === item ? "border-[#759d29] bg-[#f0f7e4] text-[#385c05] dark:bg-[#1d301b] dark:text-[#b8f34b]" : "border-[var(--line)]"}`}
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
          <div className="flex items-start gap-3 bg-[#eef4f7] p-3 text-xs leading-5 text-[#58687b] dark:bg-[#13263a] dark:text-[#aab5c4]">
            <ShieldCheck className="mt-0.5 shrink-0" size={16} />
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
    <DemoProvider>
      <Welcome />
    </DemoProvider>
  );
}
