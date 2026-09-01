"use client";

import {
  Download,
  FileSpreadsheet,
  FlaskConical,
  Play,
  Plus,
  Upload,
} from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Progress,
  SectionTitle,
} from "@/components/ui";
import { useDemo } from "@/lib/store";
import type { EvalCase, EvalRun } from "@/lib/types";

type RunInput = Omit<EvalRun, "id" | "createdAt">;
const emptyRun: Record<keyof RunInput, string> = {
  version: "",
  model: "",
  promptVersion: "",
  successRate: "",
  businessScore: "",
  severeFailures: "",
  cost: "",
  latency: "",
  takeoverRate: "",
};

function parseCsvRow(row: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];
    if (character === '"' && quoted && row[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += character;
  }
  values.push(current.trim());
  return values;
}

function parseEvalCsv(text: string): EvalCase[] {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((row) => row.trim());
  if (rows.length < 2) throw new Error("CSV 至少需要表头和一条数据。");
  const headers = parseCsvRow(rows[0]).map((header) => header.toLowerCase());
  if (!["input", "expected"].every((header) => headers.includes(header))) {
    throw new Error("CSV 必须包含 input 和 expected 列。");
  }
  return rows.slice(1).map((row) => {
    const values = parseCsvRow(row);
    const value = (name: string) => values[headers.indexOf(name)]?.trim() || "";
    const severity = value("severity");
    return {
      id: value("id") || `case-${crypto.randomUUID()}`,
      input: value("input"),
      expected: value("expected"),
      type: value("type") || "未分类",
      severity: severity === "高" || severity === "中" ? severity : "低",
      source: value("source") || "CSV 导入",
    };
  });
}

