import { expect, test } from "@playwright/test";

test("主题默认浅色并在刷新与跨页面后保持", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.getByTestId("theme-selector").click();
  await page.getByRole("menuitemradio", { name: "深色" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("fde-portal-theme")))
    .toBe("dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/skills");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("跟随系统会响应系统配色变化", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("theme-selector").click();
  await page.getByRole("menuitemradio", { name: "跟随系统" }).click();

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("关键页面在移动端没有横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/dashboard", "/skills", "/settings/ai"]) {
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
