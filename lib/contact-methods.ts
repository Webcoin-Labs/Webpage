import "server-only";

import { ContactMethodType } from "@prisma/client";
import { normalizeTelegramUrl } from "@/lib/contact-visibility";

export type ContactMethodView = {
  type: ContactMethodType;
  label: string;
  href: string;
};

function normalizeByType(type: ContactMethodType, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (type === "EMAIL") return `mailto:${trimmed}`;
  if (type === "TELEGRAM") return normalizeTelegramUrl(trimmed);
  if (type === "X") {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    return `https://x.com/${trimmed.replace("@", "")}`;
  }
  if (type === "LINKEDIN") return trimmed;
  if (type === "DISCORD") return `https://discord.com/users/${trimmed.replace("@", "")}`;
  return trimmed;
}

export function mapPublicContactMethods(
  methods: Array<{ type: ContactMethodType; label: string | null; value: string; isPublic: boolean; isEnabled: boolean }>,
) {
  return methods
    .filter((method) => method.isEnabled && method.isPublic)
    .map((method) => {
      const href = normalizeByType(method.type, method.value);
      if (!href) return null;
      return {
        type: method.type,
        label: method.label ?? method.type,
        href,
      } satisfies ContactMethodView;
    })
    .filter((item): item is ContactMethodView => Boolean(item));
}
