import "server-only";

import { prisma } from "@/lib/prisma";
import type { AdminRoutingService } from "@/server/services/contracts";

export const adminRoutingService: AdminRoutingService = {
  async assignBuilderToFounder({ adminUserId, founderUserId, builderUserId, note }) {
    await prisma.mutationAuditLog.create({
      data: {
        userId: adminUserId,
        action: "admin_assign_builder_to_founder",
        entityType: "AdminRouting",
        entityId: `${founderUserId}:${builderUserId}`,
        metadata: {
          founderUserId,
          builderUserId,
          note: note ?? null,
        },
      },
    });
  },

  async assignFounderToInvestor({ adminUserId, founderUserId, investorUserId, note }) {
    await prisma.mutationAuditLog.create({
      data: {
        userId: adminUserId,
        action: "admin_assign_founder_to_investor",
        entityType: "AdminRouting",
        entityId: `${founderUserId}:${investorUserId}`,
        metadata: {
          founderUserId,
          investorUserId,
          note: note ?? null,
        },
      },
    });
  },
};

