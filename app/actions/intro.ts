"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitKey } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";
import type { IntroType } from "@prisma/client";

const kolPayloadSchema = z.object({
  category: z.string().min(1, "Category required"),
  budgetRange: z.string().min(1, "Budget range required"),
  campaignGoal: z.string().min(1, "Campaign goal required"),
});

const vcPayloadSchema = z.object({
  category: z.string().min(1, "Category required"),
  stage: z.string().min(1, "Stage required"),
  region: z.string().min(1, "Region required"),
});

export type IntroResult = { success: true; id: string } | { success: false; error: string };

export async function createIntroRequest(formData: FormData): Promise<IntroResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "FOUNDER" && session.user.role !== "ADMIN") {
    return { success: false, error: "Only founders can request intros" };
  }

  const rl = rateLimit(rateLimitKey(session.user.id, "intro"), 5, 60_000);
  if (!rl.ok) return { success: false, error: "Too many requests. Please try again in a minute." };

  const type = formData.get("type") as string;
  if (type !== "KOL" && type !== "VC") return { success: false, error: "Invalid type" };

  const payload = type === "KOL"
    ? kolPayloadSchema.safeParse({
        category: formData.get("category"),
        budgetRange: formData.get("budgetRange"),
        campaignGoal: formData.get("campaignGoal"),
      })
    : vcPayloadSchema.safeParse({
        category: formData.get("category"),
        stage: formData.get("stage"),
        region: formData.get("region"),
      });

  if (!payload.success) {
    return { success: false, error: payload.error.errors[0]?.message ?? "Invalid input" };
  }

  const intro = await prisma.introRequest.create({
    data: {
      founderId: session.user.id,
      type: type as IntroType,
      requestPayload: payload.data,
      status: "PENDING",
    },
  });

  revalidatePath("/app/intros");
  return { success: true, id: intro.id };
}
