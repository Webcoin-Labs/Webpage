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

type CheckResult = {
  name: string;
  status: "pass" | "fail" | "skip";
  detail: string;
};

async function checkGithub(): Promise<CheckResult> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !secret) {
    return { name: "github_oauth_config", status: "fail", detail: "GITHUB_CLIENT_ID/SECRET missing." };
  }

  const token = process.env.CERT_GITHUB_TOKEN;
  if (!token) {
    return { name: "github_live_probe", status: "skip", detail: "CERT_GITHUB_TOKEN not provided." };
  }

  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "webcoinlabs-integration-certifier",
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    return { name: "github_live_probe", status: "fail", detail: `GitHub API probe failed (${res.status}).` };
  }
  return { name: "github_live_probe", status: "pass", detail: "GitHub API token probe succeeded." };
}

async function checkGoogle(): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !secret) {
    out.push({ name: "google_oauth_config", status: "fail", detail: "GOOGLE_CLIENT_ID/SECRET missing." });
    return out;
  }
  out.push({ name: "google_oauth_config", status: "pass", detail: "Google OAuth credentials present." });

  const token = process.env.CERT_GOOGLE_ACCESS_TOKEN;
  if (!token) {
    out.push({ name: "gmail_live_probe", status: "skip", detail: "CERT_GOOGLE_ACCESS_TOKEN not provided." });
    out.push({ name: "calendar_live_probe", status: "skip", detail: "CERT_GOOGLE_ACCESS_TOKEN not provided." });
    return out;
  }

  const [gmailRes, calendarRes] = await Promise.all([
    fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  out.push({
    name: "gmail_live_probe",
    status: gmailRes.ok ? "pass" : "fail",
    detail: gmailRes.ok ? "Gmail API probe succeeded." : `Gmail probe failed (${gmailRes.status}).`,
  });
  out.push({
    name: "calendar_live_probe",
    status: calendarRes.ok ? "pass" : "fail",
    detail: calendarRes.ok ? "Calendar API probe succeeded." : `Calendar probe failed (${calendarRes.status}).`,
  });
  return out;
}

function checkWalletConfig(): CheckResult {
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const appEncryptionSecret = process.env.APP_ENCRYPTION_SECRET;
  if (!nextAuthSecret || !appEncryptionSecret) {
    return {
      name: "wallet_identity_security_prereq",
      status: "fail",
      detail: "NEXTAUTH_SECRET or APP_ENCRYPTION_SECRET missing.",
    };
  }
  return {
    name: "wallet_identity_security_prereq",
    status: "pass",
    detail: "Wallet auth/linking security prerequisites present.",
  };
}

async function main() {
  loadDotEnv();
  const results: CheckResult[] = [];
  results.push(await checkGithub());
  results.push(...(await checkGoogle()));
  results.push(checkWalletConfig());

  let failCount = 0;
  for (const result of results) {
    if (result.status === "fail") failCount += 1;
    console.log(`[${result.status.toUpperCase()}] ${result.name}: ${result.detail}`);
  }

  console.log(`\nSummary: ${results.length} checks, ${failCount} failed.`);
  if (failCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Integration certification failed:", error);
  process.exitCode = 1;
});
