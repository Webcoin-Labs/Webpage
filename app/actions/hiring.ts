"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { HiringInterestStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const hiringInterestSchema = z.object({
  founderId: z.string().cuid("Invalid founder identifier"),
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  skills: z.string().trim().min(2, "Skills are required"),
  portfolioUrl: z.string().trim().url("Portfolio URL must be valid").optional().or(z.literal("")),
  message: z.string().trim().min(12, "Message must be at least 12 characters").max(1200, "Message is too long"),
});

type HiringResult = { success: true; id: string } | { success: false; error: string };

export async function submitHiringInterest(formData: FormData): Promise<HiringResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!["BUILDER", "ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Only builders can submit hiring interest." };
  }

  const parsed = hiringInterestSchema.safeParse({
    founderId: formData.get("founderId"),
    name: formData.get("name"),
    email: formData.get("email"),
    skills: formData.get("skills"),
    portfolioUrl: formData.get("portfolioUrl"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  if (parsed.data.founderId === session.user.id) {
    return { success: false, error: "You cannot submit hiring interest to your own account." };
  }

  const rl = await rateLimitAsync(
    rateLimitKey(`${session.user.id}:${parsed.data.founderId}`, "hiring-interest"),
    8,
    60_000
  );
  if (!rl.ok) return { success: false, error: "Too many submissions. Please try again shortly." };

  const founder = await db.founderProfile.findUnique({
    where: { userId: parsed.data.founderId },
    select: { id: true, isHiring: true, companyName: true, user: { select: { name: true } } },
  });
  if (!founder) return { success: false, error: "Founder profile not found." };
  if (!founder.isHiring) return { success: false, error: "This founder is not actively hiring right now." };

  const existingSubmission = await db.hiringInterest.findFirst({
    where: {
      founderId: parsed.data.founderId,
      builderUserId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (existingSubmission) {
    const hoursSinceLastSubmission =
      (Date.now() - new Date(existingSubmission.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSubmission < 72) {
      return { success: false, error: "You already submitted recently. Please wait before sending another interest." };
    }
  }

  const created = await db.hiringInterest.create({
    data: {
      founderId: parsed.data.founderId,
      founderProfileId: founder.id,
      builderUserId: session.user.id,
      name: parsed.data.name,
      email: parsed.data.email,
      skills: parsed.data.skills,
      portfolioUrl: parsed.data.portfolioUrl || null,
      message: parsed.data.message,
      source: "DASHBOARD",
      founderNameSnapshot: founder.user.name ?? null,
      companyNameSnapshot: founder.companyName ?? null,
      status: "NEW",
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/hiring");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/hiring-interests");
  return { success: true, id: created.id };
}

export async function updateHiringInterestStatus(id: string, status: HiringInterestStatus) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsedStatus = z.enum(["NEW", "REVIEWING", "CONTACTED", "ARCHIVED"]).safeParse(status);
  if (!parsedStatus.success) throw new Error("Invalid status");

  const interest = await db.hiringInterest.findUnique({
    where: { id },
    select: { founderId: true },
  });
  if (!interest) throw new Error("Submission not found");
  if (session.user.role !== "ADMIN" && session.user.id !== interest.founderId) {
    throw new Error("Unauthorized");
  }

  try {
    await db.hiringInterest.update({
      where: { id },
      data: { status: parsedStatus.data },
    });
  } catch (error) {
    logger.error({
      scope: "hiring.updateStatus",
      message: "Failed to update hiring interest status.",
      error,
      data: { id, status: parsedStatus.data, actorId: session.user.id },
    });
    throw new Error("Could not update hiring status.");
  }

  revalidatePath("/app");
  revalidatePath("/app/hiring");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/hiring-interests");
}
