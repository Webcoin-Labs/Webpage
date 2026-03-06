/**
 * Simple in-memory rate limiter for submit endpoints.
 * For production, consider Redis or Upstash.
 */
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_PER_WINDOW = 5;

export function rateLimit(key: string, limit = MAX_PER_WINDOW, windowMs = WINDOW_MS): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, remaining: 0 };
  }
  return { ok: true, remaining: limit - entry.count };
}

export function rateLimitKey(identifier: string, action: string): string {
  return `rl:${action}:${identifier}`;
}
