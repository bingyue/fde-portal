"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import {
  evidenceOptions,
  stages,
  type SkillOutput,
  type WorkProject,
} from "@/lib/workbench/model";
import type { Command } from "@/lib/workbench/engine";

type WithoutAudit<T> = T extends unknown ? Omit<T, "actor" | "reason"> : never;
export type DraftCommand = WithoutAudit<Command>;
export function DecisionDialog({
  project,
  draft,
  onClose,
  onSubmit,
}: {
  project: WorkProject;
  draft: DraftCommand;
  onClose: () => void;
  onSubmit: (command: Command) => Promise<void>;
}) {
  const [actor, setActor] = useState(project.owner);
  const [reason, setReason] = useState("");
  const [actions, setActions] = useState<SkillOutput["actions"]>(
    draft.type === "actions" ? draft.actions : [],
  );
  const [evidenceId, setEvidenceId] = useState(
    "evidenceId" in draft ? draft.evidenceId || "" : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title = {
    facts:
      draft.type === "facts" && draft.status === "rejected"
        ? "否决事实提取"
        : "确认项目事实",
    actions: "确认下一步行动",
    gate: "核实阶段完成条件",
    advance: "确认阶段完成",
    rollback: "退回项目阶段",
    task: "更新任务状态",
  }[draft.type];
  const needsEvidence =
    draft.type === "gate" || (draft.type === "task" && draft.status === "done");
  const analysis =
    draft.type === "actions"
      ? project.analyses.find((item) => item.id === draft.analysisId)
      : undefined;
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const command = {
        ...draft,
        actor,
        reason,
        ...(draft.type === "actions" ? { actions } : {}),
        ...(needsEvidence ? { evidenceId } : {}),
      } as Command;
      await onSubmit(command);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "确认失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={title}
      wide={draft.type === "actions"}
      description="每次判断都记录确认人、依据与时间，供后续追溯。"
    >
      <form
        className="wb-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {draft.type === "facts" && (
          <div className="wb-note">
            {project.facts
              .filter((fact) => draft.factIds.includes(fact.id))
              .map((fact) => (
                <p key={fact.id}>
                  {fact.text}
                  <small>原文：{fact.quote}</small>
                </p>
              ))}
          </div>
        )}
        {draft.type === "facts" &&
          draft.status === "rejected" &&
          project.facts.some(
            (fact) =>
              draft.factIds.includes(fact.id) && fact.status === "confirmed",
          ) && (
            <p className="wb-note">
              撤回后将停止将此事实用于后续分析；直接引用它的完成条件与任务证据需要重新核实，相关已通过阶段将退回。
            </p>
          )}
        {draft.type === "actions" && (
          <>
            <p className="wb-muted">
              可调整行动、负责人和阶段；确认后创建任务，并将{" "}
              {analysis?.judgment?.deliverables.length || 0}{" "}
              份草稿归档为交付资产。
            </p>
            {actions.map((action, index) => (
              <div className="wb-action-edit" key={index}>
                <Field label={`行动 ${index + 1}`}>
                  <Input
                    required
                    minLength={2}
                    maxLength={300}
                    value={action.title}
                    onChange={(e) =>
                      setActions(
                        actions.map((item, i) =>
                          i === index
                            ? { ...item, title: e.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </Field>
                <div className="wb-two">
                  <Field label="负责人 / 角色">
                    <Input
                      required
                      maxLength={100}
                      value={action.owner}
                      onChange={(e) =>
                        setActions(
                          actions.map((item, i) =>
                            i === index
                              ? { ...item, owner: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="所属阶段">
                    <Select
                      value={action.stage}
                      onChange={(e) =>
                        setActions(
                          actions.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  stage: e.target.value as typeof item.stage,
                                }
                              : item,
                          ),
                        )
                      }
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="wb-row">
                  <label className="wb-check">
                    <input
                      type="checkbox"
                      checked={action.blocking}
                      onChange={(e) =>
                        setActions(
                          actions.map((item, i) =>
                            i === index
                              ? { ...item, blocking: e.target.checked }
                              : item,
                          ),
                        )
                      }
                    />
                    未完成时阻塞所属阶段
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={actions.length === 1}
                    onClick={() =>
                      setActions(actions.filter((_, i) => i !== index))
                    }
                  >
                    移除
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              disabled={actions.length >= 12}
              onClick={() =>
                setActions([
                  ...actions,
                  {
                    title: "",
                    owner: actor,
                    stage: project.currentStage,
                    blocking: true,
                  },
                ])
              }
            >
              添加行动
            </Button>
          </>
        )}
        {needsEvidence && (
          <Field
            label="关联证据"
            hint="请先在资料区保存原文或确认事实，再关联证据。"
          >
            <Select
              required
              value={evidenceId}
              onChange={(e) => setEvidenceId(e.target.value)}
            >
              <option value="">选择实际支撑该判断的证据</option>
              {evidenceOptions(project).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title.slice(0, 100)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {draft.type === "advance" && (
          <p className="wb-note">
            将确认「{stages.find((s) => s.id === project.currentStage)?.name}
            」完成，并更新流程地图。所有门禁证据和判断依据都会保留。
          </p>
        )}
        {draft.type === "rollback" && (
          <p className="wb-note">
            退回「{stages.find((s) => s.id === draft.stage)?.name}
            」后，该阶段及之后的完成审批需要重新核实。已有资料、任务、资产和历史决策保留。
          </p>
        )}
        {draft.type === "task" && draft.status !== "done" && (
          <p className="wb-muted">
            重新打开已通过阶段的阻塞任务，会退回到该阶段重新核实。
          </p>
        )}
        <Field label="确认人">
          <Input
            required
            maxLength={100}
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </Field>
        <Field
          label="判断依据"
          hint="说明与客户核实了什么、为什么执行该行动或如何满足完成标准。"
        >
          <Textarea
            required
            minLength={2}
            maxLength={3000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="填写本次确认的依据…"
          />
        </Field>
        {error && (
          <p className="wb-error" role="alert">
            {error}
          </p>
        )}
        <div className="wb-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={busy || (needsEvidence && !evidenceId)}
          >
            {busy ? "正在保存…" : "确认并记录"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
