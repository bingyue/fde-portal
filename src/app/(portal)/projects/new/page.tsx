"use client";

import { ArrowRight, Building2, FilePlus2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { usePortal } from "@/lib/store";
import type { Project } from "@/lib/types";

export default function NewProjectPage() {
  const { createProject, state } = usePortal();
  const router = useRouter();
  const [type, setType] = useState<Project["type"]>("企业POC");
  const [form, setForm] = useState({
    name: "",
    industry: "",
    organization: "",
    goal: "",
    owner: "",
    businessOwner: "",
  });
  const update = (key: keyof typeof form, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));
  if (!state.workspace.id)
    return (
      <div className="animate-rise">
        <PageHeader
          eyebrow="WORKSPACE REQUIRED"
          title="先创建 Workspace"
          description="项目必须属于一个真实 Workspace。"
        />
        <EmptyState
          icon={<Building2 size={20} />}
          title="没有 Workspace"
          description="返回入口页完成创建后再继续。"
          action={<Button onClick={() => router.push("/")}>返回入口</Button>}
        />
      </div>
    );
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="CREATE PROJECT"
        title="创建 AI 项目"
        description="页面没有预填业务样例；所有字段都由你真实录入。"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          createProject({
            ...form,
            type,
            stage: "P0 场景立项",
            status: "进行中",
          });
          router.push("/project/scenario");
        }}
        className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]"
      >
        <aside className="card h-fit p-5">
          <h2 className="mb-4 font-bold">01 · 选择项目类型</h2>
          <div className="grid gap-2">
            {[
              ["企业POC", Building2, "真实企业场景，业务负责人参与验收"],
              ["内部AI创新项目", Sparkles, "团队内部效率和能力验证"],
            ].map(([item, Icon, desc]) => (
              <button
                type="button"
                key={String(item)}
                onClick={() => setType(item as Project["type"])}
                className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-left transition ${type === item ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}
              >
                <Icon
                  size={18}
                  className={
                    type === item
                      ? "text-[var(--primary)]"
                      : "text-[var(--muted)]"
                  }
                />
                <span>
                  <b className="block text-xs">{String(item)}</b>
                  <small className="mt-1 block text-[10px] leading-4 text-[var(--muted)]">
                    {String(desc)}
                  </small>
                </span>
              </button>
            ))}
          </div>
          <h2 className="mb-4 mt-7 font-bold">02 · 创建方式</h2>
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-3 text-xs text-[var(--primary-ink)]">
            <FilePlus2 size={16} />
            空白项目
          </div>
        </aside>
        <section className="card p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between border-b border-[var(--line)] pb-5">
            <div>
              <h2 className="font-bold">03 · 项目信息</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                当前 Workspace：{state.workspace.name}
              </p>
            </div>
            <span className="font-data text-[10px] font-bold text-[var(--primary)]">
              空白项目
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="项目名称" className="sm:col-span-2">
              <Input
                required
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="输入真实项目名称"
              />
            </Field>
            <Field label="所属行业">
              <Select
                required
                value={form.industry}
                onChange={(event) => update("industry", event.target.value)}
              >
                <option value="">请选择行业</option>
                <option>零售电商</option>
                <option>金融服务</option>
                <option>制造业</option>
                <option>企业服务</option>
                <option>教育培训</option>
                <option>其他</option>
              </Select>
            </Field>
            <Field label="企业或部门">
              <Input
                required
                value={form.organization}
                onChange={(event) => update("organization", event.target.value)}
                placeholder="输入企业或部门"
              />
            </Field>
            <Field label="项目负责人">
              <Input
                required
                value={form.owner}
                onChange={(event) => update("owner", event.target.value)}
              />
            </Field>
            <Field label="业务负责人">
              <Input
                required
                value={form.businessOwner}
                onChange={(event) =>
                  update("businessOwner", event.target.value)
                }
              />
            </Field>
            <Field
              label="项目目标"
              hint="建议包含当前基线和目标值"
              className="sm:col-span-2"
            >
              <Textarea
                required
                value={form.goal}
                onChange={(event) => update("goal", event.target.value)}
                placeholder="描述真实业务目标、当前基线和期望结果"
              />
            </Field>
            <Field label="计划开始">
              <Input type="date" />
            </Field>
            <Field label="计划结束">
              <Input type="date" />
            </Field>
          </div>
          <div className="mt-7 flex justify-end gap-2 border-t border-[var(--line)] pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/dashboard")}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={
                !form.name ||
                !form.industry ||
                !form.organization ||
                !form.goal ||
                !form.owner ||
                !form.businessOwner
              }
            >
              创建并填写场景卡 <ArrowRight size={15} />
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
