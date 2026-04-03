"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ContactMethodType, FeedPostType, FeedPostVisibility, Role, Prisma } from "@prisma/client";
import { db } from "@/server/db/client";
import { requireSessionUser } from "@/server/policies/authz";
import { measureAsync } from "@/lib/perf/measure";

type ActionResult = { success: true; message?: string } | { success: false; error: string };

const createFeedPostSchema = z.object({
  postType: z.nativeEnum(FeedPostType),
  title: z.string().trim().min(4, "Title is required.").max(140),
  body: z.string().trim().min(8, "Body is required.").max(2000),
  visibility: z.nativeEnum(FeedPostVisibility).default("PUBLIC"),
  relatedVentureId: z.string().optional().or(z.literal("")),
  relatedProjectId: z.string().optional().or(z.literal("")),
  metadataJson: z.string().optional().or(z.literal("")),
});

const contactMethodSchema = z.object({
  id: z.string().cuid().optional().or(z.literal("")),
  type: z.nativeEnum(ContactMethodType),
  label: z.string().trim().max(60).optional().or(z.literal("")),
  value: z.string().trim().min(2, "Contact value required.").max(300),
  isPublic: z.boolean().default(true),
  isEnabled: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(100).optional().default(0),
});

const networkingSettingsSchema = z.object({
  profileVisibility: z.enum(["PUBLIC", "PRIVATE"]),
  openToConnections: z.boolean().default(true),
  showInEcosystemFeed: z.boolean().default(true),
  preferredPublicHeadline: z.string().trim().max(120).optional().or(z.literal("")),
});

function currentRoleProfileField(role: Role): "builderProfileLive" | "founderProfileLive" | "investorProfileLive" {
  if (role === "FOUNDER") return "founderProfileLive";
  if (role === "INVESTOR") return "investorProfileLive";
  return "builderProfileLive";
}

const MIN_PROFILE_COMPLETION_FOR_POSTING = 60;

function completionPercent(fields: Array<unknown>) {
  const total = fields.length || 1;
  const filled = fields.filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  }).length;
  return Math.round((filled / total) * 100);
}

async function getUserProfileCompletionForPosting(userId: string, role: Role): Promise<number> {
  if (role === "FOUNDER") {
    const [profile, startupCount] = await Promise.all([
      db.founderProfile.findUnique({
        where: { userId },
        select: {
          companyName: true,
          companyDescription: true,
          roleTitle: true,
          companyLogoUrl: true,
          chainFocus: true,
          projectStage: true,
          currentNeeds: true,
          website: true,
          isHiring: true,
        },
      }),
      db.startup.count({ where: { founderId: userId } }),
    ]);
    if (!profile) return 0;
    const base = completionPercent([
      profile.companyName,
      profile.companyDescription,
      profile.roleTitle,
      profile.companyLogoUrl,
      profile.chainFocus,
      profile.projectStage,
      profile.currentNeeds,
      profile.website,
      profile.isHiring !== undefined ? "x" : null,
    ]);
    return startupCount > 0 ? base : Math.min(base, 79);
  }

  if (role === "INVESTOR") {
    const profile = await db.investorProfile.findUnique({
      where: { userId },
      select: {
        firmName: true,
        roleTitle: true,
        focus: true,
        website: true,
        ticketSize: true,
        lookingFor: true,
        investmentThesis: true,
      },
    });
    if (!profile) return 0;
    return completionPercent([
      profile.firmName,
      profile.roleTitle,
      profile.focus,
      profile.website,
      profile.ticketSize,
      profile.lookingFor,
      profile.investmentThesis,
    ]);
  }

  const profile = await db.builderProfile.findUnique({
    where: { userId },
    select: {
      title: true,
      headline: true,
      skills: true,
      preferredChains: true,
      openTo: true,
      bio: true,
      achievements: true,
      openSourceContributions: true,
      independent: true,
      openToWork: true,
      github: true,
      portfolioUrl: true,
      resumeUrl: true,
    },
  });
  if (!profile) return 0;
  return completionPercent([
    profile.title,
    profile.headline,
    profile.skills,
    profile.preferredChains,
    profile.openTo,
    profile.bio,
    profile.achievements,
    profile.openSourceContributions,
    profile.independent,
    profile.openToWork,
    profile.github || profile.portfolioUrl || profile.resumeUrl,
  ]);
}

