import "server-only";

import { env } from "@/lib/env";

type OpenClawRequestOptions = {
  method?: "GET" | "POST";
  path: string;
  body?: unknown;
  accessToken?: string | null;
};

export class OpenClawApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(options: OpenClawRequestOptions): Promise<T> {
  if (!env.OPENCLAW_BASE_URL || !env.OPENCLAW_API_KEY) {
    throw new Error("OpenClaw is not configured.");
  }
  const url = new URL(options.path, env.OPENCLAW_BASE_URL);
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.OPENCLAW_API_KEY,
        ...(options.accessToken ? { authorization: `Bearer ${options.accessToken}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
    if (response.ok) {
      return (await response.json()) as T;
    }
    const errorText = await response.text();
    const retriable = response.status >= 500 || response.status === 429;
    if (!retriable || attempt === maxAttempts) {
      throw new OpenClawApiError(response.status, `OpenClaw request failed (${response.status}): ${errorText.slice(0, 200)}`);
    }
    const backoffMs = 300 * attempt + Math.floor(Math.random() * 200);
    await sleep(backoffMs);
  }
  throw new OpenClawApiError(500, "OpenClaw request failed after retries.");
}

export async function openClawConnect(payload: { telegramBotToken?: string; workspaceExternalId?: string }) {
  return request<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    workspaceExternalId?: string;
  }>({
    method: "POST",
    path: "/v1/connect",
    body: payload,
  });
}

export async function openClawListWorkspaces(accessToken: string) {
  return request<Array<{ id: string; title?: string; username?: string; type?: "CHANNEL" | "GROUP" | "DM" }>>({
    path: "/v1/telegram/workspaces",
    accessToken,
  });
}

export async function openClawRefreshToken(refreshToken: string) {
  return request<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
  }>({
    method: "POST",
    path: "/v1/connect/refresh",
    body: { refreshToken },
  });
}

export async function openClawSyncThreads(accessToken: string, workspaceExternalId: string) {
  return request<{
    threads: Array<{
      id: string;
      title?: string;
      lastMessageAt?: string;
      messages?: Array<{ id: string; text?: string; sentAt?: string; direction?: "INBOUND" | "OUTBOUND" }>;
    }>;
    cursor?: string;
  }>({
    method: "POST",
    path: "/v1/telegram/threads/sync",
    accessToken,
    body: { workspaceExternalId },
  });
}

export async function openClawSendReply(accessToken: string, payload: { workspaceExternalId: string; threadExternalId: string; text: string }) {
  return request<{ messageId: string; sentAt: string }>({
    method: "POST",
    path: "/v1/telegram/messages/send",
    accessToken,
    body: payload,
  });
}
