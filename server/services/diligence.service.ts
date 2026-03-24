import "server-only";

import { prisma } from "@/lib/prisma";
import type { DiligenceService } from "@/server/services/contracts";

export const diligenceService: DiligenceService = {
  async listDiligenceMemos({ ventureId, investorUserId }) {
    // Phased-compat adapter until canonical diligence tables are introduced.
    const logs = await prisma.mutationAuditLog.findMany({
      where: {
        entityType: "DueDiligenceMemo",
        ...(ventureId ? { entityId: ventureId } : {}),
        ...(investorUserId ? { userId: investorUserId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return logs.map((log) => ({
      id: log.id,
      title: (log.metadata as Record<string, unknown> | null)?.title as string | undefined ?? "Diligence memo",
      status: ((log.metadata as Record<string, unknown> | null)?.status as string | undefined) ?? "under_review",
      updatedAt: log.createdAt,
    }));
  },
};