export async function createFeedPost(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const parsed = createFeedPostSchema.safeParse({
    postType: String(formData.get("postType") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    visibility: String(formData.get("visibility") ?? "PUBLIC"),
    relatedVentureId: String(formData.get("relatedVentureId") ?? ""),
    relatedProjectId: String(formData.get("relatedProjectId") ?? ""),
    metadataJson: String(formData.get("metadataJson") ?? ""),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid post data." };

  const completion = await getUserProfileCompletionForPosting(user.id, user.role);
  if (completion < MIN_PROFILE_COMPLETION_FOR_POSTING) {
    return {
      success: false,
      error: `Complete your profile to at least ${MIN_PROFILE_COMPLETION_FOR_POSTING}% before posting. Current completion: ${completion}%.`,
    };
  }

  let metadata: Record<string, unknown> | null = null;
  if (parsed.data.metadataJson) {
    try {
      metadata = JSON.parse(parsed.data.metadataJson) as Record<string, unknown>;
    } catch {
      return { success: false, error: "Metadata JSON is invalid." };
    }
  }

  await measureAsync(
    "ecosystem.feed",
    "create-post",
    () =>
      db.feedPost.create({
        data: {
          authorUserId: user.id,
          authorRole: user.role,
          postType: parsed.data.postType,
          title: parsed.data.title,
          body: parsed.data.body,
          visibility: parsed.data.visibility,
          metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
          relatedVentureId: parsed.data.relatedVentureId || null,
          relatedProjectId: parsed.data.relatedProjectId || null,
        },
      }),
    { authorUserId: user.id, postType: parsed.data.postType }
  );

  revalidatePath("/app/ecosystem-feed");
  revalidatePath("/app/founder-os/ecosystem-feed");
  revalidatePath("/app/builder-os/ecosystem-feed");
  revalidatePath("/app/investor-os/ecosystem-feed");
  return { success: true, message: "Post published to ecosystem feed." };
}

export async function upsertProfileContactMethod(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const parsed = contactMethodSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    type: String(formData.get("type") ?? ""),
    label: String(formData.get("label") ?? ""),
    value: String(formData.get("value") ?? ""),
    isPublic: formData.get("isPublic") === "true" || formData.get("isPublic") === "on",
    isEnabled: formData.get("isEnabled") === "true" || formData.get("isEnabled") === "on",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid contact method." };

  if (parsed.data.id) {
    await db.profileContactMethod.updateMany({
      where: { id: parsed.data.id, userId: user.id },
      data: {
        type: parsed.data.type,
        label: parsed.data.label || null,
        value: parsed.data.value,
        isPublic: parsed.data.isPublic,
        isEnabled: parsed.data.isEnabled,
        sortOrder: parsed.data.sortOrder,
      },
    });
  } else {
    await db.profileContactMethod.create({
      data: {
        userId: user.id,
        type: parsed.data.type,
        label: parsed.data.label || null,
        value: parsed.data.value,
        isPublic: parsed.data.isPublic,
        isEnabled: parsed.data.isEnabled,
        sortOrder: parsed.data.sortOrder,
      },
    });
  }

  revalidatePath("/app/profile");
  revalidatePath("/builder");
  revalidatePath("/founder");
  revalidatePath("/investor");
  return { success: true };
}

export async function deleteProfileContactMethod(id: string): Promise<ActionResult> {
  const user = await requireSessionUser();
  await db.profileContactMethod.deleteMany({
    where: { id, userId: user.id },
  });
  revalidatePath("/app/profile");
  return { success: true };
}

export async function updateNetworkingSettings(formData: FormData): Promise<ActionResult> {
  const user = await requireSessionUser();
  const parsed = networkingSettingsSchema.safeParse({
    profileVisibility: String(formData.get("profileVisibility") ?? "PUBLIC"),
    openToConnections: formData.get("openToConnections") === "true" || formData.get("openToConnections") === "on",
    showInEcosystemFeed: formData.get("showInEcosystemFeed") === "true" || formData.get("showInEcosystemFeed") === "on",
    preferredPublicHeadline: String(formData.get("preferredPublicHeadline") ?? ""),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid networking settings." };

  const isPublic = parsed.data.profileVisibility === "PUBLIC";
  if (user.role === "FOUNDER") {
    await db.founderProfile.updateMany({ where: { userId: user.id }, data: { publicVisible: isPublic } });
  } else if (user.role === "INVESTOR") {
    await db.investorProfile.updateMany({ where: { userId: user.id }, data: { isPublic: isPublic } });
  } else {
    await db.builderProfile.updateMany({ where: { userId: user.id }, data: { publicVisible: isPublic } });
  }

  const roleField = currentRoleProfileField(user.role);
  await db.publicProfileSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      openToConnections: parsed.data.openToConnections,
      showInEcosystemFeed: parsed.data.showInEcosystemFeed,
      preferredPublicHeadline: parsed.data.preferredPublicHeadline || null,
      [roleField]: isPublic,
    },
    update: {
      openToConnections: parsed.data.openToConnections,
      showInEcosystemFeed: parsed.data.showInEcosystemFeed,
      preferredPublicHeadline: parsed.data.preferredPublicHeadline || null,
      [roleField]: isPublic,
    },
  });

  revalidatePath("/app/profile");
  revalidatePath("/app/ecosystem-feed");
  revalidatePath("/builder");
  revalidatePath("/founder");
  revalidatePath("/investor");
  return { success: true };
}
