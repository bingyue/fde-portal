"use client";

import {
  Activity,
  ArrowRight,
  Check,
  CircleDollarSign,
  Gauge,
  RotateCcw,
  Save,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  Progress,
  Select,
  SectionTitle,
} from "@/components/ui";
import {
  calculateAdoptionRate,
  calculateChecklistProgress,
  calculateRoi,
} from "@/lib/metrics";
import { usePortal } from "@/lib/store";
import type { AdoptionPlan, ProductionProfile } from "@/lib/types";

const automationLevels: ProductionProfile["automationLevel"][] = [
  "AI建议",
  "人工确认",
  "异常确认",
  "自动执行",
];

export default function OperationsPage() {
  const {
    state,
    updateAdoptionPlan,
    toggleAdoptionItem,
    updateProductionProfile,
    toggleProductionItem,
  } = usePortal();
  const [adoption, setAdoption] = useState<Omit<AdoptionPlan, "items">>({
    champion: state.adoptionPlan.champion,
    targetUsers: state.adoptionPlan.targetUsers,
    activeUsers: state.adoptionPlan.activeUsers,
  });
  const [production, setProduction] = useState<
    Omit<ProductionProfile, "items">
  >({
    automationLevel: state.productionProfile.automationLevel,
    availabilityTarget: state.productionProfile.availabilityTarget,
    taskCostBudget: state.productionProfile.taskCostBudget,
    rollbackOwner: state.productionProfile.rollbackOwner,
  });

  const adoptionRate = calculateAdoptionRate(
    state.adoptionPlan.activeUsers,
    state.adoptionPlan.targetUsers,
  );
  const adoptionProgress = calculateChecklistProgress(
    state.adoptionPlan.items.filter((item) => item.completed).length,
    state.adoptionPlan.items.length,
  );
  const productionProgress = calculateChecklistProgress(
    state.productionProfile.items.filter((item) => item.completed).length,
    state.productionProfile.items.length,
  );
  const roi = calculateRoi(
    state.outcomeContract.annualValue,
    state.outcomeContract.annualCost,
  );

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="ADOPTION & PRODUCTION OPERATING MODEL"
        title="采纳与生产运营"
        description="技术上线与组织改变同步推进。业务流程真正依赖系统，并且系统可观测、可接管、可回滚，才算进入生产。"
      />

      <section className="mb-6 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["真实采用率", `${adoptionRate}%`, UsersRound, "活跃用户 / 目标用户"],
          ["组织就绪", `${adoptionProgress}%`, UserCheck, "SOP、培训与强化"],
          ["生产就绪", `${productionProgress}%`, ShieldCheck, "治理检查清单"],
          [
            "预期 ROI",
            state.outcomeContract.annualCost ? `${roi}%` : "—",
            CircleDollarSign,
            "来自结果契约",
          ],
        ].map(([label, value, Icon, hint]) => (
          <div key={String(label)} className="bg-[var(--surface)] p-5">
            <div className="mb-4 flex items-center justify-between text-[var(--muted)]">
              <span className="text-[10px] font-bold uppercase tracking-[.12em]">
                {String(label)}
              </span>
              <Icon size={16} className="text-[var(--primary)]" />
            </div>
            <b className="font-data text-2xl">{String(value)}</b>
            <p className="mb-3 mt-1 text-[10px] text-[var(--muted)]">
              {String(hint)}
            </p>
            <Progress
              value={
                label === "真实采用率"
                  ? adoptionRate
                  : label === "组织就绪"
                    ? adoptionProgress
                    : label === "生产就绪"
                      ? productionProgress
                      : Math.min(100, Math.max(0, roi))
              }
            />
          </div>
        ))}
      </section>

      <section className="mb-6 card p-5 sm:p-6">
        <SectionTitle
          title="自动化权限阶梯"
          meta="只有真实证据持续稳定，才逐步扩大 AI 的执行权限"
        />
        <div className="grid gap-2 md:grid-cols-4">
          {automationLevels.map((level, index) => {
            const active = level === state.productionProfile.automationLevel;
            const passed =
              automationLevels.indexOf(
                state.productionProfile.automationLevel,
              ) >= index;
            return (
              <button
                key={level}
                onClick={() => {
                  setProduction((old) => ({
                    ...old,
                    automationLevel: level,
                  }));
                  updateProductionProfile({ automationLevel: level });
                }}
                className={`relative rounded-[var(--radius-md)] border p-4 text-left transition ${active ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary-border)]"}`}
              >
                <div className="mb-8 flex items-center justify-between">
                  <span
                    className={`font-data grid size-7 place-items-center rounded-[var(--radius-sm)] text-[10px] font-black ${passed ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-hover)] text-[var(--muted)]"}`}
                  >
                    {index + 1}
                  </span>
                  {index < automationLevels.length - 1 && (
                    <ArrowRight
                      size={14}
                      className="text-[var(--line-strong)] max-md:hidden"
                    />
                  )}
                </div>
                <b className="text-sm">{level}</b>
                <p className="mt-1 text-[10px] leading-4 text-[var(--muted)]">
                  {
                    [
                      "AI 只给建议，人负责全部动作",
                      "关键动作逐次由人确认",
                      "仅异常情况升级人工",
                      "系统执行，人进行抽检治理",
                    ][index]
                  }
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <form
            className="border-b border-[var(--line)] p-5 sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              updateAdoptionPlan(adoption);
            }}
          >
            <SectionTitle
              title="组织采纳工作流"
              meta="登录过不叫采用，真实业务流程依赖它才叫采用"
              action={
                <Button type="submit" variant="secondary">
                  <Save size={14} /> 保存
                </Button>
              }
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Champion 用户">
                <Input
                  aria-label="Champion 用户"
                  value={adoption.champion}
                  onChange={(event) =>
                    setAdoption((old) => ({
                      ...old,
                      champion: event.target.value,
                    }))
                  }
                  placeholder="一线推动者"
                />
              </Field>
              <Field label="目标用户数">
                <Input
                  aria-label="目标用户数"
                  type="number"
                  min="0"
                  value={adoption.targetUsers || ""}
                  onChange={(event) =>
                    setAdoption((old) => ({
                      ...old,
                      targetUsers: Number(event.target.value),
                    }))
                  }
                />
              </Field>
              <Field label="稳定活跃用户数">
                <Input
                  aria-label="稳定活跃用户数"
                  type="number"
                  min="0"
                  value={adoption.activeUsers || ""}
                  onChange={(event) =>
                    setAdoption((old) => ({
                      ...old,
                      activeUsers: Number(event.target.value),
                    }))
                  }
                />
              </Field>
            </div>
          </form>
          <div className="p-5 sm:p-6">
            {state.adoptionPlan.items.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.completed}
                onClick={() => toggleAdoptionItem(item.id)}
                className="flex w-full items-center gap-3 border-t border-[var(--line)] py-3.5 text-left first:border-t-0"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-[var(--radius-sm)] border ${item.completed ? "border-[var(--success)] bg-[var(--success)] text-white" : "border-[var(--line-strong)]"}`}
                >
                  {item.completed && <Check size={13} />}
                </span>
                <span className="flex-1 text-xs font-semibold">
                  {item.title}
                </span>
                <span className="text-[10px] text-[var(--muted)]">
                  {item.owner}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="card overflow-hidden">
          <form
            className="border-b border-[var(--line)] p-5 sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              updateProductionProfile(production);
            }}
          >
            <SectionTitle
              title="生产运行边界"
              meta="没有可观测、可接管、可回滚，就不进入生产"
              action={
                <Button type="submit" variant="secondary">
                  <Save size={14} /> 保存
                </Button>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="可用性目标 SLO">
                <Input
                  aria-label="可用性目标 SLO"
                  value={production.availabilityTarget}
                  onChange={(event) =>
                    setProduction((old) => ({
                      ...old,
                      availabilityTarget: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="单任务成本预算">
                <Input
                  aria-label="单任务成本预算"
                  type="number"
                  min="0"
                  step="0.01"
                  value={production.taskCostBudget || ""}
                  onChange={(event) =>
                    setProduction((old) => ({
                      ...old,
                      taskCostBudget: Number(event.target.value),
                    }))
                  }
                  placeholder="例如：0.50"
                />
              </Field>
              <Field label="当前自动化等级">
                <Select
                  aria-label="当前自动化等级"
                  value={production.automationLevel}
                  onChange={(event) =>
                    setProduction((old) => ({
                      ...old,
                      automationLevel: event.target
                        .value as ProductionProfile["automationLevel"],
                    }))
                  }
                >
                  {automationLevels.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="回滚责任人">
                <Input
                  aria-label="回滚责任人"
                  value={production.rollbackOwner}
                  onChange={(event) =>
                    setProduction((old) => ({
                      ...old,
                      rollbackOwner: event.target.value,
                    }))
                  }
                  placeholder="生产事故时谁做决定"
                />
              </Field>
            </div>
          </form>
          <div className="p-5 sm:p-6">
            {state.productionProfile.items.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.completed}
                onClick={() => toggleProductionItem(item.id)}
                className="flex w-full items-center gap-3 border-t border-[var(--line)] py-3.5 text-left first:border-t-0"
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-[var(--radius-sm)] border ${item.completed ? "border-[var(--success)] bg-[var(--success)] text-white" : "border-[var(--line-strong)]"}`}
                >
                  {item.completed && <Check size={13} />}
                </span>
                <span className="flex-1 text-xs font-semibold">
                  {item.title}
                </span>
                <span className="text-[10px] text-[var(--muted)]">
                  {item.owner}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--surface)] text-[var(--primary)]">
              {productionProgress === 100 ? (
                <ShieldCheck size={19} />
              ) : (
                <RotateCcw size={19} />
              )}
            </span>
            <div>
              <b className="text-sm">
                {productionProgress === 100
                  ? "生产门禁已满足"
                  : "生产决策仍有未闭环项"}
              </b>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                当前采用率 {adoptionRate}%，生产就绪 {productionProgress}
                %。系统建议在真实用户与回滚演练都有证据后再扩大自动化权限。
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge tone="info">
              <Gauge size={12} /> SLO{" "}
              {state.productionProfile.availabilityTarget}
            </Badge>
            <Badge tone="neutral">
              <Activity size={12} /> {state.productionProfile.automationLevel}
            </Badge>
          </div>
        </div>
      </section>
    </div>
  );
}
