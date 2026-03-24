import "server-only";

import crypto from "crypto";
import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const raw = env.APP_ENCRYPTION_SECRET || env.NEXTAUTH_SECRET;
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plainText: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(cipherText: string | null | undefined) {
  if (!cipherText) return null;
  const [ivHex, tagHex, payloadHex] = cipherText.split(":");
  if (!ivHex || !tagHex || !payloadHex) return null;
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(payloadHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}
