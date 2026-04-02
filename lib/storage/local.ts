import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { type FileStorage, type StoreFileInput, type StoredFile } from "@/lib/storage/types";
import { env } from "@/lib/env";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function sanitizePathPrefix(prefix?: string): string {
  if (!prefix) return "";
  return prefix
    .split("/")
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "").trim())
    .filter(Boolean)
    .join("/");
}

function sanitizeStorageKey(storageKey: string): string {
  return storageKey
    .split("/")
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "").trim())
    .filter(Boolean)
    .join("/");
}

export class LocalFileStorage implements FileStorage {
  private readonly privateRootPath: string;
  private readonly publicRootPath: string;

  constructor(privateRootPath?: string, publicRootPath?: string) {
    this.privateRootPath = privateRootPath ?? env.LOCAL_STORAGE_ROOT ?? path.join(process.cwd(), ".data");
    const configuredPublicRoot = publicRootPath ?? env.PUBLIC_UPLOAD_ROOT;
    if (!configuredPublicRoot) {
      this.publicRootPath = path.join(process.cwd(), "public");
    } else if (path.isAbsolute(configuredPublicRoot)) {
      // Support URL-style values like "/uploads" by mapping them under /public.
      if (configuredPublicRoot.startsWith("/") && !configuredPublicRoot.startsWith("//")) {
        this.publicRootPath = path.join(process.cwd(), "public", configuredPublicRoot.replace(/^\/+/, ""));
      } else {
        this.publicRootPath = configuredPublicRoot;
      }
    } else {
      this.publicRootPath = path.join(process.cwd(), configuredPublicRoot);
    }
  }

  async store(input: StoreFileInput): Promise<StoredFile> {
    const visibility = input.visibility ?? "private";
    const storageKey =
      input.storageKey && input.storageKey.trim().length > 0
        ? sanitizeStorageKey(input.storageKey)
        : (() => {
            const day = new Date().toISOString().slice(0, 10);
            const safeName = sanitizeFileName(input.fileName || "upload.bin");
            const defaultPrefix = visibility === "public" ? "uploads" : "pitchdecks";
            const pathPrefix = sanitizePathPrefix(input.pathPrefix) || defaultPrefix;
            return `${pathPrefix}/${day}/${randomUUID()}-${safeName}`;
          })();
    const root = visibility === "public" ? this.publicRootPath : this.privateRootPath;
    const absolutePath = path.join(root, storageKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, input.buffer);

    return {
      storageKey,
      fileUrl: visibility === "public" ? `/${storageKey.replace(/\\/g, "/")}` : `local://${storageKey}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const safeKey = sanitizeStorageKey(storageKey);
    if (!safeKey) return;
    const privatePath = path.join(this.privateRootPath, safeKey);
    const publicPath = path.join(this.publicRootPath, safeKey);
    await rm(privatePath, { force: true }).catch(() => undefined);
    await rm(publicPath, { force: true }).catch(() => undefined);
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    const safeKey = sanitizeStorageKey(storageKey);
    if (!safeKey) throw new Error("Invalid storage key.");
    const privatePath = path.join(this.privateRootPath, safeKey);
    const publicPath = path.join(this.publicRootPath, safeKey);
    try {
      return await readFile(privatePath);
    } catch {
      return readFile(publicPath);
    }
  }
}
