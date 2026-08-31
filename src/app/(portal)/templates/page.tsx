"use client";

import Link from "next/link";
import { Blocks, Plus } from "lucide-react";
import { Button, EmptyState, PageHeader } from "@/components/ui";

export default function TemplatesPage() {
  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="REUSABLE DELIVERY PATTERNS"
        title="模板中心"
        description="当前版本不内置业务模板，避免将演示内容混入真实项目。"
      />
      <EmptyState
        icon={<Blocks size={20} />}
        title="暂无模板"
        description="完成并验收真实项目后，可在后续版本将其结构沉淀为组织模板。"
        action={
          <Link href="/projects/new">
            <Button>
              <Plus size={14} />
              创建空白项目
            </Button>
          </Link>
        }
      />
    </div>
  );
}
