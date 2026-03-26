"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";

const sendRequestSchema = z.object({
  toUserId: z.string().cuid().optional(),
  toUsername: z.string().trim().min(1).optional(),
  message: z.string().trim().max(600).optional(),
  source: z.string().trim().max(80).optional(),
});

function getConnectionRequestModel() {
  return (db as any).connectionRequest as any | undefined;
}

export async function sendConnectionRequest(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const connectionRequestModel = getConnectionRequestModel();
  if (!connectionRequestModel) return;

  const parsed = sendRequestSchema.safeParse({
    toUserId: (formData.get("toUserId") ?? "").toString() || undefined,
    toUsername: (formData.get("toUsername") ?? "").toString() || undefined,
    message: (formData.get("message") ?? "").toString() || undefined,
    source: (formData.get("source") ?? "").toString() || undefined,
  });
  if (!parsed.success) return;

  const lookupById = parsed.data.toUserId;
  const lookupByUsername = parsed.data.toUsername?.replace(/^@+/, "").toLowerCase();
  if (!lookupById && !lookupByUsername) return;

  const target = await db.user.findFirst({
    where: lookupById ? { id: lookupById } : { username: lookupByUsername },
    select: {
      id: true,
      publicProfileSettings: { select: { openToConnections: true } },
    },
  });
  if (!target) return;
  if (target.id === session.user.id) return;
  if (target.publicProfileSettings?.openToConnections === false) return;

  const [existingDirectLink, existingReverseLink] = await Promise.all([
    db.profileLink.findFirst({ where: { fromUserId: session.user.id, toUserId: target.id }, select: { id: true } }),
    db.profileLink.findFirst({ where: { fromUserId: target.id, toUserId: session.user.id }, select: { id: true } }),
  ]);
  if (existingDirectLink && existingReverseLink) return;

  const existingRequest = await connectionRequestModel.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: session.user.id,
        toUserId: target.id,
      },
    },
    select: { id: true, status: true },
  });

  if (existingRequest?.status === "PENDING" || existingRequest?.status === "ACCEPTED") return;

  if (existingRequest) {
    await connectionRequestModel.update({
      where: { id: existingRequest.id },
      data: {
        status: "PENDING",
        message: parsed.data.message || null,
        source: parsed.data.source || "profile",
        respondedAt: null,
      },
    });
  } else {
    await connectionRequestModel.create({
      data: {
        fromUserId: session.user.id,
        toUserId: target.id,
        message: parsed.data.message || null,
        source: parsed.data.source || "profile",
      },
    });
  }

  revalidatePath("/app/messages");
  revalidatePath("/app/notifications");
}

export async function respondConnectionRequest(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const connectionRequestModel = getConnectionRequestModel();
  if (!connectionRequestModel) return;

  const requestId = String(formData.get("requestId") ?? "");
  const decisionRaw = String(formData.get("decision") ?? "").toLowerCase();
  if (!requestId || !["accept", "decline"].includes(decisionRaw)) return;

  const request = await connectionRequestModel.findFirst({
    where: { id: requestId, toUserId: session.user.id, status: "PENDING" },
    select: { id: true, fromUserId: true, toUserId: true },
  });
  if (!request) return;

  if (decisionRaw === "accept") {
    await connectionRequestModel.update({
      where: { id: request.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    await db.profileLink.upsert({
      where: { fromUserId_toUserId: { fromUserId: request.fromUserId, toUserId: request.toUserId } },
      update: {},
      create: { fromUserId: request.fromUserId, toUserId: request.toUserId, label: "connection" },
    });
    await db.profileLink.upsert({
      where: { fromUserId_toUserId: { fromUserId: request.toUserId, toUserId: request.fromUserId } },
      update: {},
      create: { fromUserId: request.toUserId, toUserId: request.fromUserId, label: "connection" },
    });
  } else {
    await connectionRequestModel.update({
      where: { id: request.id },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
  }

  revalidatePath("/app/messages");
  revalidatePath("/app/notifications");
  revalidatePath("/app/profile");
}

export async function cancelConnectionRequest(formData: FormData): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return;

  const connectionRequestModel = getConnectionRequestModel();
  if (!connectionRequestModel) return;

  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId) return;

  await connectionRequestModel.updateMany({
    where: { id: requestId, fromUserId: session.user.id, status: "PENDING" },
    data: { status: "CANCELED", respondedAt: new Date() },
  });

  revalidatePath("/app/messages");
  revalidatePath("/app/notifications");
}
