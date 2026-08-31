import { describe, expect, it } from "vitest";
import { deepSeekConfigSchema } from "./config-store";

describe("DeepSeek 配置校验", () => {
  it("使用官方默认地址与 V4 Flash 模型", () => {
    const config = deepSeekConfigSchema.parse({
      apiKey: "sk-test-key-123456789",
    });
    expect(config.baseUrl).toBe("https://api.deepseek.com");
    expect(config.model).toBe("deepseek-v4-flash");
  });

  it("拒绝过短密钥与无效 URL", () => {
    expect(() => deepSeekConfigSchema.parse({ apiKey: "short" })).toThrow();
    expect(() =>
      deepSeekConfigSchema.parse({
        apiKey: "sk-test-key-123456789",
        baseUrl: "not-a-url",
      }),
    ).toThrow();
  });
});
