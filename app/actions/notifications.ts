"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";

const roleValues = ["BUILDER", "FOUNDER", "INVESTOR", "ADMIN"] as const;

const createNotificationSchema = z.object({
  title: z.string().min(3).max(120),
  message: z.string().min(6).max(2000),
  featureUrl: z.string().url().optional().or(z.literal("")),
  targetRoles: z.array(z.enum(roleValues)).min(1),
});

type NotificationResult = { success: true } | { success: false; error: string };

export async function createBroadcastNotification(formData: FormData): Promise<NotificationResult> {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN" || !session.user.id) return { success: false, error: "Unauthorized." };

  const parsed = createNotificationSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    message: String(formData.get("message") ?? ""),
    featureUrl: String(formData.get("featureUrl") ?? ""),
    targetRoles: formData
      .getAll("targetRoles")
      .map((value) => String(value))
      .filter((value) => roleValues.includes(value as (typeof roleValues)[number])),
  });

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid notification." };

  await db.notification.create({
    data: {
      title: parsed.data.title.trim(),
      message: parsed.data.message.trim(),
      featureUrl: parsed.data.featureUrl?.trim() || null,
      targetRoles: parsed.data.targetRoles as Role[],
      createdById: session.user.id,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/notifications");
  revalidatePath("/app/admin/notifications");
  return { success: true };
}

export async function markNotificationRead(notificationId: string): Promise<NotificationResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
    select: { id: true },
  });
  if (!notification) return { success: false, error: "Notification not found." };

  await db.notificationRead.upsert({
    where: {
      notificationId_userId: {
        notificationId,
        userId: session.user.id,
      },
    },
    create: {
      notificationId,
      userId: session.user.id,
    },
    update: {
      readAt: new Date(),
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/notifications");
  return { success: true };
}

export async function markAllNotificationsRead(): Promise<NotificationResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const notifications = await db.notification.findMany({
    where: {
      targetRoles: {
        has: session.user.role as Role,
      },
    },
    select: { id: true },
    take: 200,
  });

  if (notifications.length === 0) return { success: true };

  await db.notificationRead.createMany({
    data: notifications.map((item) => ({
      notificationId: item.id,
      userId: session.user.id,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/app");
  revalidatePath("/app/notifications");
  return { success: true };
}
