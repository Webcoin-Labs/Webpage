"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitKey } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
});

export type DeckWaitlistResult = { success: true } | { success: false; error: string };

export async function submitDeckWaitlist(formData: FormData): Promise<DeckWaitlistResult> {
  const email = (formData.get("email") as string) || "";
  const rl = rateLimit(rateLimitKey(email, "deck-waitlist"), 3, 60_000);
  if (!rl.ok) return { success: false, error: "Too many requests. Please try again later." };

  const raw = {
    name: (formData.get("name") as string) || "—",
    email,
  };
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  await prisma.lead.create({
    data: {
      name: result.data.name,
      email: result.data.email,
      company: null,
      message: "Notify me when Builders & Founders Network Deck (2.0) is available.",
      source: "DECK_WAITLIST_BUILDERS",
    },
  });
  return { success: true };
}
