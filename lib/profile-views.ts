import "server-only";

import { Role } from "@prisma/client";
import { db } from "@/server/db/client";

const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function trackProfileView(input: {
  viewerUserId?: string | null;
  viewedUserId: string;
  source?: string;
  roleContext?: Role | null;
}) {
  const viewerUserId = input.viewerUserId ?? null;
  if (!viewerUserId || viewerUserId === input.viewedUserId) return;

  const since = new Date(Date.now() - VIEW_COOLDOWN_MS);
  const existing = await db.profileView.findFirst({
    where: {
      viewerUserId,
      viewedUserId: input.viewedUserId,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (existing) return;

  await db.profileView.create({
    data: {
      viewerUserId,
      viewedUserId: input.viewedUserId,
      source: input.source ?? "direct",
      roleContext: input.roleContext ?? null,
    },
  });
}

export async function getProfileViewInsights(userId: string, take = 12) {
  const [count, recent] = await Promise.all([
    db.profileView.count({
      where: { viewedUserId: userId, viewerUserId: { not: null } },
    }),
    db.profileView.findMany({
      where: { viewedUserId: userId, viewerUserId: { not: null } },
      include: { viewer: { select: { id: true, name: true, image: true, username: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);

  return {
    totalViews: count,
    recentViewers: recent.filter((item) => item.viewer).map((item) => ({
      viewedAt: item.createdAt,
      source: item.source ?? "direct",
      viewer: item.viewer!,
    })),
  };
}
