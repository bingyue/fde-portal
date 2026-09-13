import { expect, test } from "@playwright/test";

test("客户多轮诊断、刷新恢复、明确确认后写入 POC", async ({ page }) => {
  await page.goto("/chat");
  await expect(page.getByText("岚舟已就绪")).toBeVisible();
  const input = page.getByRole("textbox", { name: "发送给岚舟的消息" });
  await input.fill("我是测试企业的客服，查询文档耗时，希望改善。");
  const firstResponse = page.waitForResponse("**/api/ai/diagnosis");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  const response = await firstResponse;
  expect(response.status(), await response.text()).toBe(200);
  await expect(page.getByRole("log")).toContainText("目前单次耗时多久");
  await expect(
    page.getByRole("button", { name: "确认 POC 方案", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("log")).toContainText("我是测试企业的客服");
  await expect(page.getByText("岚舟已就绪")).toBeVisible();
  await input.fill(
    "现状每次8分钟，希望降至2分钟，AI建议由客服审核，不自动发送。",
  );
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("接下来确认数据权限");
  await input.fill(
    "同意脱敏授权文档问答范围，2周2名客服，测试负责人验收；准确率90%，耗时2分钟，参与率80%，泄露立即停止。",
  );
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "POC 方案预览" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("fde-portal-live-v2")!).project.id,
    ),
  ).toBe("");
  await page
    .getByRole("button", { name: "确认 POC 方案", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "确认并写入项目" }),
  ).toBeDisabled();
  await page.getByLabel("确认人姓名").fill("测试客户");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "确认并写入项目" }).click();
  await expect(page.getByText("测试客户 已确认此版方案")).toBeVisible();
  await page.reload();
  await expect(page.getByText("测试客户 已确认此版方案")).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("fde-portal-live-v2")!),
  );
  expect(saved.scenario.name).toBe("客服文档问答 POC");
  expect(saved.reviews[0].status).toBe("待评审");
  expect(
    saved.stages.find((s: { code: string }) => s.code === "P3").criteria,
  ).toHaveLength(3);
});

test("失败后保留消息并重试；移动端无横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let calls = 0;
  await page.route("**/api/ai/diagnosis", async (route) => {
    calls++;
    if (calls === 1)
      await route.fulfill({ status: 502, json: { error: "连接暂时中断" } });
    else await route.continue();
  });
  await page.goto("/chat");
  await expect(page.getByText("岚舟已就绪")).toBeVisible();
  await page
    .getByRole("textbox", { name: "发送给岚舟的消息" })
    .fill("客服查询很慢");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByText("连接暂时中断", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "重试回复" }).click();
  await expect(page.getByRole("log")).toContainText("目前单次耗时多久");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
