import { LocalFileStorage } from "@/lib/storage/local";
import { R2FileStorage } from "@/lib/storage/r2";
import { VercelBlobStorage } from "@/lib/storage/vercel-blob";
import { type FileStorage } from "@/lib/storage/types";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export function getFileStorage(): FileStorage {
  const provider = env.STORAGE_PROVIDER.toLowerCase() as "vercel_blob" | "r2" | "local";
  try {
    if (provider === "vercel_blob") {
      return new VercelBlobStorage();
    }
    if (provider === "r2") {
      return new R2FileStorage();
    }
    return new LocalFileStorage();
  } catch (error) {
    logger.error({
      scope: "storage.provider",
      message: "Configured storage provider failed. Falling back to local storage.",
      error,
      data: { provider },
    });
    return new LocalFileStorage();
  }
}

export type { StoreFileInput, StoredFile } from "@/lib/storage/types";
