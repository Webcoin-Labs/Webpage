import "server-only";

import type { IntegrationProvider } from "@prisma/client";
import { db } from "@/server/db/client";
import { decryptSecret } from "@/lib/security/crypto";
import { writeAuditLog } from "@/lib/audit";
import { logError } from "@/lib/telemetry";

type SyncInput = {
  userId?: string;
  limit?: number;
};

type SyncStats = {
  checked: number;
  synced: number;
  failed: number;
  skipped: number;
};

const OAUTH_SYNC_PROVIDERS: IntegrationProvider[] = [
  "GITHUB",
  "GMAIL",
  "GOOGLE_CALENDAR",
  "NOTION",
  "JIRA",
  "CALENDLY",
];

async function providerHealthcheck(provider: IntegrationProvider, accessToken: string) {
  if (provider === "GITHUB") {
    const response = await fetch("https://api.github.com/user", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`GitHub healthcheck failed (${response.status})`);
    return;
  }

  if (provider === "GMAIL" || provider === "GOOGLE_CALENDAR") {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Google healthcheck failed (${response.status})`);
    return;
  }

  if (provider === "NOTION") {
    const response = await fetch("https://api.notion.com/v1/users/me", {
      headers: {
        authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Notion healthcheck failed (${response.status})`);
    return;
  }

  if (provider === "JIRA") {
    const response = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Jira healthcheck failed (${response.status})`);
    return;
  }

  if (provider === "CALENDLY") {
    const response = await fetch("https://api.calendly.com/users/me", {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Calendly healthcheck failed (${response.status})`);
    return;
  }
}

export async function syncConnectedIntegrations(input: SyncInput = {}): Promise<SyncStats> {
  const limit = input.limit ?? 100;
  const connections = await db.integrationConnection.findMany({
    where: {
      status: { in: ["CONNECTED", "ERROR"] },
      provider: { in: OAUTH_SYNC_PROVIDERS },
      ...(input.userId ? { userId: input.userId } : {}),
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });

  const stats: SyncStats = { checked: 0, synced: 0, failed: 0, skipped: 0 };

  for (const connection of connections) {
    stats.checked += 1;
    const accessToken = decryptSecret(connection.encryptedToken);
    if (!accessToken) {
      stats.skipped += 1;
      continue;
    }

    try {
      await providerHealthcheck(connection.provider, accessToken);
      await db.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: "CONNECTED",
          lastSyncedAt: new Date(),
        },
      });
      await writeAuditLog({
        userId: connection.userId,
        action: "integration_sync_success",
        entityType: "IntegrationConnection",
        entityId: connection.id,
        metadata: {
          provider: connection.provider,
          status: "CONNECTED",
        },
      });
      stats.synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Integration sync failed";
      await db.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: "ERROR",
          lastSyncedAt: new Date(),
        },
      });
      await writeAuditLog({
        userId: connection.userId,
        action: "integration_sync_error",
        entityType: "IntegrationConnection",
        entityId: connection.id,
        metadata: {
          provider: connection.provider,
          status: "ERROR",
          message,
        },
      });
      logError("integration_sync_failed", {
        provider: connection.provider,
        userId: connection.userId,
        connectionId: connection.id,
        message,
      });
      stats.failed += 1;
    }
  }

  return stats;
}
