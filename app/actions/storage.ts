"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { getFileStorage } from "@/lib/storage";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type StorageHealthCheckResult =
  | {
      success: true;
      provider: string;
      storageKey: string;
      bytesStored: number;
      bytesRead: number;
      checkedAt: string;
    }
  | {
      success: false;
      error: string;
      provider: string;
      checkedAt: string;
    };

function getProviderName() {
  return env.STORAGE_PROVIDER.toLowerCase();
}

export async function runStorageHealthCheck(): Promise<StorageHealthCheckResult> {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return {
      success: false,
      error: "Unauthorized",
      provider: getProviderName(),
      checkedAt: new Date().toISOString(),
    };
  }

  const limiter = await rateLimitAsync(rateLimitKey(session.user.id, "storage-health-check"), 10, 60_000);
  if (!limiter.ok) {
    return {
      success: false,
      error: "Too many checks. Please wait and retry.",
      provider: getProviderName(),
      checkedAt: new Date().toISOString(),
    };
  }

  const checkedAt = new Date().toISOString();
  const provider = getProviderName();
  const storage = getFileStorage();
  const payload = Buffer.from(`webcoinlabs-storage-health-check:${checkedAt}`, "utf-8");
  const storageKey = `storage-health/${Date.now()}.txt`;

  try {
    const stored = await storage.store({
      fileName: "health.txt",
      contentType: "text/plain",
      buffer: payload,
      storageKey,
      pathPrefix: "storage-health",
      visibility: "private",
    });

    const readBuffer = await storage.getBuffer(stored.storageKey);
    const matches = readBuffer.equals(payload);
    if (!matches) {
      await storage.delete(stored.storageKey).catch(() => undefined);
      return {
        success: false,
        error: "Stored object mismatch after read-back.",
        provider,
        checkedAt,
      };
    }

    await storage.delete(stored.storageKey);

    return {
      success: true,
      provider,
      storageKey: stored.storageKey,
      bytesStored: payload.length,
      bytesRead: readBuffer.length,
      checkedAt,
    };
  } catch (error) {
    logger.error({
      scope: "storage.healthCheck",
      message: "Storage health check failed.",
      error,
      data: { provider, checkedAt, actorId: session.user.id },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Storage health check failed.",
      provider,
      checkedAt,
    };
  }
}
