"use client";
import { Badge } from "@/components/ui";
import { stages, type Analysis, type WorkProject } from "@/lib/workbench/model";
import { skillName } from "@/lib/workbench/skills";

export function CoreInsights({
  analysis,
  project,
}: {
  analysis: Analysis;
  project: WorkProject;
}) {
  const interview = analysis.runs.find((r) => r.output?.interview)?.output
    ?.interview;
  const review = analysis.judgment?.stageReview;
  const scenarios = analysis.judgment?.scenarioEvaluations || [];
  const gaps = analysis.runs.flatMap((r) => r.output?.gaps || []);
  const label = (id: string) =>
    project.sources.find((s) => s.id === id)?.title ||
    project.facts.find((f) => f.id === id)?.text ||
    project.assets.find((a) => a.id === id)?.title ||
    id;
  return (
    <div className="wb-core-insights">
      {interview && (
        <details>
          <summary>访谈结构化信息 · 目标、角色与待核实陈述</summary>
          <div className="wb-gaps">
            <div>
              <h3>业务目标</h3>
              <ul>
                {interview.businessGoals.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <h3>业务痛点</h3>
              <ul>
                {interview.painPoints.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>待核实陈述</h3>
              <ul>
                {interview.unverifiedClaims.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              {interview.stakeholders.map((s, i) => (
                <article key={i}>
                  <strong>
                    {s.name} · {s.role}
                  </strong>
                  <p>{s.claim}</p>
                  <blockquote>{s.quote}</blockquote>
                  <small>{label(s.sourceId)}</small>
                </article>
              ))}
            </div>
          </div>
        </details>
      )}
      {gaps.length > 0 && (
        <details>
          <summary>关键追问 · {gaps.length} 项信息缺口</summary>
          {gaps.map((gap, i) => (
            <article key={i}>
              <div className="wb-row">
                <Badge tone={gap.priority === "P0" ? "warning" : "neutral"}>
                  {gap.priority}
                </Badge>
                <strong>{gap.question}</strong>
              </div>
              <p>为什么：{gap.why}</p>
              <p>应该问：{gap.askWho}</p>
              <small>来源：{gap.sourceIds.map(label).join("、")}</small>
            </article>
          ))}
          <p className="wb-muted">
            开放问题持续保存在右侧「记忆」，关闭需要人工核实证据。
          </p>
        </details>
      )}
      {scenarios.length > 0 && (
        <details open>
          <summary>场景价值评估 · 缺证据的维度不打分</summary>
          {scenarios.map((scenario, i) => (
            <article key={i}>
              <strong>{scenario.scenario}</strong>
              <Badge tone={scenario.priority === "defer" ? "warning" : "info"}>
                {
                  { validate: "先补证", candidate: "候选验证", defer: "暂缓" }[
                    scenario.priority
                  ]
                }
              </Badge>
              <div className="wb-evaluation-table">
                <table>
                  <thead>
                    <tr>
                      <th>评估维度</th>
                      <th>判断</th>
                      <th>依据</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["业务价值", scenario.value],
                        ["技术难度", scenario.technicalDifficulty],
                        ["数据就绪", scenario.dataReadiness],
                        ["组织阻力", scenario.organizationalResistance],
                        ["风险", scenario.risk],
                      ] as const
                    ).map(([name, dimension]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td>
                          {dimension.rating === null
                            ? "待核实"
                            : dimension.rating + " / 5"}
                        </td>
                        <td>
                          {dimension.reason}
                          {dimension.evidenceIds.length > 0 && (
                            <small>
                              证据：
                              {dimension.evidenceIds.map(label).join("、")}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="wb-muted">
                价值、就绪度越高越好；难度、阻力、风险越高越需关注。序数评分仅供比较。
              </p>
              {scenario.assumptions.length > 0 && (
                <p>待验证假设：{scenario.assumptions.join("；")}</p>
              )}
              <p>下一次验证：{scenario.nextValidation}</p>
            </article>
          ))}
        </details>
      )}
      {review && (
        <details open>
          <summary>
            阶段检查 ·{" "}
            {review.advice === "stay"
              ? "保持当前阶段，补齐条件"
              : "完成条件就绪，等待人工审批"}
          </summary>
          {review.criteria.map((c) => (
            <article key={c.criterionId}>
              <div className="wb-row">
                <Badge tone={c.status === "supported" ? "success" : "warning"}>
                  {
                    {
                      supported: "有证据支撑",
                      missing: "缺少证据",
                      conflict: "存在冲突",
                    }[c.status]
                  }
                </Badge>
                <strong>
                  {stages
                    .find((s) => s.id === review.stage)
                    ?.criteria.find((k) => k.id === c.criterionId)?.title ||
                    c.criterionId}
                </strong>
              </div>
              <p>{c.reason}</p>
              <small>
                {c.evidenceIds.map(label).join("、") || "尚无可核实证据"}
              </small>
            </article>
          ))}
          <p className="wb-muted">
            此处是 AI 检查建议。阶段推进仍由右侧真实门禁和人工确认控制。
          </p>
        </details>
      )}
    </div>
  );
}
export function ActionMetadata({
  action,
  project,
}: {
  action: {
    priority?: string;
    prerequisites?: string[];
    skillId?: string;
    dependsOnTaskIds?: string[];
  };
  project: WorkProject;
}) {
  return (
    <div className="wb-action-meta">
      {action.priority && <span>{action.priority}</span>}
      {action.skillId && <span>建议能力：{skillName(action.skillId)}</span>}
      {!!action.prerequisites?.length && (
        <p>前置条件：{action.prerequisites.join("；")}</p>
      )}
      {!!action.dependsOnTaskIds?.length && (
        <p>
          依赖任务：
          {action.dependsOnTaskIds
            .map((id) => project.tasks.find((t) => t.id === id)?.title || id)
            .join("；")}
        </p>
      )}
    </div>
  );
}
