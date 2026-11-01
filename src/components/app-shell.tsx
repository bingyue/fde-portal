"use client";

import {
  CircleUserRound,
  ChevronRight,
  Menu,
  Search,
  Settings2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { PortalProvider, usePortal } from "@/lib/store";
import { ThemeSelector } from "./theme-provider";
import { Badge } from "./ui";
import { PortalNavigation, portalLocation } from "./portal-navigation";

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, toast, clearLocalData, hydrated } = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!hydrated)
    return (
      <div
        role="status"
        className="grid min-h-screen place-items-center bg-[var(--paper)] text-sm text-[var(--muted)]"
      >
        正在加载项目数据…
      </div>
    );
  const isProject = pathname.startsWith("/project/");
  const pendingReviews = state.reviews.filter(
    (item) => item.status === "待评审",
  ).length;

  const location = portalLocation(pathname);

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <aside
        id="portal-sidebar"
        data-open={mobileOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape") setMobileOpen(false);
        }}
        className="portal-sidebar fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-[var(--line)] bg-[var(--sidebar)] text-[var(--sidebar-ink)] shadow-[4px_0_18px_rgba(15,23,42,0.025)] transition-transform duration-300"
      >
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-[var(--line)] px-5">
          <Link href="/workbench" className="flex items-center gap-3">
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

        <PortalNavigation
          pathname={pathname}
          projectName={
            isProject && state.project.id ? state.project.name : undefined
          }
          pendingReviews={pendingReviews}
          onNavigate={() => setMobileOpen(false)}
        />

        <div className="shrink-0 border-t border-[var(--line)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] text-[var(--sidebar-muted)]">
            <span className="signal-pulse size-2 rounded-full bg-[var(--success)]" />
            项目数据保存在本机浏览器
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
              aria-expanded={mobileOpen}
              aria-controls="portal-sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="hidden min-w-0 items-center gap-2 text-xs sm:flex">
              {location.parent && (
                <>
                  <span className="shrink-0 text-[var(--muted)]">
                    {location.parent}
                  </span>
                  <ChevronRight
                    size={12}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--muted)]"
                  />
                </>
              )}
              <span className="truncate font-semibold text-[var(--ink)]">
                {location.title}
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
                  管理员
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
