"use client";

import {
  ArrowDown,
  CheckCircle2,
  CircleDollarSign,
  GitBranch,
  Network,
  Plus,
  Target,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import { calculateRoi } from "@/lib/metrics";
import { usePortal } from "@/lib/store";
import type { OutcomeContract, Stakeholder, WorkflowStep } from "@/lib/types";

const stakeholderLevels: Stakeholder["level"][] = [
  "战略层",
  "运营层",
  "执行层",
];

const workflowModes: WorkflowStep["mode"][] = [
  "人工处理",
  "AI建议",
  "人工确认",
  "自动执行",
];

export default function DiscoveryPage() {
  const { state, updateOutcomeContract, addStakeholder, addWorkflowStep } =
    usePortal();
  const [contract, setContract] = useState<OutcomeContract>(
    state.outcomeContract,
  );
  const [stakeholderOpen, setStakeholderOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [stakeholder, setStakeholder] = useState<Omit<Stakeholder, "id">>({
    name: "",
    role: "",
    level: "运营层",
    stance: "中立",
  });
  const [step, setStep] = useState<Omit<WorkflowStep, "id">>({
    name: "",
    owner: "",
    mode: "人工处理",
    system: "",
    outcome: "",
  });

  const roi = calculateRoi(contract.annualValue, contract.annualCost);
  const contractComplete = useMemo(
    () =>
      [
        contract.sponsor,
        contract.metricName,
        contract.baselineValue,
        contract.targetValue,
        contract.valueFormula,
        contract.successCondition,
        contract.stopCondition,
      ].every((value) => String(value).trim()),
    [contract],
  );

  const setContractField = <K extends keyof OutcomeContract>(
    key: K,
    value: OutcomeContract[K],
  ) => setContract((old) => ({ ...old, [key]: value }));

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="OUTCOME & FIELD DISCOVERY"
        title="结果与现场发现"
        description="先锁定业务结果，再还原真实工作。这里管理结果契约、干系人关系和端到端英雄工作流。"
        actions={
          <Badge
            tone={
              state.outcomeContract.status === "已确认" ? "success" : "warning"
            }
            className="px-3 py-2"
          >
            {state.outcomeContract.status === "已确认"
              ? "结果契约已确认"
              : "等待结果契约"}
          </Badge>
        }
      />

      <section className="mb-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--primary-border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <div className="grid gap-px bg-[var(--line)] md:grid-cols-4">
          {[
            ["北极星指标", contract.metricName || "待定义", Target],
            [
              "基线 → 目标",
              contract.baselineValue && contract.targetValue
                ? `${contract.baselineValue} → ${contract.targetValue} ${contract.unit}`
                : "待量化",
              GitBranch,
            ],
            [
              "年度净价值",
              contract.annualValue
                ? `¥${Math.max(0, contract.annualValue - contract.annualCost).toLocaleString()}`
                : "待测算",
              CircleDollarSign,
            ],
            ["预期 ROI", contract.annualCost ? `${roi}%` : "待测算", Network],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="bg-[var(--surface)] p-5">
              <div className="mb-5 flex items-center justify-between text-[var(--muted)]">
                <span className="text-[10px] font-bold uppercase tracking-[.12em]">
                  {String(label)}
                </span>
                <Icon size={16} className="text-[var(--primary)]" />
              </div>
              <b className="font-data text-lg">{String(value)}</b>
            </div>
          ))}
        </div>
        <form
          className="grid gap-5 border-t border-[var(--line)] p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            updateOutcomeContract(contract, true);
          }}
        >
          <SectionTitle
            title="Outcome Contract · 结果契约"
            meta="没有基线，不启动项目；没有停止条件，不扩大投入"
            action={
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => updateOutcomeContract(contract)}
                >
                  保存草稿
                </Button>
                <Button type="submit" disabled={!contractComplete}>
                  <CheckCircle2 size={14} />
                  确认契约
                </Button>
              </div>
            }
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="业务 Sponsor">
              <Input
                aria-label="业务 Sponsor"
                value={contract.sponsor}
                onChange={(event) =>
                  setContractField("sponsor", event.target.value)
                }
                placeholder="对最终结果负责的人"
              />
            </Field>
            <Field label="北极星业务指标">
              <Input
                aria-label="北极星业务指标"
                value={contract.metricName}
                onChange={(event) =>
                  setContractField("metricName", event.target.value)
                }
                placeholder="例如：平均处理周期"
              />
            </Field>
            <Field label="当前基线">
              <Input
                aria-label="当前基线"
                value={contract.baselineValue}
                onChange={(event) =>
                  setContractField("baselineValue", event.target.value)
                }
                placeholder="8"
              />
            </Field>
            <Field label="目标值">
              <div className="grid grid-cols-[1fr_88px] gap-2">
                <Input
                  aria-label="目标值"
                  value={contract.targetValue}
                  onChange={(event) =>
                    setContractField("targetValue", event.target.value)
                  }
                  placeholder="2"
                />
                <Input
                  aria-label="指标单位"
                  value={contract.unit}
                  onChange={(event) =>
                    setContractField("unit", event.target.value)
                  }
                  placeholder="分钟"
                />
              </div>
            </Field>
            <Field label="年度业务价值">
              <Input
                aria-label="年度业务价值"
                type="number"
                min="0"
                value={contract.annualValue || ""}
                onChange={(event) =>
                  setContractField("annualValue", Number(event.target.value))
                }
                placeholder="300000"
              />
            </Field>
            <Field label="年度总成本">
              <Input
                aria-label="年度总成本"
                type="number"
                min="0"
                value={contract.annualCost || ""}
                onChange={(event) =>
                  setContractField("annualCost", Number(event.target.value))
                }
                placeholder="100000"
              />
            </Field>
            <Field label="风险等级">
              <Select
                aria-label="风险等级"
                value={contract.riskLevel}
                onChange={(event) =>
                  setContractField(
                    "riskLevel",
                    event.target.value as OutcomeContract["riskLevel"],
                  )
                }
              >
                <option>低</option>
                <option>中</option>
                <option>高</option>
              </Select>
            </Field>
            <Field label="价值计算方式">
              <Input
                aria-label="价值计算方式"
                value={contract.valueFormula}
                onChange={(event) =>
                  setContractField("valueFormula", event.target.value)
                }
                placeholder="节省工时 × 人力成本 × 业务量"
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="成功条件">
              <Textarea
                aria-label="成功条件"
                value={contract.successCondition}
                onChange={(event) =>
                  setContractField("successCondition", event.target.value)
                }
                placeholder="什么真实业务结果出现后，项目才算成功？"
              />
            </Field>
            <Field label="停止条件">
              <Textarea
                aria-label="停止条件"
                value={contract.stopCondition}
                onChange={(event) =>
                  setContractField("stopCondition", event.target.value)
                }
                placeholder="什么证据出现时，应该停止或重设方向？"
              />
            </Field>
          </div>
        </form>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <section className="card p-5 sm:p-6">
          <SectionTitle
            title="干系人关系图"
            meta="战略、运营、执行三层分开识别"
            action={
              <Button
                variant="secondary"
                onClick={() => setStakeholderOpen(true)}
              >
                <Plus size={14} /> 添加
              </Button>
            }
          />
          <div className="space-y-3">
            {stakeholderLevels.map((level) => {
              const people = state.stakeholders.filter(
                (item) => item.level === level,
              );
              return (
                <div
                  key={level}
                  className="rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface-subtle)] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <b className="text-xs">{level}</b>
                    <span className="font-data text-[10px] text-[var(--muted)]">
                      {people.length} 人
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {people.map((person) => (
                      <div
                        key={person.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full ${person.stance === "推动" ? "bg-[var(--success)]" : person.stance === "阻碍" ? "bg-[var(--danger)]" : "bg-[var(--warning)]"}`}
                          />
                          <b className="text-xs">{person.name}</b>
                        </div>
                        <p className="mt-1 text-[10px] text-[var(--muted)]">
                          {person.role} · {person.stance}
                        </p>
                      </div>
                    ))}
                    {!people.length && (
                      <span className="text-xs text-[var(--muted)]">
                        尚未识别
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <SectionTitle
            title="Hero Workflow · 最小英雄工作流"
            meta="窄而深地跑通真实业务闭环"
            action={
              <Button variant="secondary" onClick={() => setWorkflowOpen(true)}>
                <Plus size={14} /> 添加节点
              </Button>
            }
          />
          <div className="space-y-2">
            {state.workflowSteps.map((item, index) => (
              <div key={item.id}>
                <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-[36px_1fr_auto] sm:items-center">
                  <span className="font-data grid size-9 place-items-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-xs font-black text-[var(--primary)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm">{item.name}</b>
                      <Badge
                        tone={
                          item.mode === "自动执行"
                            ? "success"
                            : item.mode === "人工确认"
                              ? "warning"
                              : item.mode === "AI建议"
                                ? "info"
                                : "neutral"
                        }
                      >
                        {item.mode}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {item.owner || "待分配"} · {item.system || "线下流程"}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {item.outcome || "结果待定义"}
                  </span>
                </div>
                {index < state.workflowSteps.length - 1 && (
                  <ArrowDown
                    size={14}
                    className="mx-auto my-1 text-[var(--primary)]"
                  />
                )}
              </div>
            ))}
            {!state.workflowSteps.length && (
              <div className="grid min-h-72 place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--line-strong)] bg-[var(--surface-subtle)] p-8 text-center">
                <div>
                  <Network
                    size={28}
                    className="mx-auto text-[var(--primary)]"
                  />
                  <b className="mt-4 block">尚未建立业务闭环</b>
                  <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">
                    从感知信息开始，补齐判断、确认、执行、结果和反馈节点。
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={stakeholderOpen}
        onClose={() => setStakeholderOpen(false)}
        title="添加干系人"
        description="同时记录决策层级与当前态度，尽早暴露组织阻力。"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            addStakeholder(stakeholder);
            setStakeholderOpen(false);
            setStakeholder({
              name: "",
              role: "",
              level: "运营层",
              stance: "中立",
            });
          }}
        >
          <Field label="姓名">
            <Input
              required
              aria-label="干系人姓名"
              value={stakeholder.name}
              onChange={(event) =>
                setStakeholder((old) => ({ ...old, name: event.target.value }))
              }
            />
          </Field>
          <Field label="业务角色">
            <Input
              required
              aria-label="业务角色"
              value={stakeholder.role}
              onChange={(event) =>
                setStakeholder((old) => ({ ...old, role: event.target.value }))
              }
              placeholder="例如：客服运营负责人"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="决策层级">
              <Select
                value={stakeholder.level}
                onChange={(event) =>
                  setStakeholder((old) => ({
                    ...old,
                    level: event.target.value as Stakeholder["level"],
                  }))
                }
              >
                {stakeholderLevels.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
            <Field label="当前态度">
              <Select
                value={stakeholder.stance}
                onChange={(event) =>
                  setStakeholder((old) => ({
                    ...old,
                    stance: event.target.value as Stakeholder["stance"],
                  }))
                }
              >
                <option>推动</option>
                <option>中立</option>
                <option>阻碍</option>
              </Select>
            </Field>
          </div>
          <Button
            type="submit"
            disabled={!stakeholder.name || !stakeholder.role}
          >
            <UsersRound size={14} /> 加入关系图
          </Button>
        </form>
      </Modal>

      <Modal
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        title="添加业务闭环节点"
        description="描述真实动作、执行主体、系统和可观察结果。"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            addWorkflowStep(step);
            setWorkflowOpen(false);
            setStep({
              name: "",
              owner: "",
              mode: "人工处理",
              system: "",
              outcome: "",
            });
          }}
        >
          <Field label="节点名称">
            <Input
              required
              aria-label="工作流节点名称"
              value={step.name}
              onChange={(event) =>
                setStep((old) => ({ ...old, name: event.target.value }))
              }
              placeholder="例如：识别客户意图"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="执行主体">
              <Input
                value={step.owner}
                onChange={(event) =>
                  setStep((old) => ({ ...old, owner: event.target.value }))
                }
                placeholder="AI / 客服 / 系统"
              />
            </Field>
            <Field label="人机模式">
              <Select
                value={step.mode}
                onChange={(event) =>
                  setStep((old) => ({
                    ...old,
                    mode: event.target.value as WorkflowStep["mode"],
                  }))
                }
              >
                {workflowModes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="所在系统">
            <Input
              value={step.system}
              onChange={(event) =>
                setStep((old) => ({ ...old, system: event.target.value }))
              }
              placeholder="CRM / 工单系统 / 企业微信"
            />
          </Field>
          <Field label="可观察结果">
            <Input
              value={step.outcome}
              onChange={(event) =>
                setStep((old) => ({ ...old, outcome: event.target.value }))
              }
              placeholder="例如：工单已路由到正确队列"
            />
          </Field>
          <Button type="submit" disabled={!step.name}>
            添加到英雄工作流
          </Button>
        </form>
      </Modal>
    </div>
  );
}
