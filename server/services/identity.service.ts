import "server-only";

import { Prisma, WorkspaceType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { IdentityService } from "@/server/services/contracts";

export const identityService: IdentityService = {
  async getEnabledWorkspaces(userId) {
    const memberships = await prisma.userWorkspace.findMany({
      where: { userId, status: "ENABLED" },
      select: { workspace: true },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map((item) => item.workspace);
  },

  async setDefaultWorkspace(userId, workspace) {
    await prisma.$transaction([
      prisma.userWorkspace.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      prisma.userWorkspace.upsert({
        where: { userId_workspace: { userId, workspace } },
        create: { userId, workspace, status: "ENABLED", isDefault: true },
        update: { status: "ENABLED", isDefault: true },
      }),
    ]);
  },

  async saveOnboardingProgress(userId, step, payload = {}) {
    // Phased-compat persistence without introducing destructive migrations.
    await prisma.mutationAuditLog.create({
      data: {
        userId,
        action: "onboarding_progress",
        entityType: "OnboardingProgress",
        metadata: {
          step,
          payload: payload as Prisma.InputJsonValue,
          capturedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
  },
};

export function workspaceToPrimaryRole(workspace: WorkspaceType) {
  if (workspace === "FOUNDER_OS") return "FOUNDER" as const;
  if (workspace === "INVESTOR_OS") return "INVESTOR" as const;
  return "BUILDER" as const;
}
