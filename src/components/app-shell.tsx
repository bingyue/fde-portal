"use client";

import type { LucideIcon } from "lucide-react";
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
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PortalProvider, usePortal } from "@/lib/store";
import { ThemeSelector } from "./theme-provider";
import { Badge } from "./ui";

type NavItem = readonly [href: string, label: string, Icon: LucideIcon];

const deliveryManagement = [
  ["/dashboard", "我的工作台", Home],
  ["/projects/new", "项目中心", BriefcaseBusiness],
  ["/reviews", "待办与评审", CheckSquare2],
] as const satisfies readonly NavItem[];

const capabilities = [
  ["/templates", "模板中心", Blocks],
  ["/project/assets", "资产中心", Archive],
  ["/skills", "Skill 中心", Workflow],
  ["/settings/ai", "AI 模型配置", KeyRound],
  ["/team", "团队设置", UsersRound],
] as const satisfies readonly NavItem[];

const project = [
  ["/project/overview", "项目总览", Gauge],
  ["/project/scenario", "场景卡", FileText],
  ["/project/poc", "POC 工作台", Activity],
  ["/project/evals", "Eval 中心", ShieldCheck],
  ["/project/assets", "AI 资产库", Sparkles],
  ["/project/reports", "报告与验收", GraduationCap],
] as const satisfies readonly NavItem[];

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, toast, clearLocalData } = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isProject = pathname.startsWith("/project/");
  const pendingReviews = state.reviews.filter(
    (item) => item.status === "待评审",
  ).length;

  const navItem = ([href, label, Icon]: NavItem) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`group mx-3 flex h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-[13px] font-medium transition ${
          active
            ? "bg-[var(--primary-soft)] text-[var(--primary-ink)]"
            : "text-[var(--sidebar-ink)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
        }`}
      >
        <Icon
          size={16}
          className={
            active
              ? "text-[var(--primary)]"
              : "text-[var(--sidebar-muted)] group-hover:text-[var(--primary)]"
          }
        />
        <span className="truncate">{label}</span>
        {label === "待办与评审" && pendingReviews > 0 && (
          <span className="font-data ml-auto rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-bold text-white">
            {pendingReviews}
          </span>
        )}
      </Link>
    );
  };

  const groupLabel = (label: string) => (
    <p className="px-6 pb-2 pt-4 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--sidebar-muted)]">
      {label}
    </p>
  );

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <aside
        className={`portal-sidebar fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[var(--line)] bg-[var(--sidebar)] text-[var(--sidebar-ink)] shadow-[4px_0_18px_rgba(15,23,42,0.025)] transition-transform duration-300 ${mobileOpen ? "!translate-x-0" : ""}`}
      >
        <div className="flex h-[68px] items-center justify-between border-b border-[var(--line)] px-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-[var(--primary)] text-sm font-black text-white shadow-sm">
              F
            </span>
            <span>
              <b className="font-data block text-sm tracking-[.06em] text-[var(--ink)]">
                FDE PORTAL
              </b>
              <small className="block text-[8px] font-bold tracking-[.16em] text-[var(--sidebar-muted)]">
                AI DELIVERY MANAGEMENT
              </small>
            </span>
          </Link>
          <button
            className="hidden rounded-[var(--radius-sm)] p-1.5 text-[var(--muted)] hover:bg-[var(--surface-hover)] max-[900px]:block"
            onClick={() => setMobileOpen(false)}
            aria-label="关闭导航"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-[var(--line)] p-4">
          <button className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-subtle)] px-3 py-2.5 text-left transition hover:border-[var(--primary-border)]">
            <span className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[11px] font-bold text-[var(--primary)]">
              {state.workspace.id ? state.workspace.name.slice(0, 2) : "--"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-[var(--ink)]">
                {state.workspace.name}
              </span>
              <span className="text-[10px] text-[var(--sidebar-muted)]">
                {state.workspace.type} · {state.workspace.members} 人
              </span>
            </span>
            <ChevronDown size={14} className="text-[var(--sidebar-muted)]" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-1">
          {groupLabel("交付管理")}
          {deliveryManagement.map(navItem)}
          {groupLabel("能力与治理")}
          {capabilities.map(navItem)}
          {isProject && state.project.id && (
            <>
              <div className="mx-5 mt-4 border-t border-[var(--line)]" />
              {groupLabel("当前项目")}
              <p className="mb-2 truncate px-6 text-[11px] font-semibold text-[var(--ink)]">
                {state.project.name}
              </p>
              {project.map(navItem)}
            </>
          )}
        </nav>

        <div className="border-t border-[var(--line)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] text-[var(--sidebar-muted)]">
            <span className="signal-pulse size-2 rounded-full bg-[var(--success)]" />
            真实数据模式 · 本地工作区
          </div>
          <button
            onClick={clearLocalData}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] px-1 py-1 text-[11px] text-[var(--sidebar-muted)] hover:text-[var(--danger)]"
          >
            <Settings2 size={13} />
            清空本地业务数据
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          aria-label="关闭导航遮罩"
          className="fixed inset-0 z-40 bg-[#071426]/45 backdrop-blur-[2px] min-[901px]:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="portal-main ml-[248px] min-h-screen transition-[margin]">
        <header className="glass no-print sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[var(--line)] px-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="mobile-nav hidden rounded-[var(--radius-sm)] p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              onClick={() => setMobileOpen(true)}
              aria-label="打开导航"
            >
              <Menu size={20} />
            </button>
            <div className="hidden min-w-0 items-center gap-2 text-xs sm:flex">
              <span className="truncate text-[var(--muted)]">
                {state.workspace.name}
              </span>
              <span className="text-[var(--line-strong)]">/</span>
              <span className="truncate font-semibold text-[var(--ink)]">
                {isProject && state.project.id
                  ? state.project.name
                  : "平台工作区"}
              </span>
              {isProject && state.project.id && (
                <Badge tone="info">{state.project.stage}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="hidden h-9 w-48 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3 text-xs text-[var(--muted)] transition hover:border-[var(--primary-border)] lg:flex">
              <Search size={14} />
              搜索项目、资产…<kbd className="ml-auto text-[10px]">⌘K</kbd>
            </button>
            <ThemeSelector />
            <button
              aria-label="用户菜单"
              className="ml-1 flex items-center gap-2 border-l border-[var(--line)] pl-3"
            >
              <CircleUserRound size={27} className="text-[var(--primary)]" />
              <span className="hidden text-left text-xs sm:block">
                <b className="block text-[var(--ink)]">当前用户</b>
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
          className="fixed bottom-6 right-6 z-[100] flex max-w-sm items-center gap-3 rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-lg)]"
        >
          <span className="size-2 rounded-full bg-[var(--primary)]" />
          {toast}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <ShellContent>{children}</ShellContent>
    </PortalProvider>
  );
}
