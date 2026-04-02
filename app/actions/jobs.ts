"use server";

import { getServerSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { JobPostStatus } from "@prisma/client";

const jobPostSchema = z.object({
  title: z.string().trim().min(3, "Job title is required"),
  company: z.string().trim().min(2, "Company is required"),
  description: z.string().trim().min(25, "Description must be at least 25 characters"),
  roleType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP", "COFOUNDER"]),
  locationType: z.enum(["REMOTE", "HYBRID", "ONSITE"]),
  chainFocus: z.string().trim().max(120).optional().or(z.literal("")),
  skillsRequired: z.string().trim().min(2, "Add at least one required skill"),
  compensation: z.string().trim().max(120).optional().or(z.literal("")),
  projectId: z.string().cuid().optional().or(z.literal("")),
  status: z.enum(["OPEN", "CLOSED", "DRAFT"]).optional(),
});

const jobApplicationSchema = z.object({
  jobId: z.string().cuid(),
  message: z.string().trim().min(20, "Please provide at least 20 characters"),
  resumeUrl: z.string().trim().url("Resume URL must be valid").optional().or(z.literal("")),
});

type JobResult = { success: true } | { success: false; error: string };

export async function createJobPost(formData: FormData): Promise<JobResult> {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!["FOUNDER", "ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Only founders and admins can create jobs." };
  }

  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "job-create"), 20, 60_000);
  if (!rl.ok) return { success: false, error: "Too many requests. Please try again in a minute." };

  const parsed = jobPostSchema.safeParse({
    title: formData.get("title"),
    company: formData.get("company"),
    description: formData.get("description"),
    roleType: formData.get("roleType"),
    locationType: formData.get("locationType"),
    chainFocus: formData.get("chainFocus"),
    skillsRequired: formData.get("skillsRequired"),
    compensation: formData.get("compensation"),
    projectId: formData.get("projectId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const projectId = parsed.data.projectId || null;
  if (projectId) {
    const project = await db.project.findFirst({
      where: session.user.role === "ADMIN" ? { id: projectId } : { id: projectId, ownerUserId: session.user.id },
      select: { id: true },
    });
    if (!project) return { success: false, error: "Project not found or not owned by you." };
  }

  await db.jobPost.create({
    data: {
      title: parsed.data.title,
      company: parsed.data.company,
      description: parsed.data.description,
      roleType: parsed.data.roleType,
      locationType: parsed.data.locationType,
      chainFocus: parsed.data.chainFocus || null,
      skillsRequired: parsed.data.skillsRequired
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      compensation: parsed.data.compensation || null,
      projectId,
      createdByUserId: session.user.id,
      status: (parsed.data.status ?? "OPEN") as JobPostStatus,
    },
  });

  revalidatePath("/app/jobs");
  revalidatePath("/app");
  revalidatePath("/app/admin");
  return { success: true };
}

export async function applyToJob(formData: FormData): Promise<JobResult> {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!["BUILDER", "ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Only builders can apply to jobs." };
  }

  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "job-apply"), 20, 60_000);
  if (!rl.ok) return { success: false, error: "Too many applications. Please try again shortly." };

  const parsed = jobApplicationSchema.safeParse({
    jobId: formData.get("jobId"),
    message: formData.get("message"),
    resumeUrl: formData.get("resumeUrl"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const job = await db.jobPost.findUnique({ where: { id: parsed.data.jobId }, select: { id: true, status: true } });
  if (!job || job.status !== "OPEN") return { success: false, error: "This job is no longer open." };

  const existing = await db.jobApplication.findUnique({
    where: { jobId_userId: { jobId: parsed.data.jobId, userId: session.user.id } },
    select: { id: true },
  });
  if (existing) return { success: false, error: "You already applied to this job." };

  await db.jobApplication.create({
    data: {
      jobId: parsed.data.jobId,
      userId: session.user.id,
      message: parsed.data.message,
      resumeUrl: parsed.data.resumeUrl || null,
    },
  });

  revalidatePath("/app/jobs");
  revalidatePath("/app");
  revalidatePath("/app/admin");
  return { success: true };
}

export async function updateJobApplicationStatus(id: string, status: string) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const parsed = z.enum(["APPLIED", "REVIEWING", "SHORTLISTED", "REJECTED", "HIRED"]).safeParse(status);
  if (!parsed.success) throw new Error("Invalid status");
  await db.jobApplication.update({ where: { id }, data: { status: parsed.data } });
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/jobs");
}

export async function updateJobPostStatus(id: string, status: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = z.enum(["OPEN", "CLOSED", "DRAFT"]).safeParse(status);
  if (!parsed.success) throw new Error("Invalid status");

  const job = await db.jobPost.findUnique({ where: { id }, select: { createdByUserId: true } });
  if (!job) throw new Error("Job not found");
  if (session.user.role !== "ADMIN" && job.createdByUserId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await db.jobPost.update({ where: { id }, data: { status: parsed.data } });
  revalidatePath("/app/jobs");
  revalidatePath("/app");
  revalidatePath("/app/admin/jobs");
}

