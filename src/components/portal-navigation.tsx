"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  Archive,
  Blocks,
  BookOpen,
  BriefcaseBusiness,
  CheckSquare2,
  ChevronDown,
  Compass,
  FileCheck2,
  FilePlus2,
  FileText,
  FlaskConical,
  Gauge,
  Home,
  KeyRound,
  MessagesSquare,
  RadioTower,
  Settings2,
  ShieldCheck,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";

type NavItem = readonly [href: string, label: string, Icon: LucideIcon];
type NavGroup = {
  id: string;
  label: string;
  Icon: LucideIcon;
  items: readonly NavItem[];
};

const workbench = ["/workbench", "FDE 全流程工作台", Workflow] as const;
const learning = ["/learn", "学习中心", BookOpen] as const;
const delivery: NavGroup = {
  id: "delivery",
  label: "项目交付",
  Icon: BriefcaseBusiness,
  items: [
    ["/dashboard", "我的工作台", Home],
    ["/chat", "AI 场景诊断", MessagesSquare],
    ["/projects/new", "创建项目", FilePlus2],
    ["/reviews", "待办与评审", CheckSquare2],
  ],
};
const capabilities: NavGroup = {
  id: "capabilities",
  label: "能力中心",
  Icon: Blocks,
  items: [
    ["/skills", "Skill 中心", Workflow],
    ["/templates", "模板中心", Blocks],
    ["/project/assets", "资产中心", Archive],
  ],
};
const settings: NavGroup = {
  id: "settings",
  label: "系统设置",
  Icon: Settings2,
  items: [
    ["/settings/ai", "AI 模型配置", KeyRound],
    ["/team", "使用设置", UsersRound],
  ],
};
const project: NavGroup = {
  id: "project",
  label: "当前项目",
  Icon: Gauge,
  items: [
    ["/project/overview", "项目总览", Gauge],
    ["/project/discovery", "结果与发现", Compass],
    ["/project/scenario", "场景卡", FileText],
    ["/project/experiments", "假设与实验", FlaskConical],
    ["/project/poc", "证据门禁", Activity],
    ["/project/evals", "Eval 中心", ShieldCheck],
    ["/project/operations", "采纳与运营", RadioTower],
    ["/project/reports", "报告与验收", FileCheck2],
  ],
};

export function portalLocation(pathname: string) {
  for (const group of [delivery, capabilities, project, settings]) {
    const item = group.items.find(([href]) => href === pathname);
    if (item) return { parent: group.label, title: item[1] };
  }
  return {
    parent: "",
    title:
      [workbench, learning].find(([href]) => href === pathname)?.[1] ||
      "FDE Portal",
  };
}

function ReviewCount({ count }: { count: number }) {
  return count > 0 ? (
    <span
      aria-label={`${count} 项待评审`}
      className="font-data ml-auto rounded-full bg-[var(--primary-soft)] px-1.5 text-[10px] font-bold text-[var(--primary-ink)]"
    >
      {count}
    </span>
  ) : null;
}

function NavigationLink({
  item: [href, label, Icon],
  pathname,
  nested = false,
  pendingReviews,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  nested?: boolean;
  pendingReviews: number;
  onNavigate: () => void;
}) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group flex min-h-10 items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-[13px] transition ${nested ? "font-medium" : "font-semibold"} ${active ? "bg-[var(--primary-soft)] text-[var(--primary-ink)]" : "text-[var(--sidebar-ink)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"}`}
    >
      <Icon
        aria-hidden="true"
        size={nested ? 14 : 17}
        className={`shrink-0 ${active ? "text-[var(--primary)]" : "text-[var(--sidebar-muted)] group-hover:text-[var(--primary)]"}`}
      />
      <span className="truncate">{label}</span>
      {href === "/reviews" && <ReviewCount count={pendingReviews} />}
    </Link>
  );
}

function NavigationGroup({
  group,
  pathname,
  pendingReviews,
  onNavigate,
  description,
}: {
  group: NavGroup;
  pathname: string;
  pendingReviews: number;
  onNavigate: () => void;
  description?: string;
}) {
  const active = group.items.some(([href]) => href === pathname);
  const [open, setOpen] = useState(active);
  const Icon = group.Icon;
  const id = `portal-nav-${group.id}`;
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className={`flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 text-left text-[13px] font-semibold transition hover:bg-[var(--surface-hover)] ${active ? "text-[var(--primary-ink)]" : "text-[var(--sidebar-ink)]"}`}
      >
        <Icon
          size={17}
          aria-hidden="true"
          className={`shrink-0 ${active ? "text-[var(--primary)]" : "text-[var(--sidebar-muted)]"}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block">{group.label}</span>
          {description && (
            <span
              title={description}
              className="mt-0.5 block truncate text-[10px] font-normal text-[var(--sidebar-muted)]"
            >
              {description}
            </span>
          )}
        </span>
        {group.id === "delivery" && !open && (
          <ReviewCount count={pendingReviews} />
        )}
        <ChevronDown
          aria-hidden="true"
          size={14}
          className={`shrink-0 text-[var(--sidebar-muted)] transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      <ul
        id={id}
        hidden={!open}
        className="mb-2 ml-5 space-y-0.5 border-l border-[var(--line)] pl-2"
      >
        {group.items.map((item) => (
          <li key={item[0]}>
            <NavigationLink
              item={item}
              pathname={pathname}
              nested
              pendingReviews={pendingReviews}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PortalNavigation({
  pathname,
  projectName,
  pendingReviews,
  onNavigate,
}: {
  pathname: string;
  projectName?: string;
  pendingReviews: number;
  onNavigate: () => void;
}) {
  const props = { pathname, pendingReviews, onNavigate };
  return (
    <nav aria-label="主导航" className="flex-1 overflow-y-auto px-3 py-4">
      <NavigationLink item={workbench} {...props} />
      <div className="my-3 border-t border-[var(--line)]" />
      <NavigationGroup
        key={`delivery-${pathname}`}
        group={delivery}
        {...props}
      />
      {projectName && (
        <NavigationGroup
          key={`project-${pathname}`}
          group={project}
          description={projectName}
          {...props}
        />
      )}
      <NavigationGroup
        key={`capabilities-${pathname}`}
        group={capabilities}
        {...props}
      />
      <div className="my-3 border-y border-[var(--line)] py-2">
        <NavigationLink item={learning} {...props} />
      </div>
      <NavigationGroup
        key={`settings-${pathname}`}
        group={settings}
        {...props}
      />
    </nav>
  );
}
