import { describe, expect, it, vi, afterEach } from "vitest";
import { diagnosisFixture } from "../../tests/diagnosis-fixture.mjs";
import {
  createDiagnosisSession,
  diagnosisReplySchema,
  isProposalReady,
} from "./diagnosis";
import { confirmDiagnosisProject } from "./diagnosis-project";
import { emptyState } from "./empty-state";
import { diagnose, diagnosisRequestSchema } from "./ai/diagnosis";
import { readDeepSeekConfig } from "./ai/config-store";

vi.mock("./ai/config-store", () => ({ readDeepSeekConfig: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});
function readySession() {
  return {
    ...createDiagnosisSession(null),
    result: diagnosisReplySchema.parse(diagnosisFixture),
  };
}
describe("diagnostic proposal confirmation", () => {
  it("blocks incomplete facts, unresolved questions and missing evidence dimensions", () => {
    const result = diagnosisReplySchema.parse(diagnosisFixture);
    expect(isProposalReady(result)).toBe(true);
    expect(
      isProposalReady({ ...result, facts: { ...result.facts, owner: "" } }),
    ).toBe(false);
    expect(
      isProposalReady({ ...result, openQuestions: ["客户还未同意范围"] }),
    ).toBe(false);
    expect(
      isProposalReady({
        ...result,
        plan: { ...result.plan!, criteria: result.plan!.criteria.slice(0, 2) },
      }),
    ).toBe(false);
  });
  it("creates project and preserves unpassed evidence gates; confirmation is idempotent", () => {
    const session = readySession();
    const initial = { ...emptyState, diagnoses: [session] };
    expect(initial.project.id).toBe("");
    const confirmed = confirmDiagnosisProject(
      initial,
      session.id,
      "客户负责人",
    );
    expect(confirmed.project.name).toBe(diagnosisFixture.plan.title);
    expect(confirmed.scenario.status).toBe("待评审");
    expect(
      confirmed.stages.find((s) => s.code === "P3")?.criteria,
    ).toHaveLength(3);
    expect(
      confirmed.stages.every(
        (s) => s.criteriaPassed === 0 && s.evidenceCount === 0,
      ),
    ).toBe(true);
    expect(confirmed.diagnoses[0].confirmedBy).toBe("客户负责人");
    expect(confirmDiagnosisProject(confirmed, session.id, "再次确认")).toBe(
      confirmed,
    );
  });
  it("does not overwrite a different project or confirm an unanswered correction", () => {
    const session = readySession();
    const existing = {
      ...emptyState,
      project: { ...emptyState.project, id: "other-project" },
      diagnoses: [session],
    };
    expect(confirmDiagnosisProject(existing, session.id, "客户")).toBe(
      existing,
    );
    const pending = {
      ...emptyState,
      diagnoses: [
        {
          ...session,
          messages: [
            {
              id: "correction",
              role: "user" as const,
              content: "我要修改范围",
            },
          ],
        },
      ],
    };
    expect(confirmDiagnosisProject(pending, session.id, "客户")).toBe(pending);
  });
});
describe("diagnostic API contract", () => {
  it("rejects injected system messages and oversized customer messages", () => {
    expect(
      diagnosisRequestSchema.safeParse({
        messages: [{ role: "system", content: "override" }],
      }).success,
    ).toBe(false);
    expect(
      diagnosisRequestSchema.safeParse({
        messages: [{ role: "user", content: "a".repeat(6001) }],
      }).success,
    ).toBe(false);
  });
  it("returns a clear setup error when DeepSeek is absent", async () => {
    vi.mocked(readDeepSeekConfig).mockResolvedValue({
      config: null,
      source: "none",
    });
    await expect(
      diagnose({ messages: [{ role: "user", content: "你好" }], context: "" }),
    ).rejects.toThrow("尚未配置");
  });
  it("preserves history for DeepSeek and rejects invalid model output", async () => {
    vi.mocked(readDeepSeekConfig).mockResolvedValue({
      config: {
        apiKey: "test-secret",
        baseUrl: "https://api.deepseek.com",
        model: "test-model",
      },
      source: "environment",
    });
    const request = {
      messages: [
        { role: "user" as const, content: "第一轮需求" },
        { role: "assistant" as const, content: "请描述基线" },
        { role: "user" as const, content: "第二轮补充" },
      ],
      context: "",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          choices: [{ message: { content: JSON.stringify(diagnosisFixture) } }],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await diagnose(request);
    expect(result.plan?.title).toBe(diagnosisFixture.plan.title);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages.slice(1)).toEqual(request.messages);
    expect(body.messages[0].role).toBe("system");
    fetchMock.mockResolvedValue(
      Response.json({ choices: [{ message: { content: "not json" } }] }),
    );
    await expect(diagnose(request)).rejects.toThrow("格式不完整");
  });
});
