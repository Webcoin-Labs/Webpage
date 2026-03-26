import { randomUUID } from "crypto";
import { del, get, put } from "@vercel/blob";
import { type FileStorage, type StoreFileInput, type StoredFile } from "@/lib/storage/types";
import { env } from "@/lib/env";

function sanitizeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_").trim();
}

function sanitizePath(pathname: string) {
  return pathname
    .split("/")
    .map((segment) => sanitizeSegment(segment))
    .filter(Boolean)
    .join("/");
}

function inferExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index === -1) return "";
  const ext = sanitizeSegment(fileName.slice(index + 1).toLowerCase());
  return ext ? `.${ext}` : "";
}

function shouldTreatAsPrivate(pathname: string) {
  return pathname.startsWith("private/");
}

export class VercelBlobStorage implements FileStorage {
  private readonly token: string;

  constructor() {
    if (!env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
    }
    this.token = env.BLOB_READ_WRITE_TOKEN;
  }

  async store(input: StoreFileInput): Promise<StoredFile> {
    const visibility = input.visibility ?? "private";
    const basePrefix = sanitizePath(input.pathPrefix ?? (visibility === "public" ? "uploads" : "private"));
    const explicitStorageKey = input.storageKey?.trim() ? sanitizePath(input.storageKey) : null;
    const storageKey =
      explicitStorageKey ??
      `${basePrefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${inferExtension(input.fileName || "file.bin")}`;
    const normalizedKey =
      visibility === "private"
        ? storageKey.startsWith("private/")
          ? storageKey
          : `private/${storageKey}`
        : storageKey.replace(/^private\//, "");

    const blob = await put(normalizedKey, input.buffer, {
      access: visibility,
      addRandomSuffix: false,
      contentType: input.contentType,
      token: this.token,
    });

    return {
      storageKey: normalizedKey,
      // Never expose raw private blob URLs directly.
      fileUrl: visibility === "private" ? "" : blob.url,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const key = sanitizePath(storageKey);
    if (!key) return;
    await del(key, { token: this.token });
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    const key = sanitizePath(storageKey);
    if (!key) throw new Error("Invalid storage key.");
    const result = await get(key, {
      access: shouldTreatAsPrivate(key) ? "private" : "public",
      token: this.token,
      useCache: false,
    });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("Blob not found.");
    }
    const payload = await new Response(result.stream).arrayBuffer();
    return Buffer.from(payload);
  }
}

