import { describe, expect, it } from "vitest";
import { scenarioGenerationSchema } from "./schemas";

describe("AI 结构化输出", () => {
  it("拒绝缺少关键验收字段的输出", () =>
    expect(scenarioGenerationSchema.safeParse({ name: "客服" }).success).toBe(
      false,
    ));
  it("接受 DeepSeek 的完整结构化场景卡", () => {
    const output = {
      name: "客户咨询协作",
      department: "客户服务部",
      businessOwner: "业务负责人",
      users: "客服人员",
      frequency: "每月1000次",
      trigger: "收到客户咨询",
      input: "问题与企业知识",
      currentProcess: "人工识别并查询资料后回复",
      aiTask: "识别问题并生成可追溯建议",
      targetOutput: "带来源的结构化答复",
      targetMetrics: "成功率不低于85%",
      humanBoundary: "外部承诺需要人工确认",
      dataSources: "企业知识库与业务系统",
      threshold: "总体通过率85%",
      valueTarget: "平均处理时间降低50%",
    };
    expect(scenarioGenerationSchema.parse(output)).toEqual(output);
  });
});
