"use client";

import { Box, ExternalLink, Plus, Recycle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
} from "@/components/ui";
import { useDemo } from "@/lib/store";
import type { Asset } from "@/lib/types";

const types: Asset["type"][] = [
  "Agent",
  "Skill",
  "Tool",
  "Prompt",
  "Workflow",
  "MCP",
  "Knowledge Base",
  "Dataset",
  "Eval Suite",
  "Report Template",
];

export default function AssetsPage() {
  const { state, addAsset } = useDemo();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    type: Asset["type"];
    version: string;
    permission: string;
  }>({ name: "", type: "Skill", version: "v0.1", permission: "项目成员" });
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="AI ASSET REGISTRY"
        title="AI 资产库"
        description="只登记元数据、版本、权限与评测结果。每项资产都必须能够回答：谁负责、谁可用、在哪个版本被验证。"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus size={14} />
            登记 AI 资产
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {["全部资产", ...types.slice(0, 6)].map((item, index) => (
          <button
            key={item}
            className={`rounded-[var(--radius-sm)] border px-3 py-2 text-xs ${index === 0 ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-ink)]" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
                <th className="p-4">资产</th>
                <th className="p-4">版本 / 负责人</th>
                <th className="p-4">权限</th>
                <th className="p-4">最近评测</th>
                <th className="p-4">状态</th>
                <th className="p-4">团队复用</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {state.assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="group border-b border-[var(--line)] last:border-0"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                        <Box size={16} />
                      </span>
                      <div>
                        <b className="text-xs">{asset.name}</b>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">
                          {asset.type} · 当前项目
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <b className="font-data text-xs">{asset.version}</b>
                    <p className="mt-1 text-[10px] text-[var(--muted)]">
                      {asset.owner}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <ShieldCheck size={13} className="text-[var(--muted)]" />
                      {asset.permission}
                    </span>
                  </td>
                  <td className="p-4">
                    <b className="font-data text-sm">
                      {asset.score ? `${asset.score}%` : "—"}
                    </b>
                  </td>
                  <td className="p-4">
                    <Badge
                      tone={
                        asset.status === "可复用"
                          ? "success"
                          : asset.status === "验证中"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {asset.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {asset.reusable ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--success)]">
                        <Recycle size={13} />
                        允许
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">
                        仅项目
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      aria-label={`打开 ${asset.name}`}
                      className="text-[var(--muted)] opacity-40 transition group-hover:opacity-100"
                    >
                      <ExternalLink size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="登记 AI 资产"
        description="V1 仅记录资产元数据与外部地址，不上传运行代码。"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addAsset(form);
            setOpen(false);
            setForm({
              name: "",
              type: "Skill",
              version: "v0.1",
              permission: "项目成员",
            });
          }}
          className="grid gap-5"
        >
          <Field label="资产名称">
            <Input
              required
              value={form.name}
              onChange={(event) =>
                setForm((old) => ({ ...old, name: event.target.value }))
              }
              placeholder="输入真实资产名称"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="资产类型">
              <Select
                value={form.type}
                onChange={(event) =>
                  setForm((old) => ({
                    ...old,
                    type: event.target.value as Asset["type"],
                  }))
                }
              >
                {types.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </Select>
            </Field>
            <Field label="当前版本">
              <Input
                required
                value={form.version}
                onChange={(event) =>
                  setForm((old) => ({ ...old, version: event.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="所需权限">
            <Input
              required
              value={form.permission}
              onChange={(event) =>
                setForm((old) => ({ ...old, permission: event.target.value }))
              }
            />
          </Field>
          <Field label="外部地址">
            <Input type="url" placeholder="https://（可选）" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!form.name}>
              登记资产
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
