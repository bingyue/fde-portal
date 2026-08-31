"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileKey2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  SectionTitle,
} from "@/components/ui";

interface AIStatus {
  configured: boolean;
  source: "environment" | "local-file" | "none";
  baseUrl: string;
  model: string;
}
const defaultStatus: AIStatus = {
  configured: false,
  source: "none",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-v4-flash",
};

export default function AISettingsPage() {
  const [status, setStatus] = useState<AIStatus>(defaultStatus);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(defaultStatus.baseUrl);
  const [model, setModel] = useState(defaultStatus.model);
  const [keyFileName, setKeyFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/config", { cache: "no-store" });
      const data = (await response.json()) as AIStatus;
      setStatus(data);
      setBaseUrl(data.baseUrl);
      setModel(data.model);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => void loadStatus());
  }, [loadStatus]);

  const readKeyFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 16_384) {
      setMessage({ tone: "error", text: "密钥文件不能大于 16 KB。" });
      return;
    }
    const text = await file.text();
    const envMatch = text.match(
      /(?:^|\n)\s*DEEPSEEK_API_KEY\s*=\s*["']?([^\s"'\r\n]+)["']?/,
    );
    const extracted = (envMatch?.[1] || text.trim()).trim();
    if (!extracted || extracted.includes("\n") || extracted.length < 16) {
      setMessage({
        tone: "error",
        text: "未在文件中找到有效的 DEEPSEEK_API_KEY。",
      });
      return;
    }
    setApiKey(extracted);
    setKeyFileName(file.name);
    setMessage({
      tone: "success",
      text: "已在浏览器本地读取密钥文件，尚未发送或保存。",
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, baseUrl, model }),
      });
      const data = (await response.json()) as AIStatus & { error?: string };
      if (!response.ok) throw new Error(data.error || "连接验证失败");
      setApiKey("");
      setKeyFileName("");
      setStatus(data);
      setMessage({
        tone: "success",
        text: `DeepSeek 连接成功，${model} 已启用。`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "连接验证失败",
      });
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    const response = await fetch("/api/ai/config", { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage({ tone: "error", text: data.error || "无法移除配置" });
      return;
    }
    setStatus(defaultStatus);
    setMessage({ tone: "success", text: "本地 DeepSeek 配置已移除。" });
  };

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="SERVER-SIDE AI CONFIGURATION"
        title="AI 模型配置"
        description="配置真实 DeepSeek API。密钥只保存在本机服务端，不进入浏览器存储、页面状态快照或 Git。"
        actions={
          <Button variant="secondary" onClick={loadStatus} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            刷新状态
          </Button>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[.75fr_1.25fr]">
        <aside className="space-y-6">
          <section className="card p-5">
            <SectionTitle title="当前连接" />
            <div className="flex items-center gap-4">
              <span
                className={`grid size-11 place-items-center ${status.configured ? "bg-[#e5f6ef] text-[#087d5d] dark:bg-[#103529]" : "bg-[#fff0dd] text-[#bd6414] dark:bg-[#3a2815]"}`}
              >
                {loading ? (
                  <LoaderCircle size={20} className="animate-spin" />
                ) : status.configured ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertTriangle size={20} />
                )}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <b>{status.configured ? "已连接 DeepSeek" : "尚未配置"}</b>
                  <Badge tone={status.configured ? "success" : "warning"}>
                    {status.configured ? "LIVE" : "OFFLINE"}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted)]">
                  {status.model}
                </p>
              </div>
            </div>
            {status.configured && (
              <dl className="mt-5 border-t border-[var(--line)] pt-4 text-xs">
                <div className="flex justify-between py-2">
                  <dt className="text-[var(--muted)]">配置来源</dt>
                  <dd>
                    {status.source === "environment"
                      ? "运行环境变量"
                      : "本地安全文件"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-[var(--muted)]">Base URL</dt>
                  <dd className="truncate">{status.baseUrl}</dd>
                </div>
                <Button
                  variant="danger"
                  className="mt-4 w-full"
                  onClick={disconnect}
                >
                  <Trash2 size={13} />
                  移除本地配置
                </Button>
              </dl>
            )}
          </section>
          <section className="border border-[#b5ce7d] bg-[#f2f8e7] p-5 dark:border-[#486824] dark:bg-[#172b18]">
            <div className="flex items-center gap-2 text-[#527411] dark:text-[#b8f34b]">
              <ShieldCheck size={16} />
              <b className="text-xs">密钥安全边界</b>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--muted)]">
              <li>· 浏览器不保存 API Key</li>
              <li>· 服务端文件权限为 0600</li>
              <li>· `.data/` 已加入 Git 忽略</li>
              <li>· 接口响应永不返回密钥</li>
            </ul>
          </section>
        </aside>
        <section className="card p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-[var(--line)] pb-5">
            <span className="grid size-10 place-items-center bg-[#0c1e3a] text-[#b8f34b]">
              <KeyRound size={18} />
            </span>
            <div>
              <h2 className="font-bold">DeepSeek OpenAI-Compatible API</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                保存前将调用 `/models` 验证密钥、余额状态和模型可用性。
              </p>
            </div>
          </div>
          <div className="grid gap-5">
            <Field
              label="API Key"
              hint="可直接填入；输入内容不会被浏览器持久化。"
            >
              <Input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(event) => {
                  setApiKey(event.target.value);
                  setKeyFileName("");
                }}
                placeholder={
                  status.configured ? "输入新密钥以替换当前配置" : "sk-…"
                }
              />
            </Field>
            <div className="relative border border-dashed border-[#9ba7b5] bg-[#f7f9fa] p-5 text-center dark:bg-[#101f31]">
              <input
                type="file"
                accept=".env,.txt,text/plain"
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="选择 DeepSeek 密钥文件"
                onChange={(event) => void readKeyFile(event.target.files?.[0])}
              />
              <div className="pointer-events-none">
                <span className="mx-auto grid size-9 place-items-center bg-[#e8eef3] text-[#315d88] dark:bg-[#182b40]">
                  <Upload size={16} />
                </span>
                <b className="mt-3 block text-xs">或选择密钥文件</b>
                <p className="mt-1 text-[10px] text-[var(--muted)]">
                  支持纯密钥文本，或包含 DEEPSEEK_API_KEY=… 的 .env / .txt
                </p>
                {keyFileName && (
                  <Badge tone="success" className="mt-3">
                    <FileKey2 size={11} />
                    {keyFileName}
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Base URL">
                <Input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                />
              </Field>
              <Field label="模型">
                <Select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                >
                  <option value="deepseek-v4-flash">deepseek-v4-flash</option>
                  <option value="deepseek-v4-pro">deepseek-v4-pro</option>
                </Select>
              </Field>
            </div>
            {message && (
              <div
                role="status"
                className={`flex items-start gap-3 border p-3 text-xs leading-5 ${message.tone === "success" ? "border-[#9dca7f] bg-[#f1f8e9] text-[#3f6913] dark:bg-[#172b18] dark:text-[#b8f34b]" : "border-[#e0a19d] bg-[#fff2f0] text-[#a73732] dark:bg-[#351f20] dark:text-[#f09a95]"}`}
              >
                {message.tone === "success" ? (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                )}
                {message.text}
              </div>
            )}
            <div className="flex flex-col justify-between gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center">
              <a
                href="https://api-docs.deepseek.com/api/list-models/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              >
                DeepSeek 官方 API 文档 <ExternalLink size={12} />
              </a>
              <Button
                onClick={save}
                disabled={saving || apiKey.trim().length < 16}
              >
                {saving ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin" />
                    正在验证连接
                  </>
                ) : (
                  <>
                    <LockKeyhole size={14} />
                    验证并安全保存
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
