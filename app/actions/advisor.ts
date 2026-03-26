"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db/client";
import { requireSessionUser, assertAnyRole } from "@/server/policies/authz";
import { writeAuditLog } from "@/lib/audit";

type AdvisorActionResult = { success: true; message?: string; inviteLink?: string } | { success: false; error: string };

const createInviteSchema = z.object({
  projectId: z.string().cuid(),
  expiresAt: z.string().optional().or(z.literal("")),
});

const advisorProfileSchema = z.object({
  headline: z.string().trim().min(2, "Headline is required."),
  bio: z.string().trim().min(10, "Bio is required."),
  expertise: z.string().trim().min(2, "Add at least one expertise area."),
  hourlyRateUsd: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Number.isFinite(Number(value)), "Hourly rate must be a number."),
  companyName: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().optional().or(z.literal("")),
  linkedin: z.string().trim().optional().or(z.literal("")),
  telegram: z.string().trim().optional().or(z.literal("")),
  publicVisible: z.boolean().default(true),
});

const connectAdvisorSchema = z.object({
  projectId: z.string().cuid(),
  advisorProfileId: z.string().cuid(),
});

function splitCommaValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNullIfEmpty(value: string | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildAdvisorInviteToken() {
  return `ADV-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

export async function createProjectAdvisorInvite(formData: FormData): Promise<AdvisorActionResult> {
  const user = await requireSessionUser();
  assertAnyRole(user, ["ADMIN"]);

  const parsed = createInviteSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    expiresAt: String(formData.get("expiresAt") ?? ""),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid invite configuration." };

  const project = await db.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { id: true, name: true },
  });
  if (!project) return { success: false, error: "Project not found." };

  let token = buildAdvisorInviteToken();
  while (await db.projectAdvisorInvite.findUnique({ where: { token } })) token = buildAdvisorInviteToken();

  const invite = await db.projectAdvisorInvite.create({
    data: {
      token,
      projectId: project.id,
      createdByAdminId: user.id,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      maxRedemptions: 1,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "admin_create_project_advisor_invite",
    entityType: "ProjectAdvisorInvite",
    entityId: invite.id,
    metadata: { projectId: project.id, token: invite.token, expiresAt: invite.expiresAt },
  });

  revalidatePath("/app/admin/advisors");
  revalidatePath("/app/founder-os/advisor-connect");
  return { success: true, inviteLink: `/advisor/invite/${invite.token}` };
}

export async function redeemProjectAdvisorInvite(inviteToken: string): Promise<AdvisorActionResult> {
  const user = await requireSessionUser();
  const token = inviteToken.trim().toUpperCase();
  if (!token) return { success: false, error: "Invite token is required." };

  const invite = await db.projectAdvisorInvite.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      projectId: true,
      createdByAdminId: true,
      isActive: true,
      expiresAt: true,
      maxRedemptions: true,
      redeemedCount: true,
    },
  });
  if (!invite || !invite.isActive) return { success: false, error: "Invite link is invalid or inactive." };
  if (invite.expiresAt && invite.expiresAt < new Date()) return { success: false, error: "Invite link has expired." };
  if (invite.redeemedCount >= invite.maxRedemptions) return { success: false, error: "Invite link has already been used." };

  const result = await db.$transaction(async (tx) => {
    const accessGrant = await tx.advisorAccessGrant.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!accessGrant) {
      await tx.advisorAccessGrant.create({
        data: {
          userId: user.id,
          grantedByAdminId: invite.createdByAdminId,
          sourceInviteId: invite.id,
        },
      });
    }

    await tx.projectAdvisorInvite.update({
      where: { id: invite.id },
      data: {
        redeemedCount: { increment: 1 },
        usedByUserId: user.id,
        usedAt: new Date(),
      },
    });

    const advisorProfile = await tx.advisorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (advisorProfile) {
      await tx.projectAdvisorConnection.upsert({
        where: {
          projectId_advisorProfileId: {
            projectId: invite.projectId,
            advisorProfileId: advisorProfile.id,
          },
        },
        create: {
          projectId: invite.projectId,
          advisorProfileId: advisorProfile.id,
          connectedByUserId: invite.createdByAdminId,
          sourceInviteId: invite.id,
        },
        update: {
          sourceInviteId: invite.id,
        },
      });
    }

    return { hasProfile: Boolean(advisorProfile) };
  });

  revalidatePath("/advisor");
  revalidatePath("/app/founder-os/advisor-connect");
  return {
    success: true,
    message: result.hasProfile
      ? "Invite redeemed. You are connected to the project."
      : "Invite redeemed. Complete your advisor profile to appear in Founder Dashboard.",
  };
}

export async function upsertAdvisorProfile(formData: FormData): Promise<AdvisorActionResult> {
  const user = await requireSessionUser();
  const grant = await db.advisorAccessGrant.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!grant) {
    return { success: false, error: "Advisor access is locked. Redeem an admin invite link first." };
  }

  const parsed = advisorProfileSchema.safeParse({
    headline: String(formData.get("headline") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    expertise: String(formData.get("expertise") ?? ""),
    hourlyRateUsd: String(formData.get("hourlyRateUsd") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    website: String(formData.get("website") ?? ""),
    linkedin: String(formData.get("linkedin") ?? ""),
    telegram: String(formData.get("telegram") ?? ""),
    publicVisible: formData.get("publicVisible") === "on" || formData.get("publicVisible") === "true",
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid advisor profile data." };

  const advisorProfile = await db.advisorProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      expertise: splitCommaValues(parsed.data.expertise),
      hourlyRateUsd: parsed.data.hourlyRateUsd ? Math.max(0, Math.round(Number(parsed.data.hourlyRateUsd))) : null,
      companyName: toNullIfEmpty(parsed.data.companyName),
      website: toNullIfEmpty(parsed.data.website),
      linkedin: toNullIfEmpty(parsed.data.linkedin),
      telegram: toNullIfEmpty(parsed.data.telegram),
      publicVisible: parsed.data.publicVisible,
    },
    update: {
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      expertise: splitCommaValues(parsed.data.expertise),
      hourlyRateUsd: parsed.data.hourlyRateUsd ? Math.max(0, Math.round(Number(parsed.data.hourlyRateUsd))) : null,
      companyName: toNullIfEmpty(parsed.data.companyName),
      website: toNullIfEmpty(parsed.data.website),
      linkedin: toNullIfEmpty(parsed.data.linkedin),
      telegram: toNullIfEmpty(parsed.data.telegram),
      publicVisible: parsed.data.publicVisible,
    },
  });

  const redeemedInvites = await db.projectAdvisorInvite.findMany({
    where: { usedByUserId: user.id },
    select: { id: true, projectId: true, createdByAdminId: true },
  });
  if (redeemedInvites.length > 0) {
    await db.projectAdvisorConnection.createMany({
      data: redeemedInvites.map((invite) => ({
        projectId: invite.projectId,
        advisorProfileId: advisorProfile.id,
        connectedByUserId: invite.createdByAdminId,
        sourceInviteId: invite.id,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/advisor");
  revalidatePath("/app/founder-os/advisor-connect");
  return { success: true, message: "Advisor profile saved." };
}

export async function connectAdvisorToProject(formData: FormData): Promise<AdvisorActionResult> {
  const user = await requireSessionUser();
  assertAnyRole(user, ["FOUNDER", "ADMIN"]);

  const parsed = connectAdvisorSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    advisorProfileId: String(formData.get("advisorProfileId") ?? ""),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid advisor connection data." };

  const project = await db.project.findFirst({
    where: user.role === "ADMIN" ? { id: parsed.data.projectId } : { id: parsed.data.projectId, ownerUserId: user.id },
    select: { id: true, name: true },
  });
  if (!project) return { success: false, error: "Project not found for your account." };

  const advisor = await db.advisorProfile.findFirst({
    where: user.role === "ADMIN" ? { id: parsed.data.advisorProfileId } : { id: parsed.data.advisorProfileId, publicVisible: true },
    select: { id: true },
  });
  if (!advisor) return { success: false, error: "Advisor profile not found or not publicly visible." };

  await db.projectAdvisorConnection.upsert({
    where: {
      projectId_advisorProfileId: {
        projectId: project.id,
        advisorProfileId: advisor.id,
      },
    },
    create: {
      projectId: project.id,
      advisorProfileId: advisor.id,
      connectedByUserId: user.id,
    },
    update: {
      connectedByUserId: user.id,
    },
  });

  revalidatePath("/app/founder-os/advisor-connect");
  revalidatePath("/advisor");
  return { success: true, message: "Advisor connected to project." };
}
