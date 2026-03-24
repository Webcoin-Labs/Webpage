import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const envOr = (key: string, fallback: string) => {
  const value = process.env[key];
  if (!value || !value.trim()) return fallback;
  return value;
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm build && pnpm start -p 3000",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: envOr("DATABASE_URL", "postgresql://user:pass@localhost:5432/webcoinlabs"),
      NEXTAUTH_SECRET: envOr("NEXTAUTH_SECRET", "test-secret"),
      NEXTAUTH_URL: envOr("NEXTAUTH_URL", "http://127.0.0.1:3000"),
      STORAGE_PROVIDER: envOr("STORAGE_PROVIDER", "local"),
      LOCAL_STORAGE_ROOT: envOr("LOCAL_STORAGE_ROOT", ".data"),
      GEMINI_API_KEY: envOr("GEMINI_API_KEY", "test-gemini-key"),
      OPENCLAW_BASE_URL: envOr("OPENCLAW_BASE_URL", "https://api.example.com"),
      OPENCLAW_API_KEY: envOr("OPENCLAW_API_KEY", "test-openclaw-key"),
      APP_ENCRYPTION_SECRET: envOr("APP_ENCRYPTION_SECRET", "test-app-encryption-secret"),
      INTERNAL_JOBS_SECRET: envOr("INTERNAL_JOBS_SECRET", "test-internal-jobs-secret"),
      UPSTASH_REDIS_REST_URL: envOr("UPSTASH_REDIS_REST_URL", "https://example.upstash.io"),
      UPSTASH_REDIS_REST_TOKEN: envOr("UPSTASH_REDIS_REST_TOKEN", "test-upstash-token"),
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
