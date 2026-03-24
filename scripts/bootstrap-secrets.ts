import crypto from "crypto";
import fs from "fs";
import path from "path";

const targetPath = path.join(process.cwd(), ".env.local");
const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, "utf8") : "";
const lines = existing.split(/\r?\n/).filter(Boolean);

function hasKey(key: string) {
  return lines.some((line) => line.startsWith(`${key}=`));
}

function addSecret(key: string, bytes = 32) {
  if (hasKey(key)) return false;
  const value = crypto.randomBytes(bytes).toString("hex");
  lines.push(`${key}=${value}`);
  return true;
}

const created: string[] = [];
if (addSecret("NEXTAUTH_SECRET", 32)) created.push("NEXTAUTH_SECRET");
if (addSecret("APP_ENCRYPTION_SECRET", 32)) created.push("APP_ENCRYPTION_SECRET");
if (addSecret("INTERNAL_JOBS_SECRET", 32)) created.push("INTERNAL_JOBS_SECRET");

if (created.length > 0) {
  fs.writeFileSync(targetPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Created secrets in .env.local: ${created.join(", ")}`);
} else {
  console.log("No new secrets were needed. Existing values already present.");
}
