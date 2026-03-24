import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { decryptSecret } from "@/lib/security/crypto";
import { db } from "@/server/db/client";
import { openClawListWorkspaces, OpenClawApiError, openClawSyncThreads } from "@/lib/openclaw/client";

function isAuthorized(request: Request) {
  const expected = process.env.INTERNAL_JOBS_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("x-webcoinlabs-job-secret");
  if (!provided) return false;
  const eb = Buffer.from(expected, "utf-8");
  const pb = Buffer.from(provided, "utf-8");
  if (eb.length !== pb.length) return false;
  try {
    return timingSafeEqual(eb, pb);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const connections = await db.openClawConnection.findMany({
    where: { status: "CONNECTED" },
    include: { workspaces: { where: { isSelected: true } } },
    take: 50,
  });
  let syncedConnections = 0;
  for (const connection of connections) {
    const token = decryptSecret(connection.encryptedAccessToken);
    if (!token) continue;
    try {
      const externalWorkspaces = await openClawListWorkspaces(token);
      for (const externalWorkspace of externalWorkspaces) {
        await db.telegramWorkspace.upsert({
          where: { connectionId_externalId: { connectionId: connection.id, externalId: externalWorkspace.id } },
          create: {
            connectionId: connection.id,
            externalId: externalWorkspace.id,
            workspaceType: externalWorkspace.type ?? "GROUP",
            title: externalWorkspace.title ?? null,
            username: externalWorkspace.username ?? null,
            isSelected: true,
          },
          update: {
            workspaceType: externalWorkspace.type ?? "GROUP",
            title: externalWorkspace.title ?? null,
            username: externalWorkspace.username ?? null,
            lastSyncedAt: new Date(),
          },
        });
      }
      const selected = connection.workspaces[0] ?? (await db.telegramWorkspace.findFirst({ where: { connectionId: connection.id, isSelected: true } }));
      if (!selected) continue;
      const sync = await openClawSyncThreads(token, selected.externalId);
      for (const thread of sync.threads) {
        const dbThread = await db.telegramThread.upsert({
          where: { workspaceId_externalThreadId: { workspaceId: selected.id, externalThreadId: thread.id } },
          create: { workspaceId: selected.id, externalThreadId: thread.id, title: thread.title ?? null, lastMessageAt: thread.lastMessageAt ? new Date(thread.lastMessageAt) : null },
          update: { title: thread.title ?? null, lastMessageAt: thread.lastMessageAt ? new Date(thread.lastMessageAt) : null },
        });
        const messages = (thread.messages ?? []).map((message, idx) => ({
          threadId: dbThread.id,
          externalMessageId: message.id ?? `${thread.id}-${message.sentAt ?? "na"}-${idx}`,
          direction: message.direction ?? "INBOUND",
          text: message.text ?? "",
          sentAt: message.sentAt ? new Date(message.sentAt) : null,
          recipientUserId: connection.userId,
        }));
        if (messages.length > 0) {
          await db.telegramMessage.createMany({
            data: messages,
            skipDuplicates: true,
          });
        }
      }
      await db.openClawConnection.update({ where: { id: connection.id }, data: { lastSyncedAt: new Date() } });
      syncedConnections += 1;
    } catch (error) {
      const status = error instanceof OpenClawApiError ? error.status : undefined;
      await db.openClawConnection.update({
        where: { id: connection.id },
        data: { status: "ERROR", lastSyncedAt: new Date() },
      });
      if (status && status >= 500) continue;
    }
  }
  return NextResponse.json({ success: true, syncedConnections });
}
