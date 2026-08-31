"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Archive,
  Blocks,
  BriefcaseBusiness,
  CheckSquare2,
  ChevronDown,
  CircleUserRound,
  FileText,
  Gauge,
  GraduationCap,
  Home,
  KeyRound,
  Menu,
  Moon,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DemoProvider, useDemo } from "@/lib/store";
import { Badge } from "./ui";

const platform = [
  ["/dashboard", "我的工作台", Home],
  ["/projects/new", "项目中心", BriefcaseBusiness],
  ["/reviews", "待办与评审", CheckSquare2],
  ["/templates", "模板中心", Blocks],
  ["/project/assets", "资产中心", Archive],
  ["/skills", "Skill 中心", Workflow],
  ["/settings/ai", "AI 模型配置", KeyRound],
  ["/team", "团队设置", UsersRound],
] as const;
const project = [
  ["/project/overview", "项目总览", Gauge],
  ["/project/scenario", "场景卡", FileText],
  ["/project/poc", "POC 工作台", Activity],
  ["/project/evals", "Eval 中心", ShieldCheck],
  ["/project/assets", "AI 资产库", Sparkles],
  ["/project/reports", "报告与验收", GraduationCap],
] as const;

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, toast, clearLocalData } = useDemo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const isProject = pathname.startsWith("/project/");

  const pendingReviews = state.reviews.filter(
    (item) => item.status === "待评审",
  ).length;
  const navItem = ([href, label, Icon]:
    (typeof platform)[number] | (typeof project)[number]) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`group flex h-10 items-center gap-3 border-l-2 px-4 text-[13px] transition ${active ? "border-[#b8f34b] bg-white/[.08] text-white" : "border-transparent text-[#9fadc0] hover:bg-white/[.045] hover:text-white"}`}
      >
        <Icon
          size={16}
          className={
            active ? "text-[#b8f34b]" : "text-[#71829a] group-hover:text-white"
          }
        />
        <span className="truncate">{label}</span>
        {label === "待办与评审" && pendingReviews > 0 && (
          <span className="font-data ml-auto bg-[#b8f34b] px-1.5 text-[10px] font-bold text-[#0c1e3a]">
            {pendingReviews}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen paper-grid">
      <aside
        className={`portal-sidebar fixed inset-y-0 left-0 z-50 flex w-[244px] flex-col bg-[#0c1e3a] text-white transition-transform duration-300 ${mobileOpen ? "!translate-x-0" : ""}`}
      >
        <div className="flex h-[68px] items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid size-8 place-items-center border border-[#b8f34b]/60 bg-[#b8f34b] text-sm font-black text-[#0c1e3a]">
              F
            </span>
            <span>
              <b className="font-data text-sm tracking-[.08em]">FDE PORTAL</b>
              <small className="block text-[9px] tracking-[.18em] text-[#788ba5]">
                PROOF OF VALUE
              </small>
            </span>
          </Link>
          <button
            className="hidden text-[#8393aa] max-[900px]:block"
            onClick={() => setMobileOpen(false)}
            aria-label="关闭导航"
          >
            <X size={18} />
          </button>
        </div>
        <div className="border-b border-white/10 px-4 py-4">
          <button className="flex w-full items-center gap-3 border border-white/10 bg-white/[.04] px-3 py-2.5 text-left">
            <span className="grid size-7 place-items-center bg-[#18375f] text-[11px] font-bold text-[#b8f34b]">
              {state.workspace.id ? state.workspace.name.slice(0, 2) : "--"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">
                {state.workspace.name}
              </span>
              <span className="text-[10px] text-[#788ba5]">
                {state.workspace.type} · {state.workspace.members} 人
              </span>
            </span>
            <ChevronDown size={14} className="text-[#71829a]" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-5 pb-2 text-[9px] font-bold uppercase tracking-[.22em] text-[#60728c]">
            工作空间
          </p>
          {platform.map(navItem)}
          {isProject && state.project.id && (
            <>
              <div className="mx-4 my-4 border-t border-white/10" />
              <p className="px-5 pb-1 text-[9px] font-bold uppercase tracking-[.22em] text-[#60728c]">
                当前项目
              </p>
              <p className="mb-2 truncate px-5 text-[11px] font-semibold text-[#cdd5df]">
                {state.project.name}
              </p>
              {project.map(navItem)}
            </>
          )}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] text-[#96a6ba]">
            <span className="signal-pulse size-2 rounded-full bg-[#b8f34b]" />
            真实数据模式 · 本地工作区
          </div>
          <button
            onClick={clearLocalData}
            className="flex items-center gap-2 text-[11px] text-[#71829a] hover:text-white"
          >
            <Settings2 size={13} />
            清空本地业务数据
          </button>
        </div>
      </aside>
      {mobileOpen && (
        <button
          aria-label="关闭导航遮罩"
          className="fixed inset-0 z-40 bg-black/40 min-[901px]:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="portal-main ml-[244px] min-h-screen transition-[margin]">
        <header className="glass no-print sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[var(--line)] px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="mobile-nav hidden p-2 text-[var(--muted)]"
              onClick={() => setMobileOpen(true)}
              aria-label="打开导航"
            >
              <Menu size={20} />
            </button>
            <div className="hidden items-center gap-2 text-xs sm:flex">
              <span className="text-[var(--muted)]">
                {state.workspace.name}
              </span>
              <span className="text-[#a9b2bd]">/</span>
              <span className="font-semibold">
                {isProject && state.project.id
                  ? state.project.name
                  : "平台工作区"}
              </span>
              {isProject && state.project.id && (
                <Badge tone="warning">{state.project.stage}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="hidden h-9 w-48 items-center gap-2 border border-[var(--line)] bg-[var(--surface)] px-3 text-xs text-[var(--muted)] lg:flex">
              <Search size={14} />
              搜索项目、资产…<kbd className="ml-auto text-[10px]">⌘K</kbd>
            </button>
            <button
              onClick={() => setDark(!dark)}
              aria-label="切换主题"
              className="grid size-9 place-items-center text-[var(--muted)] hover:bg-black/[.04] dark:hover:bg-white/[.05]"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              aria-label="用户菜单"
              className="ml-1 flex items-center gap-2 border-l border-[var(--line)] pl-3"
            >
              <CircleUserRound
                size={27}
                className="text-[#31577f] dark:text-[#91b8df]"
              />
              <span className="hidden text-left text-xs sm:block">
                <b className="block">当前用户</b>
                <small className="text-[10px] text-[var(--muted)]">
                  Workspace Owner
                </small>
              </span>
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-7 lg:p-8">
          {children}
        </main>
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[100] flex max-w-sm items-center gap-3 border border-[#a6d746] bg-[#10223e] px-4 py-3 text-sm font-semibold text-white shadow-2xl"
        >
          <span className="size-2 bg-[#b8f34b]" />
          {toast}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <ShellContent>{children}</ShellContent>
    </DemoProvider>
  );
}
