import { expect, test } from "@playwright/test";

test("真实数据模式创建 Workspace 与首个项目", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "创建 Workspace", exact: true })
    .click();
  await expect(page.getByText("课程空间", { exact: true })).toHaveCount(0);
  await page.getByLabel("Workspace 名称").fill("E2E AI 交付中心");
  await page.getByRole("button", { name: "创建并进入", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /E2E AI 交付中心 已就绪/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "创建项目", exact: true }).click();
  await expect(page.getByText("课程实训项目", { exact: true })).toHaveCount(0);
  await page.getByLabel("项目名称").fill("电商智能客服 POC");
  await page.getByLabel("所属行业").selectOption({ label: "零售电商" });
  await page.getByLabel("企业或部门").fill("客户体验中心");
  await page.getByLabel("项目负责人").fill("林可");
  await page.getByLabel("业务负责人").fill("陈玥");
  await page
    .getByLabel("项目目标")
    .fill("将售前咨询平均处理时间从 8 分钟降低到 2 分钟");
  await page.getByRole("button", { name: /创建并填写场景卡/ }).click();
  await expect(page.getByRole("heading", { name: "场景卡" })).toBeVisible();
  await expect(
    page.getByText("电商智能客服 POC", { exact: true }).first(),
  ).toBeVisible();
});

test("密钥文件不会进入浏览器持久化存储", async ({ page }) => {
  const testKey = "sk-e2e-file-only-key-0001";
  await page.goto("/settings/ai");
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await page.getByLabel("选择 DeepSeek 密钥文件").setInputFiles({
    name: "deepseek.env",
    mimeType: "text/plain",
    buffer: Buffer.from(`DEEPSEEK_API_KEY=${testKey}\n`),
  });
  await expect(page.getByText("deepseek.env", { exact: true })).toBeVisible();
  await expect(page.getByLabel("API Key")).toHaveValue(testKey);
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  expect(stored).not.toContain(testKey);
  await page.reload();
  await expect(page.getByLabel("API Key").last()).toHaveValue("");
});
