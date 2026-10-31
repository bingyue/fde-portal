import type { WorkProject } from "@/lib/workbench/model";
import { appPath } from "@/lib/app-path";

export type ProjectSummary = Pick<
  WorkProject,
  | "id"
  | "name"
  | "organization"
  | "goal"
  | "owner"
  | "currentStage"
  | "updatedAt"
>;
export async function api<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(
    appPath(url),
    body === undefined
      ? { cache: "no-store" }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "请求失败，请重试");
  return result as T;
}
export function download(name: string, text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name.replace(/[\\/:*?"<>|]/g, "-");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function time(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export const statusLabels = {
  queued: "等待前序",
  skipped: "前序失败，已跳过",
  running: "执行中",
  completed: "已完成",
  failed: "执行失败",
  todo: "待办",
  doing: "进行中",
  done: "已完成",
  proposed: "待核实",
  confirmed: "已确认",
  rejected: "已否决",
};
