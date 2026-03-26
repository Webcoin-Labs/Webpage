import { logger } from "@/lib/logger";

type PerfMeta = Record<string, unknown> | undefined;

export async function measureAsync<T>(
  scope: string,
  operation: string,
  fn: () => Promise<T>,
  meta?: PerfMeta,
): Promise<T> {
  const startedAt = Date.now();
  try {
    return await fn();
  } finally {
    const durationMs = Date.now() - startedAt;
    logger.info({
      scope,
      message: `${operation} completed`,
      data: {
        durationMs,
        ...meta,
      },
    });
  }
}

