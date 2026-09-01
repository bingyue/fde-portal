import { expect, test } from "@playwright/test";

async function createDeliveryProject(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "创建 Workspace", exact: true })
    .click();
  await page.getByLabel("Workspace 名称").fill("FDE 交付实验室");
  await page.getByRole("button", { name: "创建并进入", exact: true }).click();
  await page.getByRole("button", { name: "创建项目", exact: true }).click();
  await page.getByLabel("项目名称").fill("智能工单交付项目");
  await page.getByLabel("所属行业").selectOption({ label: "零售电商" });
  await page.getByLabel("企业或部门").fill("客户体验中心");
  await page.getByLabel("项目负责人").fill("周岚");
  await page.getByLabel("业务负责人").fill("许川");
  await page
    .getByLabel("项目目标")
    .fill("将工单平均处理周期从 8 分钟降到 2 分钟");
  await page.getByRole("button", { name: /创建并填写场景卡/ }).click();
}

test("结果契约、现场发现、假设实验与生产运营形成闭环", async ({ page }) => {
  await createDeliveryProject(page);

  await page.goto("/project/discovery");
  await page.getByLabel("业务 Sponsor").fill("许川");
  await page.getByLabel("北极星业务指标").fill("平均工单处理周期");
  await page.getByLabel("当前基线").fill("8");
  await page.getByLabel("目标值").fill("2");
  await page.getByLabel("指标单位").fill("分钟");
  await page.getByLabel("年度业务价值").fill("300000");
  await page.getByLabel("年度总成本").fill("100000");
  await page.getByLabel("价值计算方式").fill("节省工时 × 人力成本 × 业务量");
  await page.getByLabel("成功条件").fill("连续四周达到目标周期");
  await page.getByLabel("停止条件").fill("严重错误超过 1% 时停止扩大");
  await page.getByRole("button", { name: /确认契约/ }).click();
  await expect(
    page.getByText("结果契约已确认", { exact: true }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: /添加/ }).first().click();
  await page.getByLabel("干系人姓名").fill("陈欣");
  await page.getByLabel("业务角色").fill("客服运营负责人");
  await page.getByRole("button", { name: /加入关系图/ }).click();
  await expect(page.getByText("陈欣", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /添加节点/ }).click();
  await page.getByLabel("工作流节点名称").fill("识别客户意图");
  await page.getByRole("button", { name: "添加到英雄工作流" }).click();
  await expect(page.getByText("识别客户意图", { exact: true })).toBeVisible();

  await page.goto("/project/experiments");
  await page.getByRole("button", { name: /登记关键假设/ }).click();
  await page.getByLabel("假设陈述").fill("真实工单可以被稳定自动分类");
  await page.getByLabel("最小实验").fill("用 100 条历史真实工单盲测");
  await page.getByLabel("判定阈值").fill("准确率不低于 85%");
  await page.getByRole("button", { name: "登记并进入队列" }).click();
  await page.getByRole("button", { name: /开始实验/ }).click();
  await page
    .getByLabel("真实工单可以被稳定自动分类的真实证据")
    .fill("100 条真实工单中 89 条分类正确");
  await page.getByRole("button", { name: /验证通过/ }).click();
  await expect(page.getByText("已验证", { exact: true }).last()).toBeVisible();

  await page.goto("/project/operations");
  await page.getByLabel("Champion 用户").fill("陈欣");
  await page.getByLabel("目标用户数").fill("20");
  await page.getByLabel("稳定活跃用户数").fill("15");
  await page.getByRole("button", { name: "保存" }).first().click();
  await page.getByRole("button", { name: /Sponsor 已建立业务共识/ }).click();
  await page.getByLabel("单任务成本预算").fill("0.50");
  await page.getByLabel("回滚责任人").fill("周岚");
  await page.getByRole("button", { name: "保存" }).last().click();
  await page.getByRole("button", { name: /数据管道与权限校验通过/ }).click();
  await expect(page.getByText("75%", { exact: true }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Champion 用户")).toHaveValue("陈欣");
  await expect(page.getByLabel("单任务成本预算")).toHaveValue("0.5");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    "/project/overview",
    "/project/discovery",
    "/project/experiments",
    "/project/operations",
    "/project/poc",
    "/project/assets",
  ]) {
    await page.goto(path);
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(sizes.content, `${path} 存在横向溢出`).toBeLessThanOrEqual(
      sizes.viewport,
    );
  }
});
