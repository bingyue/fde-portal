"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileStack,
  Fingerprint,
  History,
  Layers3,
  RotateCcw,
  Workflow,
} from "lucide-react";
import { Badge, Button, Modal, Select } from "@/components/ui";
import {
  evidenceOptions,
  gateBlockers,
  stages,
  stageIds,
  type StageId,
  type WorkProject,
} from "@/lib/workbench/model";
import { workSkills } from "@/lib/workbench/skills";
import { api, download, statusLabels, time } from "./helpers";
import type { DraftCommand } from "./decision-dialog";

const tabs = [
  { id: "stage", name: "阶段", Icon: Workflow },
  { id: "tasks", name: "任务", Icon: ClipboardCheck },
  { id: "memory", name: "记忆", Icon: Fingerprint },
  { id: "assets", name: "资产", Icon: FileStack },
  { id: "decisions", name: "决策", Icon: History },
  { id: "skills", name: "Skills", Icon: Layers3 },
] as const;
export type Panel = (typeof tabs)[number]["id"];
export function ProjectPanel({
  project,
  stage,
  panel,
  setPanel,
  onCommand,
  onAnalyze,
  busy,
}: {
  project: WorkProject;
  stage: StageId;
  panel: Panel;
  setPanel: (panel: Panel) => void;
  onCommand: (command: DraftCommand) => void;
  onAnalyze: (sourceId: string) => void;
  busy: boolean;
}) {
  const [document, setDocument] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [skillError, setSkillError] = useState("");
  const [filter, setFilter] = useState("all");
  const definition = stages.find((item) => item.id === stage)!;
  const gates = project.gates[stage] || [];
  const blockers = gateBlockers(project, stage);
  const evidence = evidenceOptions(project);
  function openEvidence(id: string) {
    const source = project.sources.find((s) => s.id === id);
    const fact = project.facts.find((f) => f.id === id);
    const asset = project.assets.find((a) => a.id === id);
    if (source) setDocument({ title: source.title, content: source.text });
    if (fact)
      setDocument({
        title: "已确认事实",
        content: `${fact.text}\n\n原文：${fact.quote}\n\n来源：${project.sources.find((s) => s.id === fact.sourceId)?.title}\n确认：${fact.confirmedBy} · ${fact.confirmedAt}`,
      });
    if (asset)
      setDocument({
        title: `${asset.title} v${asset.version}`,
        content: asset.content,
      });
  }
  async function openSkill(id: string) {
    setSkillError("");
    try {
      const { content } = await api<{ content: string }>(
        `/api/workbench/skills/${id}`,
      );
      setDocument({
        title: workSkills.find((s) => s.id === id)!.name,
        content,
      });
    } catch (e) {
      setSkillError(e instanceof Error ? e.message : "读取失败");
    }
  }
  const tasks = project.tasks.filter(
    (task) => filter === "all" || task.stage === filter,
  );
  return (
    <aside className="wb-project-panel wb-card">
      <nav className="wb-panel-tabs" aria-label="项目资料面板">
        {tabs.map(({ id, name, Icon }) => (
          <button
            key={id}
            aria-pressed={panel === id}
            className={panel === id ? "active" : ""}
            onClick={() => setPanel(id)}
          >
            <Icon size={16} />
            {name}
          </button>
        ))}
      </nav>
      <div className="wb-panel-body">
        {panel === "stage" && (
          <>
            <div className="wb-panel-title">
              <span className="wb-eyebrow">
                STAGE {String(stageIds.indexOf(stage) + 1).padStart(2, "0")}
              </span>
              <div className="wb-row wb-between">
                <h2>{definition.name}</h2>
                <Badge
                  tone={
                    project.completedStages.includes(stage)
                      ? "success"
                      : stage === project.currentStage
                        ? "info"
                        : "neutral"
                  }
                >
                  {project.completedStages.includes(stage)
                    ? "已完成"
                    : stage === project.currentStage
                      ? "当前阶段"
                      : "待推进"}
                </Badge>
              </div>
              <p>{definition.goal}</p>
            </div>
            <h3 className="wb-side-heading">
              完成标准与证据{" "}
              <span>
                {gates.length}/{definition.criteria.length}
              </span>
            </h3>
            <div className="wb-criteria">
              {definition.criteria.map((criterion) => {
                const gate = gates.find(
                  (item) => item.criterionId === criterion.id,
                );
                return (
                  <div key={criterion.id} className={gate ? "verified" : ""}>
                    <div className="wb-row">
                      <span className="wb-criterion-mark">
                        {gate ? <Check size={13} /> : "○"}
                      </span>
                      <strong>{criterion.title}</strong>
                    </div>
                    {gate ? (
                      <>
                        <button
                          className="wb-evidence-link"
                          onClick={() => openEvidence(gate.evidenceId)}
                        >
                          {evidence.find((item) => item.id === gate.evidenceId)
                            ?.title || "证据记录"}{" "}
                          <ArrowRight size={12} />
                        </button>
                        <p>{gate.reason}</p>
                        <small>
                          {gate.actor} · {time(gate.at)}
                        </small>
                      </>
                    ) : (
                      <p>需要 FDE 核实并关联实际证据。</p>
                    )}
                    {stage === project.currentStage &&
                      !project.completedStages.includes(stage) && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            onCommand({
                              type: "gate",
                              stage,
                              criterionId: criterion.id,
                              evidenceId: gate?.evidenceId || "",
                            })
                          }
                        >
                          {gate ? "调整证据" : "关联证据并确认"}
                        </Button>
                      )}
                  </div>
                );
              })}
            </div>
            <h3 className="wb-side-heading">未解决事项</h3>
            {blockers.length ? (
              <ul className="wb-blockers">
                {blockers.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <div className="wb-note">完成条件已满足，可由 FDE 确认阶段。</div>
            )}
            <h3 className="wb-side-heading">本阶段专业能力</h3>
            <div className="wb-inline-skills">
              {definition.skills.map((id) => (
                <button key={id} onClick={() => void openSkill(id)}>
                  {workSkills.find((s) => s.id === id)?.name} ↗
                </button>
              ))}
            </div>
            <h3 className="wb-side-heading">
              阶段交付物{" "}
              <span>
                {project.assets.filter((asset) => asset.stage === stage).length}
              </span>
            </h3>
            {project.assets
              .filter((asset) => asset.stage === stage)
              .map((asset) => (
                <button
                  className="wb-asset-link"
                  key={asset.id}
                  onClick={() => openEvidence(asset.id)}
                >
                  <FileStack size={14} />
                  {asset.title}
                  <small>v{asset.version}</small>
                </button>
              ))}
            {!project.assets.some((asset) => asset.stage === stage) && (
              <p className="wb-muted">
                确认 AI 行动后，生成的交付物会归档到这里。
              </p>
            )}
            {stage === project.currentStage &&
              !project.completedStages.includes(stage) && (
                <div className="wb-stage-confirm">
                  <span>03 · 阶段确认</span>
                  <Button
                    disabled={!!blockers.length || busy}
                    onClick={() => onCommand({ type: "advance" })}
                  >
                    {stage === "acceptance"
                      ? "确认验收与交接完成"
                      : "确认完成，进入下一阶段"}
                    <ArrowRight size={15} />
                  </Button>
                  <small>
                    {blockers.length
                      ? "请先补齐以上证据并关闭阻塞任务。"
                      : "推进将记录你的判断和证据。"}
                  </small>
                </div>
              )}
            {(stageIds.indexOf(stage) <
              stageIds.indexOf(project.currentStage) ||
              project.completedStages.includes(stage)) && (
              <Button
                variant="ghost"
                onClick={() => onCommand({ type: "rollback", stage })}
              >
                <RotateCcw size={14} />
                退回此阶段重新核实
              </Button>
            )}
          </>
        )}
        {panel === "tasks" && (
          <>
            <div className="wb-panel-title">
              <span className="wb-eyebrow">ACTION REGISTER</span>
              <h2>项目任务</h2>
              <p>可跨阶段并行执行，阻塞任务须完成后再推进。</p>
            </div>
            <Select
              aria-label="按阶段筛选任务"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">全部阶段 · {project.tasks.length} 项</option>
              {stages.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            {!tasks.length && (
              <Empty text="尚无任务。审核 AI 建议并确认行动后，会自动写入这里。" />
            )}
            {tasks.map((task) => (
              <article className="wb-task" key={task.id}>
                <div className="wb-row wb-between">
                  <Badge
                    tone={
                      task.status === "done"
                        ? "success"
                        : task.status === "doing"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {statusLabels[task.status]}
                  </Badge>
                  {task.blocking && (
                    <span className="wb-required">阶段必需</span>
                  )}
                </div>
                <h3>{task.title}</h3>
                <p>
                  {task.owner} · {stages.find((s) => s.id === task.stage)?.name}
                </p>
                {task.evidenceId && (
                  <button
                    className="wb-evidence-link"
                    onClick={() => openEvidence(task.evidenceId!)}
                  >
                    查看完成证据 <ArrowRight size={12} />
                  </button>
                )}
                {task.completionNote && <small>{task.completionNote}</small>}
                <div className="wb-row">
                  {task.status === "todo" && (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        onCommand({
                          type: "task",
                          taskId: task.id,
                          status: "doing",
                        })
                      }
                    >
                      开始处理
                    </Button>
                  )}
                  {task.status !== "done" ? (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        onCommand({
                          type: "task",
                          taskId: task.id,
                          status: "done",
                        })
                      }
                    >
                      关联证据并完成
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        onCommand({
                          type: "task",
                          taskId: task.id,
                          status: "todo",
                        })
                      }
                    >
                      重新打开
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </>
        )}
        {panel === "memory" && (
          <>
            <div className="wb-panel-title">
              <span className="wb-eyebrow">PROJECT MEMORY</span>
              <h2>企业事实与资料</h2>
              <p>事实经过确认才进入持续记忆，原始资料始终保留。</p>
            </div>
            <h3 className="wb-side-heading">
              已确认事实{" "}
              <span>
                {project.facts.filter((f) => f.status === "confirmed").length}
              </span>
            </h3>
            {project.facts
              .filter((f) => f.status === "confirmed")
              .map((fact) => (
                <article className="wb-memory-fact" key={fact.id}>
                  <p>{fact.text}</p>
                  <blockquote>{fact.quote}</blockquote>
                  <button onClick={() => openEvidence(fact.sourceId)}>
                    {project.sources.find((s) => s.id === fact.sourceId)?.title}
                  </button>
                  <small>
                    {fact.confirmedBy} · {time(fact.confirmedAt!)}
                  </small>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      onCommand({
                        type: "facts",
                        factIds: [fact.id],
                        status: "rejected",
                      })
                    }
                  >
                    撤回此事实
                  </Button>
                </article>
              ))}
            {!project.facts.some((f) => f.status === "confirmed") && (
              <p className="wb-muted">
                尚无已确认事实。请先核对判断卡中的原文。
              </p>
            )}
            <h3 className="wb-side-heading">
              原始资料 <span>{project.sources.length}</span>
            </h3>
            {!project.sources.length && (
              <Empty text="粘贴企业问题，或上传 TXT / Markdown / CSV / JSON 资料。" />
            )}
            {[...project.sources].reverse().map((source) => (
              <article className="wb-source" key={source.id}>
                <div>
                  <strong>{source.title}</strong>
                  <small>
                    {time(source.createdAt)} ·{" "}
                    {source.text.length.toLocaleString()} 字
                  </small>
                </div>
                <p>
                  {source.text.slice(0, 100)}
                  {source.text.length > 100 && "…"}
                </p>
                <div className="wb-row">
                  <Button
                    variant="ghost"
                    onClick={() => openEvidence(source.id)}
                  >
                    查看原文
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => onAnalyze(source.id)}
                  >
                    用此资料分析
                  </Button>
                </div>
              </article>
            ))}
          </>
        )}
        {panel === "assets" && (
          <>
            <div className="wb-panel-title">
              <span className="wb-eyebrow">DELIVERY ASSETS</span>
              <h2>交付资产</h2>
              <p>确认行动后归档；同名交付物生成新版本，历史版本保留。</p>
            </div>
            {!project.assets.length && (
              <Empty text="目前还没有确认的交付物。先查看 AI 输出的草稿，再确认行动归档。" />
            )}
            {[...project.assets].reverse().map((asset) => (
              <article className="wb-asset" key={asset.id}>
                <div className="wb-row wb-between">
                  <FileStack size={20} />
                  <Badge tone="info">v{asset.version}</Badge>
                </div>
                <h3>{asset.title}</h3>
                <p>
                  {stages.find((s) => s.id === asset.stage)?.name} ·{" "}
                  {asset.approvedBy} 确认
                </p>
                <small>{time(asset.createdAt)}</small>
                <div className="wb-row">
                  <Button
                    variant="secondary"
                    onClick={() => openEvidence(asset.id)}
                  >
                    查看正文
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      download(
                        `${asset.title}-v${asset.version}.md`,
                        asset.content,
                      )
                    }
                  >
                    <ArrowDownToLine size={14} />
                    下载
                  </Button>
                </div>
                <details>
                  <summary>来源资料</summary>
                  {asset.sourceIds.map((id) => (
                    <button
                      className="wb-evidence-link"
                      key={id}
                      onClick={() => openEvidence(id)}
                    >
                      {project.sources.find((s) => s.id === id)?.title || id}
                    </button>
                  ))}
                </details>
              </article>
            ))}
          </>
        )}
        {panel === "decisions" && (
          <>
            <div className="wb-panel-title">
              <span className="wb-eyebrow">DECISION LOG</span>
              <h2>决策记录</h2>
              <p>事实、行动与阶段分开确认，每一次都有依据。</p>
            </div>
            {!project.decisions.length && (
              <Empty text="第一次人工确认后，这里会记录判断人、时间、依据和关联证据。" />
            )}
            {project.decisions.map((decision) => (
              <article className="wb-decision" key={decision.id}>
                <span className="wb-timeline-dot" />
                <strong>
                  {
                    {
                      fact: "事实核实",
                      action: "行动确认",
                      stage: "阶段推进",
                      rollback: "阶段回退",
                      task: "任务更新",
                      evidence: "完成条件核实",
                    }[decision.kind]
                  }
                </strong>
                <small>
                  {decision.actor} · {time(decision.at)}
                </small>
                {decision.outcome && <p>{decision.outcome}</p>}
                <p>依据：{decision.reason}</p>
                <details>
                  <summary>关联记录</summary>
                  {decision.references.map((id, i) => (
                    <div key={i}>
                      {evidence.some((e) => e.id === id) ? (
                        <button
                          className="wb-evidence-link"
                          onClick={() => openEvidence(id)}
                        >
                          {evidence.find((e) => e.id === id)!.title}
                        </button>
                      ) : (
                        <small>
                          {stages.find((s) => s.id === id)?.name ||
                            project.tasks.find((t) => t.id === id)?.title ||
                            stages
                              .flatMap((s) => s.criteria)
                              .find((c) => c.id === id)?.title ||
                            `分析记录 ${id.slice(0, 8)}`}
                        </small>
                      )}
                    </div>
                  ))}
                </details>
              </article>
            ))}
          </>
        )}
        {panel === "skills" && (
          <>
            <div className="wb-panel-title">
              <span className="wb-eyebrow">SPECIALIST SKILLS</span>
              <h2>专业方法库</h2>
              <p>12 项独立能力，按需加载。系统推荐组合，你也可以调整。</p>
            </div>
            {workSkills.map((skill, index) => (
              <button
                className="wb-skill-item"
                key={skill.id}
                onClick={() => void openSkill(skill.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{skill.name}</strong>
                  <p>{skill.when}</p>
                  <small>产出：{skill.output}</small>
                </div>
                <ArrowRight size={14} />
              </button>
            ))}
          </>
        )}
        {skillError && (
          <p role="alert" className="wb-error">
            {skillError}
          </p>
        )}
      </div>
      {document && (
        <Modal
          open
          wide
          title={document.title}
          onClose={() => setDocument(null)}
        >
          <pre className="wb-document">{document.content}</pre>
          <div className="wb-actions">
            <Button
              variant="secondary"
              onClick={() => download(`${document.title}.md`, document.content)}
            >
              <ArrowDownToLine size={14} />
              下载文档
            </Button>
          </div>
        </Modal>
      )}
    </aside>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="wb-side-empty">
      <FileStack size={22} />
      <p>{text}</p>
    </div>
  );
}
