import "server-only";

import { Role, VisibilityAccessLevel, VisibilityEntityType } from "@prisma/client";
import { db } from "@/server/db/client";

type ViewerContext = {
  userId?: string | null;
  role?: Role | null;
};

function precedence(level: VisibilityAccessLevel) {
  switch (level) {
    case "PRIVATE":
      return 4;
    case "INTERNAL":
      return 3;
    case "SHARED":
      return 2;
    case "PUBLIC":
      return 1;
    default:
      return 0;
  }
}

function allowsShared(rule: { allowedUserId: string | null; appliesToRole: Role | null }, viewer: ViewerContext) {
  if (!viewer.userId && !viewer.role) return false;
  if (rule.allowedUserId && viewer.userId && rule.allowedUserId === viewer.userId) return true;
  if (rule.appliesToRole && viewer.role && rule.appliesToRole === viewer.role) return true;
  return false;
}

export async function canViewerAccessEntity(
  entityType: VisibilityEntityType,
  entityId: string,
  viewer: ViewerContext,
) {
  const rules = await db.visibilityRule.findMany({
    where: {
      entityType,
      entityId,
      isActive: true,
    },
    select: {
      accessLevel: true,
      allowedUserId: true,
      appliesToRole: true,
    },
  });

  if (rules.length === 0) return true;

  const sorted = rules.sort((a, b) => precedence(b.accessLevel) - precedence(a.accessLevel));
  const strongest = sorted[0];

  if (strongest.accessLevel === "PRIVATE") {
    if (strongest.allowedUserId && viewer.userId && strongest.allowedUserId === viewer.userId) return true;
    return false;
  }

  if (strongest.accessLevel === "INTERNAL") {
    return viewer.role === "ADMIN";
  }

  if (strongest.accessLevel === "SHARED") {
    return sorted.some((rule) => rule.accessLevel === "SHARED" && allowsShared(rule, viewer));
  }

  return true;
}
