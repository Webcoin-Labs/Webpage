import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";

type AuditInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
};

export async function writeAuditLog(input: AuditInput) {
  await db.mutationAuditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata === undefined ? Prisma.JsonNull : (input.metadata as Prisma.InputJsonValue),
    },
  });
}

