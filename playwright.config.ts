import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  webServer: [
    { command: "node tests/mock-deepseek.mjs", url: "http://127.0.0.1:3200/models", reuseExistingServer: false, timeout: 30_000 },
    { command: "npm run dev -- --hostname 127.0.0.1 --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 120_000, env: { DEEPSEEK_API_KEY: "sk-e2e-safe-test-key-0001", DEEPSEEK_BASE_URL: "http://127.0.0.1:3200", DEEPSEEK_MODEL: "deepseek-v4-flash" } },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
