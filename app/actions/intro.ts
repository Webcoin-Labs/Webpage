"use server";

import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { revalidatePath } from "next/cache";
import type { IntroType } from "@prisma/client";

const optionalPositiveInt = (max: number) =>
  z.preprocess((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  }, z.number().int().min(1).max(max).optional());

const kolPayloadSchema = z.object({
  category: z.string().min(1, "Category required"),
  budgetRange: z.string().min(1, "Budget range required"),
  campaignGoal: z.string().min(1, "Campaign goal required"),
  priorityTier: z.enum(["STANDARD", "PREMIUM"]).optional(),
  targetRegion: z.string().max(120).optional().or(z.literal("")),
  targetKolCount: optionalPositiveInt(200),
  timelineDays: optionalPositiveInt(180),
});

const vcPayloadSchema = z.object({
  category: z.string().min(1, "Category required"),
  stage: z.string().min(1, "Stage required"),
  region: z.string().min(1, "Region required"),
});

const contextSchema = z.object({
  sourceProjectId: z.string().cuid().optional().or(z.literal("")),
  targetUserId: z.string().cuid().optional().or(z.literal("")),
  targetPartnerId: z.string().cuid().optional().or(z.literal("")),
  contextSummary: z.string().max(700).optional().or(z.literal("")),
});

export type IntroResult = { success: true; id: string } | { success: false; error: string };

export async function createIntroRequest(formData: FormData): Promise<IntroResult> {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (session.user.role !== "FOUNDER" && session.user.role !== "ADMIN") {
    return { success: false, error: "Only founders can request intros" };
  }

  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "intro"), 5, 60_000);
  if (!rl.ok) return { success: false, error: "Too many requests. Please try again in a minute." };

  const type = formData.get("type") as string;
  if (type !== "KOL" && type !== "VC") return { success: false, error: "Invalid type" };

  const payload = type === "KOL"
      ? kolPayloadSchema.safeParse({
        category: formData.get("category"),
        budgetRange: formData.get("budgetRange"),
        campaignGoal: formData.get("campaignGoal"),
        priorityTier: formData.get("priorityTier"),
        targetRegion: formData.get("targetRegion"),
        targetKolCount: formData.get("targetKolCount"),
        timelineDays: formData.get("timelineDays"),
      })
    : vcPayloadSchema.safeParse({
        category: formData.get("category"),
        stage: formData.get("stage"),
        region: formData.get("region"),
      });

  if (!payload.success) {
    return { success: false, error: payload.error.errors[0]?.message ?? "Invalid input" };
  }

  const parsedContext = contextSchema.safeParse({
    sourceProjectId: formData.get("sourceProjectId"),
    targetUserId: formData.get("targetUserId"),
    targetPartnerId: formData.get("targetPartnerId"),
    contextSummary: formData.get("contextSummary"),
  });
  if (!parsedContext.success) {
    return { success: false, error: parsedContext.error.errors[0]?.message ?? "Invalid context fields" };
  }

  const sourceProjectId = parsedContext.data.sourceProjectId || null;
  const targetUserId = parsedContext.data.targetUserId || null;
  const targetPartnerId = parsedContext.data.targetPartnerId || null;
  const contextSummary = parsedContext.data.contextSummary || null;

  if (sourceProjectId) {
    const project = await db.project.findFirst({
      where: session.user.role === "ADMIN" ? { id: sourceProjectId } : { id: sourceProjectId, ownerUserId: session.user.id },
      select: { id: true },
    });
    if (!project) return { success: false, error: "Invalid source project" };
  }
  if (targetUserId) {
    const targetBuilder = await db.builderProfile.findUnique({
      where: { userId: targetUserId },
      select: { userId: true, publicVisible: true },
    });
    if (!targetBuilder) return { success: false, error: "Selected builder does not exist" };
  }
  if (targetPartnerId) {
    const partner = await db.partner.findUnique({ where: { id: targetPartnerId }, select: { id: true } });
    if (!partner) return { success: false, error: "Selected partner does not exist" };
  }

  const intro = await db.introRequest.create({
    data: {
      founderId: session.user.id,
      type: type as IntroType,
      requestPayload: payload.data,
      status: "PENDING",
      sourceProjectId,
      targetUserId,
      targetPartnerId,
      contextSummary,
    },
  });

  revalidatePath("/app/intros");
  return { success: true, id: intro.id };
}

