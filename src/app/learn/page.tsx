import type { Metadata } from "next";
import { LearningCenter } from "@/components/learning/learning-center";
import "./learning.css";
export const metadata: Metadata = {
  title: "学习中心 · Vibe Coding 技术栈 | FDE Workbench",
  description:
    "按产品场景了解常见 Vibe Coding 技术栈，包含选型取舍、动手练习、提示词和官方文档。",
};
export default function LearnPage() {
  return <LearningCenter />;
}
