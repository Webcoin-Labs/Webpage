/**
 * Rate limiter with optional shared store (Upstash REST).
 * Falls back to in-memory when Upstash env vars are absent.
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimitMemory(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);
  if (!entry) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, remaining: 0 };
  }
  return { ok: true, remaining: limit - entry.count };
}

type RateLimitResult = { ok: boolean; remaining: number };

function hasUpstashConfig() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function rateLimitUpstash(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) return rateLimitMemory(key, limit, windowMs);

  const safeKey = `ratelimit:${key}`;
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const url = `${baseUrl.replace(/\/+$/, "")}/pipeline`;
  const commands = [
    ["INCR", safeKey],
    ["EXPIRE", safeKey, String(ttlSeconds), "NX"],
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!response.ok) {
    return rateLimitMemory(key, limit, windowMs);
  }
  const body = (await response.json()) as Array<{ result?: unknown }>;
  const count = Number(body?.[0]?.result ?? 0);
  if (!Number.isFinite(count) || count <= 0) {
    return rateLimitMemory(key, limit, windowMs);
  }
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}

export async function rateLimitAsync(key: string, limit = MAX_PER_WINDOW, windowMs = WINDOW_MS): Promise<RateLimitResult> {
  if (!hasUpstashConfig()) return rateLimitMemory(key, limit, windowMs);
  try {
    return await rateLimitUpstash(key, limit, windowMs);
  } catch {
    return rateLimitMemory(key, limit, windowMs);
  }
}

export function rateLimit(key: string, limit = MAX_PER_WINDOW, windowMs = WINDOW_MS): RateLimitResult {
  return rateLimitMemory(key, limit, windowMs);
}

export function rateLimitKey(identifier: string, action: string): string {
  return `rl:${action}:${identifier}`;
}
