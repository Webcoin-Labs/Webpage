import "server-only";

import { prisma } from "@/lib/prisma";
import type { ApplicationService } from "@/server/services/contracts";

export const applicationService: ApplicationService = {
  async createInvestorApplication(input) {
    const record = await prisma.investorApplication.create({
      data: {
        founderUserId: input.founderUserId,
        investorUserId: input.investorUserId,
        ventureId: input.ventureId,
        pitchDeckId: input.pitchDeckId ?? null,
        note: input.note ?? null,
      },
      select: { id: true },
    });
    return record;
  },
};

