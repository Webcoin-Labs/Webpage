"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createRewardSchema = z.object({
  userId: z.string().min(1, "Select a user"),
  label: z.string().min(1, "Label required"),
  amountText: z.string().min(1, "Amount required"),
  telegramHandle: z.string().optional(),
});

export type ClaimResult = { success: true } | { success: false; error: string };
export type CreateRewardResult = { success: true; id: string } | { success: false; error: string };

export async function claimReward(rewardId: string): Promise<ClaimResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const reward = await db.reward.findUnique({
    where: { id: rewardId, userId: session.user.id, status: "PENDING" },
  });
  if (!reward) return { success: false, error: "Reward not found or already claimed" };

  await db.reward.update({
    where: { id: rewardId },
    data: { status: "CLAIMED", claimedAt: new Date() },
  });
  revalidatePath("/app/rewards");
  return { success: true };
}

export async function createReward(formData: FormData): Promise<CreateRewardResult> {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const raw = {
    userId: formData.get("userId") as string,
    label: formData.get("label") as string,
    amountText: formData.get("amountText") as string,
    telegramHandle: (formData.get("telegramHandle") as string) || undefined,
  };
  const parsed = createRewardSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const reward = await db.reward.create({
    data: {
      userId: parsed.data.userId,
      label: parsed.data.label,
      amountText: parsed.data.amountText,
      externalHandle: parsed.data.telegramHandle ?? null,
      status: "PENDING",
    },
  });
  revalidatePath("/app/admin/rewards");
  return { success: true, id: reward.id };
}
