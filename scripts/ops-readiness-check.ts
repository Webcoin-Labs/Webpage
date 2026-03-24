import fs from "fs";
import path from "path";

function loadDotEnv() {
  const envPaths = [".env", ".env.local"].map((filename) => path.join(process.cwd(), filename));
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key] && value) process.env[key] = value;
    }
  }
}

type Gate = {
  name: string;
  requiredEnv?: string[];
  check?: () => { ok: boolean; detail: string };
};

const gates: Gate[] = [
  {
    name: "monitoring_prereq",
    requiredEnv: ["NEXTAUTH_SECRET", "APP_ENCRYPTION_SECRET"],
  },
  {
    name: "job_security",
    requiredEnv: ["INTERNAL_JOBS_SECRET"],
  },
  {
    name: "rate_limit_backend",
    requiredEnv: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  },
  {
    name: "storage_backend",
    check: () => {
      const provider = process.env.STORAGE_PROVIDER ?? "local";
      if (provider === "local") {
        return { ok: false, detail: "STORAGE_PROVIDER is local; production should use managed object storage." };
      }
      return { ok: true, detail: `Storage provider: ${provider}` };
    },
  },
  {
    name: "rollback_prereq_migrations",
    requiredEnv: ["DATABASE_URL"],
  },
];

function envPresent(name: string) {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0);
}

function runGate(gate: Gate) {
  const missing = (gate.requiredEnv ?? []).filter((envName) => !envPresent(envName));
  if (missing.length > 0) {
    return { ok: false, detail: `Missing env: ${missing.join(", ")}` };
  }
  if (gate.check) return gate.check();
  return { ok: true, detail: "OK" };
}

function main() {
  loadDotEnv();
  let failed = 0;
  for (const gate of gates) {
    const result = runGate(gate);
    if (!result.ok) failed += 1;
    console.log(`[${result.ok ? "PASS" : "FAIL"}] ${gate.name}: ${result.detail}`);
  }

  console.log(`\nOps readiness summary: ${gates.length} gates, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main();
