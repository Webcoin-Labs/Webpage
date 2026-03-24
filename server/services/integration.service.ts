import "server-only";

import type { IntegrationService } from "@/server/services/contracts";
import { prisma } from "@/lib/prisma";

export const integrationService: IntegrationService = {
  async connectProvider({ userId, provider }) {
    await prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider } },
      create: {
        userId,
        provider,
        status: "CONNECTED",
      },
      update: {
        status: "CONNECTED",
      },
    });
  },
};

