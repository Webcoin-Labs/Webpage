import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const baseEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  NEXTAUTH_SECRET: "secret",
  GEMINI_API_KEY: "gemini",
  NEXTAUTH_URL: "http://localhost:3000",
  STORAGE_PROVIDER: "local",
};

describe("openclaw client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...process.env,
      ...baseEnv,
      OPENCLAW_BASE_URL: "https://api.openclaw.test",
      OPENCLAW_API_KEY: "openclaw-api-key",
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("retries transient failures and returns successful payload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("temporary", { status: 500 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ threads: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { openClawSyncThreads } = await import("@/lib/openclaw/client");
    const result = await openClawSyncThreads("access-token", "workspace-1");

    expect(result).toEqual({ threads: [] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("throws OpenClawApiError for non-retriable responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 })));

    const { openClawListWorkspaces } = await import("@/lib/openclaw/client");
    await expect(openClawListWorkspaces("bad-token")).rejects.toThrow("OpenClaw request failed (401)");
  });
});
