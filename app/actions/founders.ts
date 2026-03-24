"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";

const startupRatingSchema = z.object({
  startupId: z.string().cuid("Invalid startup."),
  score: z.coerce.number().int().min(1).max(5),
  note: z.string().max(400).optional().or(z.literal("")),
});

export type StartupRatingResult = { success: true } | { success: false; error: string };

export async function rateStartup(formData: FormData): Promise<StartupRatingResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated." };
  if (!["FOUNDER", "ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Only founders can rate startups." };
  }

  const limiter = await rateLimitAsync(rateLimitKey(session.user.id, "startup-rate"), 20, 60_000);
  if (!limiter.ok) return { success: false, error: "Too many rating actions. Please retry shortly." };

  const parsed = startupRatingSchema.safeParse({
    startupId: String(formData.get("startupId") ?? ""),
    score: String(formData.get("score") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid rating input." };
  }

  const startup = await db.startup.findUnique({
    where: { id: parsed.data.startupId },
    select: { id: true, founderId: true, slug: true },
  });
  if (!startup) return { success: false, error: "Startup not found." };

  if (session.user.role !== "ADMIN" && startup.founderId === session.user.id) {
    return { success: false, error: "You cannot rate your own startup." };
  }

  await db.startupRating.upsert({
    where: {
      startupId_reviewerId: {
        startupId: startup.id,
        reviewerId: session.user.id,
      },
    },
    create: {
      startupId: startup.id,
      reviewerId: session.user.id,
      score: parsed.data.score,
      note: parsed.data.note?.trim() || null,
    },
    update: {
      score: parsed.data.score,
      note: parsed.data.note?.trim() || null,
    },
  });

  revalidatePath("/app/founders");
  revalidatePath("/startups");
  revalidatePath(`/startups/${startup.slug ?? startup.id}`);
  return { success: true };
}
