import { expect, test } from "@playwright/test";

test("Skill 列表、下载与后台在线触发", async ({ page, request }) => {
  await page.goto("/skills");
  await expect(page.getByRole("heading", { name: "Skill 中心" })).toBeVisible();
  await expect(page.getByText("65", { exact: true }).first()).toBeVisible();

  await page.getByPlaceholder(/搜索 Skill/).fill("deployment-engineer");
  await expect(
    page.getByRole("heading", { name: "deployment-engineer" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /查看与运行/ }).click();
  await expect(page.getByText(/包含脚本 · Prompt Only/)).toBeVisible();

  const downloadHref = await page
    .getByRole("link", { name: /下载 ZIP/ })
    .getAttribute("href");
  expect(downloadHref).toBeTruthy();
  const downloadResponse = await request.get(downloadHref!);
  expect(downloadResponse.ok()).toBe(true);
  expect((await downloadResponse.body()).length).toBeGreaterThan(100);

  await page.getByRole("button", { name: "触发 Skill", exact: true }).click();
  await expect(page.getByText("已完成", { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Mock DeepSeek Skill 执行结果/)).toBeVisible();
  await expect(page.getByText(/已阻止脚本执行/)).toBeVisible();
});
