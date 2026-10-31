import { afterEach, expect, it, vi } from "vitest";
import { appPath } from "./app-path";
afterEach(() => vi.unstubAllEnvs());
it("keeps local root deployment unchanged", () => {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
  expect(appPath("/api/ai/config")).toBe("/api/ai/config");
});
it("prefixes API and download paths once for a shared server", () => {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/fde");
  expect(appPath("/api/workbench/projects")).toBe(
    "/fde/api/workbench/projects",
  );
  expect(appPath("/skill-downloads/test.zip")).toBe(
    "/fde/skill-downloads/test.zip",
  );
  expect(appPath("/fde/api/ai/config")).toBe("/fde/api/ai/config");
});
it("does not rewrite external URLs", () => {
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/fde");
  expect(appPath("https://example.com/a")).toBe("https://example.com/a");
  expect(appPath("//example.com/a")).toBe("//example.com/a");
});
