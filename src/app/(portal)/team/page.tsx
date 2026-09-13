import Link from "next/link";
import { KeyRound, Monitor } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="animate-rise">
      <PageHeader
        title="使用设置"
        description="管理 AI 连接，了解项目数据的保存方式。"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-6">
          <KeyRound size={22} className="text-[var(--primary)]" />
          <h2 className="mt-4 font-semibold">AI 模型</h2>
          <p className="my-3 text-sm leading-6 text-[var(--muted)]">
            连接 DeepSeek，让岚舟帮助你诊断场景和制定 POC 方案。
          </p>
          <Link href="/settings/ai">
            <Button variant="secondary">配置 AI 模型</Button>
          </Link>
        </section>
        <section className="card p-6">
          <Monitor size={22} className="text-[var(--primary)]" />
          <h2 className="mt-4 font-semibold">本地数据</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            项目和对话自动保存在当前浏览器，刷新后可继续使用。更换浏览器不会自动同步；需要留存
            POC 方案时，可在诊断页导出。
          </p>
        </section>
      </div>
    </div>
  );
}
