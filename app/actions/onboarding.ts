"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const roleSchema = ["BUILDER", "FOUNDER", "INVESTOR", "ADMIN"] as const;

export type OnboardingResult = { success: true } | { success: false; error: string };

export async function completeOnboarding(role: string): Promise<OnboardingResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!roleSchema.includes(role as (typeof roleSchema)[number])) {
    return { success: false, error: "Invalid role" };
  }

  const shouldComplete = role === "ADMIN";

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      role: role as "BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN",
      onboardingComplete: shouldComplete,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/onboarding");
  return { success: true };
}
