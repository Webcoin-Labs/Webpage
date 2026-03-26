import "server-only";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required."),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SIGNUP_FROM_EMAIL: z.string().optional(),
  PASSWORD_RESET_FROM_EMAIL: z.string().optional(),
  PASSWORD_RESET_WEBHOOK_URL: z.string().url().optional(),
  PASSWORD_RESET_WEBHOOK_TOKEN: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["vercel_blob", "r2", "local"]).default("vercel_blob"),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  LOCAL_STORAGE_ROOT: z.string().optional(),
  PUBLIC_UPLOAD_ROOT: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  OPENCLAW_BASE_URL: z.string().url().optional(),
  OPENCLAW_API_KEY: z.string().optional(),
  APP_ENCRYPTION_SECRET: z.string().optional(),
  UPLOAD_SCAN_HOOK_URL: z.string().url().optional(),
  INTERNAL_JOBS_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
  throw new Error(`Invalid environment configuration. ${issues}`);
}

const data = parsed.data;
const isProdBuild = data.NODE_ENV === "production" && process.env.NEXT_PHASE === "phase-production-build";
const isProdRuntime = data.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
const placeholderEndpointPattern = /<\s*accountid\s*>/i;
const normalizedR2Endpoint = data.R2_ENDPOINT?.trim()
  ? placeholderEndpointPattern.test(data.R2_ENDPOINT)
    ? (data.R2_ACCOUNT_ID ? `https://${data.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined)
    : data.R2_ENDPOINT.trim()
  : undefined;

if (!isProdBuild) {
  if (data.NODE_ENV === "production" && !data.NEXTAUTH_URL) {
    throw new Error("NEXTAUTH_URL must be set in production.");
  }

  const hasAnyR2Config =
    Boolean(data.R2_ACCESS_KEY_ID) ||
    Boolean(data.R2_SECRET_ACCESS_KEY) ||
    Boolean(data.R2_BUCKET_NAME) ||
    Boolean(data.R2_ENDPOINT) ||
    Boolean(data.R2_ACCOUNT_ID);

  // Validate R2 settings only when explicitly configured.
  if (data.STORAGE_PROVIDER === "r2" && hasAnyR2Config) {
    const required = ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"] as const;
    for (const key of required) {
      if (!data[key]) throw new Error(`${key} must be set when STORAGE_PROVIDER=r2.`);
    }
    if (!normalizedR2Endpoint && !data.R2_ACCOUNT_ID) {
      throw new Error("R2_ENDPOINT or R2_ACCOUNT_ID must be set when STORAGE_PROVIDER=r2.");
    }
    if (normalizedR2Endpoint) {
      try {
        // eslint-disable-next-line no-new
        new URL(normalizedR2Endpoint);
      } catch {
        throw new Error("R2_ENDPOINT must be a valid URL when STORAGE_PROVIDER=r2.");
      }
    }
  }

  if (data.STORAGE_PROVIDER === "vercel_blob" && !data.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN must be set when STORAGE_PROVIDER=vercel_blob.");
  }
}

const hasGoogle = Boolean(data.GOOGLE_CLIENT_ID || data.GOOGLE_CLIENT_SECRET);
if (hasGoogle && (!data.GOOGLE_CLIENT_ID || !data.GOOGLE_CLIENT_SECRET)) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be set.");
}

const hasGitHub = Boolean(data.GITHUB_CLIENT_ID || data.GITHUB_CLIENT_SECRET);
if (hasGitHub && (!data.GITHUB_CLIENT_ID || !data.GITHUB_CLIENT_SECRET)) {
  throw new Error("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must both be set.");
}

if (!isProdBuild && data.NODE_ENV === "production" && !data.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY must be set in production for pitch analysis flows.");
}

if (data.OPENCLAW_BASE_URL && !data.OPENCLAW_API_KEY) {
  throw new Error("OPENCLAW_API_KEY must be set when OPENCLAW_BASE_URL is configured.");
}

if (isProdRuntime) {
  // Optional integrations should not take down core pages if omitted.
  if (data.UPSTASH_REDIS_REST_URL) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.UPSTASH_REDIS_REST_URL);
    } catch {
      throw new Error("UPSTASH_REDIS_REST_URL must be a valid URL in production.");
    }
    if (!data.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("UPSTASH_REDIS_REST_TOKEN must be set when UPSTASH_REDIS_REST_URL is configured.");
    }
  }

  if (data.OPENCLAW_BASE_URL && (!data.OPENCLAW_API_KEY || !data.APP_ENCRYPTION_SECRET)) {
    throw new Error("OPENCLAW_API_KEY and APP_ENCRYPTION_SECRET must be set when OPENCLAW_BASE_URL is configured.");
  }
}

export const env = {
  ...data,
  R2_ENDPOINT: normalizedR2Endpoint,
};
