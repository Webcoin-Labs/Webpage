import "server-only";

import { prisma } from "@/lib/prisma";
import type { VentureService } from "@/server/services/contracts";

export const ventureService: VentureService = {
  async getFounderVentures(userId) {
    const ventures = await prisma.venture.findMany({
      where: { ownerUserId: userId },
      select: {
        id: true,
        name: true,
        stage: true,
        chainEcosystem: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return ventures;
  },
};

