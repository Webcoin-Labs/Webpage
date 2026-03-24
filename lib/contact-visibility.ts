import "server-only";

import { Role } from "@prisma/client";

export function canViewerAccessInvestorOnlyContacts(role?: Role | null) {
  return role === "INVESTOR" || role === "ADMIN";
}

export function normalizeTelegramUrl(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://t.me/${trimmed.replace("@", "")}`;
}

export function readTelegramFromSocialLinks(socialLinks: unknown) {
  if (!socialLinks || typeof socialLinks !== "object") return null;
  const telegram = (socialLinks as Record<string, unknown>).telegram;
  if (typeof telegram !== "string") return null;
  const trimmed = telegram.trim();
  return trimmed.length > 0 ? trimmed : null;
}