export default function EvalsPage() {
  const { state, createEvalSuite, addEvalCases, recordEvalRun } = useDemo();
  const [suiteOpen, setSuiteOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [suiteName, setSuiteName] = useState("");
  const [selectedId, setSelectedId] = useState(state.evalSuites[0]?.id || "");
  const [runForm, setRunForm] = useState(emptyRun);
  const [csvMessage, setCsvMessage] = useState("");
  const suite =
    state.evalSuites.find((item) => item.id === selectedId) ||
    state.evalSuites[0];
  const cases = suite?.cases || [];
  const latestRun = suite?.runs.at(-1);

  const exportCsv = () => {
    if (!cases.length) return;
    const csv = [
      "id,input,expected,type,severity,source",
      ...cases.map((item) =>
        [
          item.id,
          item.input,
          item.expected,
          item.type,
          item.severity,
          item.source,
        ]
          .map((value) => `"${value.replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${suite?.name || "eval"}-cases.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = async (file?: File) => {
    if (!file || !suite) return;
    try {
      const imported = parseEvalCsv(await file.text());
      if (!imported.length) throw new Error("CSV 中没有可导入的数据。");
      addEvalCases(suite.id, imported);
      setCsvMessage(`已从 ${file.name} 导入 ${imported.length} 条真实案例。`);
    } catch (error) {
      setCsvMessage(error instanceof Error ? error.message : "CSV 解析失败。");
    }
  };

  const saveRun = () => {
    if (!suite) return;
    recordEvalRun(suite.id, {
      version: runForm.version.trim(),
      model: runForm.model.trim(),
      promptVersion: runForm.promptVersion.trim(),
      successRate: Number(runForm.successRate),
      businessScore: Number(runForm.businessScore),
      severeFailures: Number(runForm.severeFailures),
      cost: Number(runForm.cost),
      latency: Number(runForm.latency),
      takeoverRate: Number(runForm.takeoverRate),
    });
    setRunForm(emptyRun);
    setRunOpen(false);
  };

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="EVALUATION BEFORE DEVELOPMENT"
        title="Eval 中心"
        description="导入真实测试案例，并登记外部 Eval Runner 的实际运行结果。"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={exportCsv}
              disabled={!cases.length}
            >
              <Download size={14} />
              导出 CSV
            </Button>
            <Button onClick={() => setSuiteOpen(true)}>
              <Plus size={15} />
              创建 Eval Suite
            </Button>
          </>
        }
      />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {state.evalSuites.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedId(item.id)}
            className={`min-w-52 rounded-[var(--radius-md)] border px-4 py-3 text-left ${item.id === suite?.id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--line)] bg-[var(--surface)]"}`}
          >
            <div className="flex items-center justify-between">
              <b className="truncate text-xs">{item.name}</b>
              <Badge tone={item.status === "已完成" ? "success" : "neutral"}>
                {item.status}
              </Badge>
            </div>
            <p className="mt-2 text-[10px] text-[var(--muted)]">
              {item.version} · {item.caseCount} Cases · 阈值 {item.threshold}%
            </p>
          </button>
        ))}
      </div>
      {suite ? (
        <>
          <div className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
            <section className="card p-5 sm:p-6">
              <SectionTitle
                title="版本表现趋势"
                meta={`${suite.runs.length} 次 Eval Run · 越靠右版本越新`}
                action={
                  <Button onClick={() => setRunOpen(true)}>
                    <Play size={13} />
                    登记 Eval Run
                  </Button>
                }
              />
              {suite.runs.length ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={suite.runs}
                      margin={{ top: 12, right: 16, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--line)"
                      />
                      <XAxis
                        dataKey="version"
                        tick={{ fontSize: 10, fill: "var(--muted)" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: "var(--muted)" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 0,
                          border: "1px solid var(--line)",
                          background: "var(--surface)",
                          fontSize: 11,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="successRate"
                        name="任务成功率"
                        stroke="var(--success)"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="takeoverRate"
                        name="人工接管率"
                        stroke="var(--warning)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={<FlaskConical size={20} />}
                  title="尚无运行记录"
                  description="登记外部 Eval Runner 的第一次真实结果后即可比较版本。"
                />
              )}
            </section>
            <aside className="card p-5">
              <SectionTitle
                title="最新版本判定"
                meta={latestRun?.version || "暂无"}
              />
              {latestRun ? (
                <div className="space-y-4">
                  {[
                    [
                      "任务成功率",
                      `${latestRun.successRate}%`,
                      latestRun.successRate,
                    ],
                    [
                      "业务评分",
                      `${latestRun.businessScore}/5`,
                      latestRun.businessScore * 20,
                    ],
                    [
                      "平均成本",
                      `¥${latestRun.cost}`,
                      Math.max(0, 100 - latestRun.cost * 80),
                    ],
                    [
                      "平均延迟",
                      `${latestRun.latency}s`,
                      Math.max(0, 100 - latestRun.latency * 15),
                    ],
                    [
                      "人工接管率",
                      `${latestRun.takeoverRate}%`,
                      100 - latestRun.takeoverRate,
                    ],
                  ].map(([label, value, progress]) => (
                    <div key={String(label)}>
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-[var(--muted)]">
                          {String(label)}
                        </span>
                        <b className="font-data">{String(value)}</b>
                      </div>
                      <Progress
                        value={Number(progress)}
                        tone={label === "人工接管率" ? "warning" : "success"}
                      />
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-[var(--line)] pt-4 text-xs">
                    <span className="text-[var(--muted)]">严重失败数</span>
                    <Badge
                      tone={latestRun.severeFailures ? "danger" : "success"}
                    >
                      {latestRun.severeFailures} 条
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">尚无可判定数据。</p>
              )}
            </aside>
          </div>
          <section className="card p-5 sm:p-6">
            <SectionTitle
              title="Eval Cases"
              meta={`${cases.length} 条真实案例`}
              action={
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold hover:border-[var(--primary-border)]">
                  <Upload size={13} />
                  导入 CSV
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(event) =>
                      void importCsv(event.target.files?.[0])
                    }
                  />
                </label>
              }
            />
            {csvMessage && (
              <p role="status" className="mb-4 text-xs text-[var(--muted)]">
                {csvMessage}
              </p>
            )}
            {cases.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-y border-[var(--line)] bg-[var(--surface-subtle)] text-[10px] uppercase text-[var(--muted)]">
                      <th className="p-3">Case</th>
                      <th className="p-3">输入</th>
                      <th className="p-3">期望结果</th>
                      <th className="p-3">类型</th>
                      <th className="p-3">严重度</th>
                      <th className="p-3">来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--line)] text-xs"
                      >
                        <td className="font-data p-3 text-[10px] text-[var(--muted)]">
                          {item.id}
                        </td>
                        <td className="max-w-xs truncate p-3">{item.input}</td>
                        <td className="max-w-xs truncate p-3">
                          {item.expected}
                        </td>
                        <td className="p-3">
                          <Badge tone="info">{item.type}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            tone={
                              item.severity === "高"
                                ? "danger"
                                : item.severity === "中"
                                  ? "warning"
                                  : "neutral"
                            }
                          >
                            {item.severity}
                          </Badge>
                        </td>
                        <td className="p-3 text-[var(--muted)]">
                          {item.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<FileSpreadsheet size={20} />}
                title="测试集为空"
                description="上传 CSV 开始；必需列为 input、expected，可选列为 id、type、severity、source。"
              />
            )}
          </section>
        </>
      ) : (
        <EmptyState
          icon={<FlaskConical size={20} />}
          title="尚未创建 Eval Suite"
          description="从当前场景的验收标准开始设计第一套评测。"
          action={
            <Button onClick={() => setSuiteOpen(true)}>创建 Eval Suite</Button>
          }
        />
      )}
      <Modal
        open={suiteOpen}
        onClose={() => setSuiteOpen(false)}
        title="创建 Eval Suite"
        description={
          state.scenario.name
            ? `关联当前场景：${state.scenario.name}`
            : "关联当前项目场景"
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createEvalSuite(suiteName);
            setSuiteOpen(false);
            setSuiteName("");
          }}
          className="grid gap-5"
        >
          <Field label="Suite 名称">
            <Input
              required
              value={suiteName}
              onChange={(event) => setSuiteName(event.target.value)}
              placeholder="请输入评测套件名称"
            />
          </Field>
          <Field label="说明">
            <Input placeholder="说明本轮 Eval 需要验证的目标" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSuiteOpen(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={!suiteName.trim()}>
              创建 Suite
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        title="登记 Eval Run"
        description="填写外部评测工具返回的真实指标，平台不会自动生成运行结果。"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveRun();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="被测版本">
            <Input
              required
              value={runForm.version}
              onChange={(event) =>
                setRunForm({ ...runForm, version: event.target.value })
              }
            />
          </Field>
          <Field label="模型">
            <Input
              required
              value={runForm.model}
              onChange={(event) =>
                setRunForm({ ...runForm, model: event.target.value })
              }
            />
          </Field>
          <Field label="Prompt 版本">
            <Input
              required
              value={runForm.promptVersion}
              onChange={(event) =>
                setRunForm({ ...runForm, promptVersion: event.target.value })
              }
            />
          </Field>
          <Field label="任务成功率 (%)">
            <Input
              required
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={runForm.successRate}
              onChange={(event) =>
                setRunForm({ ...runForm, successRate: event.target.value })
              }
            />
          </Field>
          <Field label="业务评分 (0–5)">
            <Input
              required
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={runForm.businessScore}
              onChange={(event) =>
                setRunForm({ ...runForm, businessScore: event.target.value })
              }
            />
          </Field>
          <Field label="严重失败数">
            <Input
              required
              type="number"
              min="0"
              step="1"
              value={runForm.severeFailures}
              onChange={(event) =>
                setRunForm({ ...runForm, severeFailures: event.target.value })
              }
            />
          </Field>
          <Field label="平均成本 (元)">
            <Input
              required
              type="number"
              min="0"
              step="0.0001"
              value={runForm.cost}
              onChange={(event) =>
                setRunForm({ ...runForm, cost: event.target.value })
              }
            />
          </Field>
          <Field label="平均延迟 (秒)">
            <Input
              required
              type="number"
              min="0"
              step="0.01"
              value={runForm.latency}
              onChange={(event) =>
                setRunForm({ ...runForm, latency: event.target.value })
              }
            />
          </Field>
          <Field label="人工接管率 (%)">
            <Input
              required
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={runForm.takeoverRate}
              onChange={(event) =>
                setRunForm({ ...runForm, takeoverRate: event.target.value })
              }
            />
          </Field>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRunOpen(false)}
            >
              取消
            </Button>
            <Button type="submit">保存真实结果</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
