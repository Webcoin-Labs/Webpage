"use server";

import { z } from "zod";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";

const strategyCallSchema = z.object({
  name: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Please enter a valid email"),
  contactHandle: z
    .string()
    .trim()
    .max(120, "Contact handle is too long")
    .optional()
    .or(z.literal("")),
  projectName: z.string().trim().min(2, "Project name is required"),
  stage: z.string().trim().min(2, "Project stage is required"),
  description: z.string().trim().min(25, "Please provide at least 25 characters"),
});

const jobsWaitlistSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  roleInterest: z.string().trim().max(120).optional().or(z.literal("")),
});

const kreatorboardWaitlistSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Please enter a valid email"),
  projectName: z.string().trim().max(120).optional().or(z.literal("")),
  useCase: z.string().trim().max(500).optional().or(z.literal("")),
});

export type LeadActionResult = { success: true } | { success: false; error: string };

export async function submitStrategyCall(formData: FormData): Promise<LeadActionResult> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const rl = await rateLimitAsync(rateLimitKey(email || "unknown", "strategy-call"), 4, 60_000);
  if (!rl.ok) return { success: false, error: "Too many submissions. Please try again shortly." };

  const parsed = strategyCallSchema.safeParse({
    name: formData.get("name"),
    email,
    contactHandle: formData.get("contactHandle"),
    projectName: formData.get("projectName"),
    stage: formData.get("stage"),
    description: formData.get("description"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  await db.lead.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.projectName,
      source: "STRATEGY_CALL",
      message: [
        `Project stage: ${parsed.data.stage}`,
        parsed.data.contactHandle ? `Contact: ${parsed.data.contactHandle}` : null,
        "",
        parsed.data.description,
      ]
        .filter(Boolean)
        .join("\n"),
      metadata: {
        stage: parsed.data.stage,
        contactHandle: parsed.data.contactHandle || null,
      },
    },
  });

  return { success: true };
}

export async function submitJobsWaitlist(formData: FormData): Promise<LeadActionResult> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const rl = await rateLimitAsync(rateLimitKey(email || "unknown", "jobs-waitlist"), 5, 60_000);
  if (!rl.ok) return { success: false, error: "Too many requests. Please try again soon." };

  const parsed = jobsWaitlistSchema.safeParse({
    email,
    roleInterest: formData.get("roleInterest"),
  });

  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  await db.lead.create({
    data: {
      name: "Jobs Waitlist",
      email: parsed.data.email,
      source: "JOBS_WAITLIST",
      message: parsed.data.roleInterest
        ? `Interested role: ${parsed.data.roleInterest}`
        : "Interested in jobs updates.",
      metadata: {
        roleInterest: parsed.data.roleInterest || null,
      },
    },
  });

  return { success: true };
}

export async function submitKreatorboardWaitlist(formData: FormData): Promise<LeadActionResult> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const rl = await rateLimitAsync(rateLimitKey(email || "unknown", "kreatorboard-waitlist"), 5, 60_000);
  if (!rl.ok) return { success: false, error: "Too many requests. Please try again soon." };

  const parsed = kreatorboardWaitlistSchema.safeParse({
    name: formData.get("name"),
    email,
    projectName: formData.get("projectName"),
    useCase: formData.get("useCase"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  await db.lead.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.projectName || null,
      source: "KREATORBOARD_WAITLIST",
      message: parsed.data.useCase || "Requested Kreatorboard launch updates.",
      metadata: {
        projectName: parsed.data.projectName || null,
        useCase: parsed.data.useCase || null,
      },
    },
  });

  return { success: true };
}
