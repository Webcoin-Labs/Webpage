import { LocalFileStorage } from "@/lib/storage/local";
import { R2FileStorage } from "@/lib/storage/r2";
import { VercelBlobStorage } from "@/lib/storage/vercel-blob";
import { type FileStorage } from "@/lib/storage/types";
import { env } from "@/lib/env";

export function getFileStorage(): FileStorage {
  const provider = env.STORAGE_PROVIDER.toLowerCase();
  if (provider === "vercel_blob") {
    return new VercelBlobStorage();
  }
  if (provider === "r2") {
    return new R2FileStorage();
  }
  return new LocalFileStorage();
}

export type { StoreFileInput, StoredFile } from "@/lib/storage/types";
