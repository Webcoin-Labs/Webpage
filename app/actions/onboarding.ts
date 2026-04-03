"use server";

import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { revalidatePath } from "next/cache";

const roleSchema = ["BUILDER", "FOUNDER", "INVESTOR", "ADMIN"] as const;

export type OnboardingResult = { success: true } | { success: false; error: string };

export async function completeOnboarding(role: string): Promise<OnboardingResult> {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!roleSchema.includes(role as (typeof roleSchema)[number])) {
    return { success: false, error: "Invalid role" };
  }
  const requestedRole = role as (typeof roleSchema)[number];
  if (requestedRole === "ADMIN" && session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized role selection." };
  }

  const shouldComplete = requestedRole === "ADMIN";

  await db.user.update({
    where: { id: session.user.id },
    data: {
      role: requestedRole,
      onboardingComplete: shouldComplete,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/onboarding");
  return { success: true };
}

