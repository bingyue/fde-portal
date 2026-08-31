"use client";

import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { useDemo } from "@/lib/store";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useDemo();
  if (!state.project.id)
    return (
      <div className="animate-rise">
        <PageHeader
          eyebrow="PROJECT REQUIRED"
          title="尚未创建项目"
          description="当前 Workspace 没有预置项目或样例数据。请先创建一个真实业务项目。"
        />
        <EmptyState
          icon={<BriefcaseBusiness size={20} />}
          title="项目空间为空"
          description="创建项目后即可使用场景卡、POC、Eval、资产和报告。"
          action={
            <Link href="/projects/new">
              <Button>创建项目</Button>
            </Link>
          }
        />
      </div>
    );
  return children;
}
