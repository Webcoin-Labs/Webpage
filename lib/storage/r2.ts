import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { type FileStorage, type StoreFileInput, type StoredFile } from "@/lib/storage/types";
import { env } from "@/lib/env";

function requireEnv(name: "R2_ACCESS_KEY_ID" | "R2_SECRET_ACCESS_KEY" | "R2_BUCKET_NAME"): string {
  const value = env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function sanitizeStorageKey(storageKey: string): string {
  return storageKey
    .split("/")
    .map((segment) => segment.replace(/[^a-zA-Z0-9._-]/g, "").trim())
    .filter(Boolean)
    .join("/");
}

function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body || typeof (body as { [key: string]: unknown }).on !== "function") {
    throw new Error("Unexpected R2 object response body.");
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const readable = body as NodeJS.ReadableStream;
    readable.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    readable.on("error", reject);
    readable.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export class R2FileStorage implements FileStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor() {
    const accountId = env.R2_ACCOUNT_ID;
    const configuredEndpoint =
      env.R2_ENDPOINT ??
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
    if (!configuredEndpoint) {
      throw new Error("R2_ENDPOINT (or R2_ACCOUNT_ID) is not configured.");
    }
    this.endpoint = configuredEndpoint.replace(/\/+$/, "");
    this.bucket = requireEnv("R2_BUCKET_NAME");
    this.client = new S3Client({
      region: "auto",
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }

  async store(input: StoreFileInput): Promise<StoredFile> {
    const storageKey =
      input.storageKey && input.storageKey.trim().length > 0
        ? sanitizeStorageKey(input.storageKey)
        : sanitizeStorageKey(
            `${input.pathPrefix ?? "uploads"}/${Date.now()}-${input.fileName || "file.bin"}`
          );

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: input.buffer,
        ContentType: input.contentType,
      })
    );

    return {
      storageKey,
      fileUrl: `${this.endpoint}/${this.bucket}/${storageKey}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const key = sanitizeStorageKey(storageKey);
    if (!key) return;
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    const key = sanitizeStorageKey(storageKey);
    if (!key) throw new Error("Invalid storage key.");

    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    return streamToBuffer(response.Body);
  }
}
