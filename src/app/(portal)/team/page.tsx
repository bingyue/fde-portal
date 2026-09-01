"use client";

import { Building2, Plus, ShieldCheck, UserRoundCog } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  SectionTitle,
} from "@/components/ui";
import { usePortal } from "@/lib/store";
import type { Workspace } from "@/lib/types";

export default function TeamPage() {
  const { state, createWorkspace } = usePortal();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Workspace["type"]>("企业空间");
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="WORKSPACE & ACCESS"
        title="团队设置"
        description="Workspace 负责多租户隔离；系统没有预置成员或角色数据。"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={14} />
            新建 Workspace
          </Button>
        }
      />
      {!state.workspace.id ? (
        <EmptyState
          icon={<Building2 size={20} />}
          title="尚未创建 Workspace"
          description="创建后，当前用户将成为 Workspace Owner。"
          action={<Button onClick={() => setOpen(true)}>创建 Workspace</Button>}
        />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[.6fr_1.4fr]">
          <aside className="card p-5">
            <SectionTitle title="当前 Workspace" />
            <div className="border border-[var(--line)] p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white dark:text-[#071426]">
                  <Building2 size={18} />
                </span>
                <div>
                  <b className="text-xs">{state.workspace.name}</b>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {state.workspace.type}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-px bg-[var(--line)]">
                <div className="bg-[var(--surface)] p-3">
                  <span className="text-[9px] text-[var(--muted)]">成员</span>
                  <b className="font-data block text-lg">
                    {state.workspace.members}
                  </b>
                </div>
                <div className="bg-[var(--surface)] p-3">
                  <span className="text-[9px] text-[var(--muted)]">项目</span>
                  <b className="font-data block text-lg">
                    {state.project.id ? 1 : 0}
                  </b>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] p-3 text-xs leading-5 text-[var(--muted)]">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              生产环境由 Supabase Auth 与 workspace_id RLS 策略隔离。
            </div>
          </aside>
          <section className="card p-5">
            <SectionTitle
              title="成员与角色"
              meta="仅展示真实创建的成员"
              action={
                <Button variant="secondary">
                  <Plus size={13} />
                  邀请成员
                </Button>
              }
            />
            <div className="flex items-center gap-4 border-y border-[var(--line)] py-4">
              <span className="grid size-9 place-items-center bg-[var(--primary-soft)] text-[var(--primary)]">
                <UserRoundCog size={16} />
              </span>
              <div className="flex-1">
                <b className="text-xs">当前用户</b>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  本地 Workspace 创建者
                </p>
              </div>
              <Badge tone="success">Workspace Owner</Badge>
              <Badge tone="success">活跃</Badge>
            </div>
          </section>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="新建 Workspace">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createWorkspace({ name, type });
            setOpen(false);
            setName("");
          }}
          className="grid gap-5"
        >
          <Field label="名称">
            <Input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field label="类型">
            <Select
              value={type}
              onChange={(event) =>
                setType(event.target.value as Workspace["type"])
              }
            >
              <option>团队空间</option>
              <option>企业空间</option>
            </Select>
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={!name}>
              创建 Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
