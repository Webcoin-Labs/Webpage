"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { optimizeAndStoreImage } from "@/lib/images/upload";
import { getFileStorage } from "@/lib/storage";
import {
  upsertAvatarUploadAsset,
  upsertFounderLogoUploadAsset,
} from "@/lib/uploads/assets";
import { logger } from "@/lib/logger";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";

const urlField = z.string().url().optional().or(z.literal(""));
const imageRefField = z
  .string()
  .trim()
  .max(600)
  .optional()
  .or(z.literal(""))
  .refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value), "Image URL must be valid");
const handleRegex = /^[a-z0-9-_]+$/i;

const builderProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  profilePhoto: imageRefField,
  handle: z.string().min(2).max(30).regex(handleRegex, "Handle: letters, numbers, hyphens, underscores only").optional().or(z.literal("")),
  title: z.string().min(2, "Title is required"),
  headline: z.string().max(120).optional(),
  affiliation: z.string().max(80).optional(),
  independent: z.boolean().default(false),
  openToWork: z.boolean().default(true),
  bio: z.string().max(700).optional(),
  skills: z.string().min(2, "Skills are required"),
  preferredChains: z.string().min(2, "Preferred chains are required"),
  openTo: z.array(z.string()).min(1, "Select at least one availability"),
  location: z.string().optional(),
  timezone: z.string().optional(),
  experience: z.string().optional(),
  github: urlField,
  linkedin: urlField,
  twitter: z.string().optional(),
  website: urlField,
  portfolioUrl: urlField,
  interests: z.string().optional(),
  achievements: z.string().max(2500).optional(),
  openSourceContributions: z.string().max(2500).optional(),
  resumeUrl: urlField,
});

const founderProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  profilePhoto: imageRefField,
  companyLogoUrl: imageRefField,
  companyName: z.string().min(1, "Company name is required"),
  companyDescription: z.string().min(10, "Company description is required"),
  roleTitle: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  projectStage: z.enum(["IDEA", "MVP", "LIVE"]),
  chainFocus: z.string().min(2, "Chain focus is required"),
  currentNeeds: z.string().min(2, "Current needs are required"),
  website: urlField,
  pitchDeckUrl: urlField,
  linkedin: urlField,
  telegram: z.string().optional(),
  twitter: z.string().optional(),
  isHiring: z.boolean().default(false),
  publicVisible: z.boolean().default(true),
});

const investorProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  profilePhoto: imageRefField,
  firmName: z.string().min(2, "Firm name is required"),
  roleTitle: z.string().optional(),
  focus: z.string().optional(),
  location: z.string().optional(),
  website: urlField,
  linkedin: urlField,
  twitter: z.string().optional(),
  ticketSize: z.string().max(120).optional(),
  lookingFor: z.string().max(300).optional(),
  investmentThesis: z.string().max(2500).optional(),
});

type ProfileResult = { success: true } | { success: false; error: string };
type AllowedRole = "BUILDER" | "FOUNDER" | "INVESTOR" | "ADMIN";

function hasRole(role: string | undefined, allowedRoles: AllowedRole[]) {
  if (!role) return false;
  return allowedRoles.includes(role as AllowedRole);
}

function getOptionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getOptionalFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (!(value instanceof File)) return null;
  if (value.size <= 0) return null;
  return value;
}

function getBooleanFromForm(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (typeof value !== "string") return false;
  return value === "on" || value === "true" || value === "1" || value === "yes";
}

function splitCommaValues(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNullableUrl(value?: string): string | null {
  if (!value) return null;
  return value.trim() || null;
}

type AvatarUpdate = {
  image?: string | null;
  imageStorageKey?: string | null;
  imageMimeType?: string | null;
  imageSize?: number | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageOriginalName?: string | null;
};

async function resolveAvatarUpdateForUser(
  formData: FormData,
  existingImage: string | null,
  existingStorageKey: string | null,
  userId: string
): Promise<AvatarUpdate> {
  const uploadedAvatar = getOptionalFile(formData, "avatarFile");
  const externalProfilePhoto = getOptionalString(formData, "profilePhoto");
  const storage = getFileStorage();

  if (uploadedAvatar) {
    if (existingStorageKey) {
      await storage.delete(existingStorageKey).catch(() => undefined);
    }
    const storedImage = await optimizeAndStoreImage(uploadedAvatar, "avatar", userId);
    return {
      image: storedImage.fileUrl,
      imageStorageKey: storedImage.storageKey,
      imageMimeType: storedImage.mimeType,
      imageSize: storedImage.fileSize,
      imageWidth: storedImage.width,
      imageHeight: storedImage.height,
      imageOriginalName: storedImage.originalName,
    };
  }

  if (externalProfilePhoto) {
    if (externalProfilePhoto !== existingImage && existingStorageKey) {
      await storage.delete(existingStorageKey).catch(() => undefined);
      return {
        image: externalProfilePhoto,
        imageStorageKey: null,
        imageMimeType: null,
        imageSize: null,
        imageWidth: null,
        imageHeight: null,
        imageOriginalName: null,
      };
    }
    return { image: existingImage };
  }

  return { image: existingImage };
}

export async function upsertBuilderProfile(formData: FormData): Promise<ProfileResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Not authenticated" };
  if (!hasRole(session.user.role, ["BUILDER", "ADMIN"])) {
    return { success: false, error: "Only builders can update this profile." };
  }
  const limiter = await rateLimitAsync(rateLimitKey(session.user.id, "profile-builder-upsert"), 20, 60_000);
  if (!limiter.ok) return { success: false, error: "Too many updates. Please try again shortly." };

  const raw = {
    fullName: getOptionalString(formData, "fullName") ?? session.user.name ?? "",
    profilePhoto: getOptionalString(formData, "profilePhoto") ?? "",
    handle: getOptionalString(formData, "handle") ?? "",
    title: getOptionalString(formData, "title") ?? "",
    headline: getOptionalString(formData, "headline"),
    affiliation: getOptionalString(formData, "affiliation"),
    independent: getBooleanFromForm(formData, "independent"),
    openToWork: getBooleanFromForm(formData, "openToWork"),
    bio: getOptionalString(formData, "bio"),
    skills: getOptionalString(formData, "skills") ?? "",
    preferredChains: getOptionalString(formData, "preferredChains") ?? "",
    openTo: formData.getAll("openTo").map((value) => String(value)),
    location: getOptionalString(formData, "location"),
    timezone: getOptionalString(formData, "timezone"),
    experience: getOptionalString(formData, "experience"),
    github: getOptionalString(formData, "github") ?? "",
    linkedin: getOptionalString(formData, "linkedin") ?? "",
    twitter: getOptionalString(formData, "twitter"),
    website: getOptionalString(formData, "website") ?? "",
    portfolioUrl: getOptionalString(formData, "portfolioUrl") ?? "",
    interests: getOptionalString(formData, "interests"),
    achievements: getOptionalString(formData, "achievements"),
    openSourceContributions: getOptionalString(formData, "openSourceContributions"),
    resumeUrl: getOptionalString(formData, "resumeUrl") ?? "",
  };

  const parsed = builderProfileSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const existingUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, imageStorageKey: true },
  });

  let avatarUpdate: AvatarUpdate;
  try {
    avatarUpdate = await resolveAvatarUpdateForUser(
      formData,
      existingUser?.image ?? session.user.image ?? null,
      existingUser?.imageStorageKey ?? null,
      session.user.id
    );
  } catch (error) {
    logger.error({
      scope: "profile.upsertBuilderProfile.avatarUpload",
      message: "Builder avatar upload failed.",
      error,
      data: { userId: session.user.id },
    });
    return { success: false, error: error instanceof Error ? error.message : "Profile image upload failed." };
  }

  const builderCreateData: Prisma.BuilderProfileUncheckedCreateInput = {
    userId: session.user.id,
    handle: parsed.data.handle?.trim() || null,
    title: parsed.data.title.trim(),
    headline: parsed.data.headline?.trim() || null,
    affiliation: parsed.data.affiliation?.trim() || null,
    independent: parsed.data.independent,
    openToWork: parsed.data.openToWork,
    bio: parsed.data.bio || null,
    skills: splitCommaValues(parsed.data.skills),
    preferredChains: splitCommaValues(parsed.data.preferredChains),
    openTo: parsed.data.openTo,
    location: parsed.data.location || null,
    timezone: parsed.data.timezone || null,
    experience: parsed.data.experience || null,
    github: toNullableUrl(parsed.data.github),
    linkedin: toNullableUrl(parsed.data.linkedin),
    twitter: parsed.data.twitter || null,
    website: toNullableUrl(parsed.data.website),
    portfolioUrl: toNullableUrl(parsed.data.portfolioUrl),
    interests: parsed.data.interests ? splitCommaValues(parsed.data.interests) : [],
    achievements: parsed.data.achievements || null,
    openSourceContributions: parsed.data.openSourceContributions || null,
    resumeUrl: toNullableUrl(parsed.data.resumeUrl),
  };

  const builderUpdateData: Prisma.BuilderProfileUncheckedUpdateInput = {
    handle: builderCreateData.handle,
    title: builderCreateData.title,
    headline: builderCreateData.headline,
    affiliation: builderCreateData.affiliation,
    independent: builderCreateData.independent,
    openToWork: builderCreateData.openToWork,
    bio: builderCreateData.bio,
    skills: builderCreateData.skills,
    preferredChains: builderCreateData.preferredChains,
    openTo: builderCreateData.openTo,
    location: builderCreateData.location,
    timezone: builderCreateData.timezone,
    experience: builderCreateData.experience,
    github: builderCreateData.github,
    linkedin: builderCreateData.linkedin,
    twitter: builderCreateData.twitter,
    website: builderCreateData.website,
    portfolioUrl: builderCreateData.portfolioUrl,
    interests: builderCreateData.interests,
    achievements: builderCreateData.achievements,
    openSourceContributions: builderCreateData.openSourceContributions,
    resumeUrl: builderCreateData.resumeUrl,
  };

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.fullName.trim(),
        image: avatarUpdate.image,
        imageStorageKey: avatarUpdate.imageStorageKey,
        imageMimeType: avatarUpdate.imageMimeType,
        imageSize: avatarUpdate.imageSize,
        imageWidth: avatarUpdate.imageWidth,
        imageHeight: avatarUpdate.imageHeight,
        imageOriginalName: avatarUpdate.imageOriginalName,
        onboardingComplete: true,
      },
    });

    if (avatarUpdate.image) {
      await upsertAvatarUploadAsset(session.user.id, {
        ownerUserId: session.user.id,
        fileUrl: avatarUpdate.image,
        storageKey: avatarUpdate.imageStorageKey ?? null,
        mimeType: avatarUpdate.imageMimeType ?? null,
        fileSize: avatarUpdate.imageSize ?? null,
        width: avatarUpdate.imageWidth ?? null,
        height: avatarUpdate.imageHeight ?? null,
        originalName: avatarUpdate.imageOriginalName ?? null,
      });
    } else {
      await db.uploadAsset.updateMany({
        where: { userId: session.user.id },
        data: {
          status: "REMOVED",
          moderationReason: "Owner removed profile image.",
          moderatedAt: new Date(),
        },
      });
    }

    await db.builderProfile.upsert({
      where: { userId: session.user.id },
      create: builderCreateData,
      update: builderUpdateData,
    });
  } catch (error) {
    logger.error({
      scope: "profile.upsertBuilderProfile.persist",
      message: "Builder profile save failed.",
      error,
      data: { userId: session.user.id },
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, error: "This handle is already taken. Please choose another one." };
    }
    return { success: false, error: "Could not save builder profile. Please try again." };
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath("/builders");
  revalidatePath("/app/hiring");
  revalidatePath("/app/builder-projects");
  return { success: true };
}

export async function upsertFounderProfile(formData: FormData): Promise<ProfileResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Not authenticated" };
  if (!hasRole(session.user.role, ["FOUNDER", "ADMIN"])) {
    return { success: false, error: "Only founders can update this profile." };
  }
  const limiter = await rateLimitAsync(rateLimitKey(session.user.id, "profile-founder-upsert"), 20, 60_000);
  if (!limiter.ok) return { success: false, error: "Too many updates. Please try again shortly." };

  const raw = {
    fullName: getOptionalString(formData, "fullName") ?? session.user.name ?? "",
    profilePhoto: getOptionalString(formData, "profilePhoto") ?? "",
    companyLogoUrl: getOptionalString(formData, "companyLogoUrl") ?? "",
    companyName: getOptionalString(formData, "companyName") ?? "",
    companyDescription: getOptionalString(formData, "companyDescription") ?? "",
    roleTitle: getOptionalString(formData, "roleTitle"),
    bio: getOptionalString(formData, "bio"),
    location: getOptionalString(formData, "location"),
    timezone: getOptionalString(formData, "timezone"),
    projectStage: (getOptionalString(formData, "projectStage") as "IDEA" | "MVP" | "LIVE") ?? "IDEA",
    chainFocus: getOptionalString(formData, "chainFocus") ?? "",
    currentNeeds: getOptionalString(formData, "currentNeeds") ?? "",
    website: getOptionalString(formData, "website") ?? "",
    pitchDeckUrl: getOptionalString(formData, "pitchDeckUrl") ?? "",
    linkedin: getOptionalString(formData, "linkedin") ?? "",
    telegram: getOptionalString(formData, "telegram"),
    twitter: getOptionalString(formData, "twitter"),
    isHiring: getBooleanFromForm(formData, "isHiring"),
    publicVisible: formData.has("publicVisible") ? getBooleanFromForm(formData, "publicVisible") : true,
  };

  const parsed = founderProfileSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const [existingFounderProfile, existingUser] = await Promise.all([
    db.founderProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        companyLogoUrl: true,
        companyLogoStorageKey: true,
        companyLogoMimeType: true,
        companyLogoSize: true,
        companyLogoWidth: true,
        companyLogoHeight: true,
        companyLogoOriginalName: true,
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, imageStorageKey: true },
    }),
  ]);

  let avatarUpdate: AvatarUpdate;
  try {
    avatarUpdate = await resolveAvatarUpdateForUser(
      formData,
      existingUser?.image ?? session.user.image ?? null,
      existingUser?.imageStorageKey ?? null,
      session.user.id
    );
  } catch (error) {
    logger.error({
      scope: "profile.upsertFounderProfile.avatarUpload",
      message: "Founder avatar upload failed.",
      error,
      data: { userId: session.user.id },
    });
    return { success: false, error: error instanceof Error ? error.message : "Profile image upload failed." };
  }

  let uploadedCompanyLogo:
    | Awaited<ReturnType<typeof optimizeAndStoreImage>>
    | null = null;
  const companyLogoFile = getOptionalFile(formData, "companyLogoFile");
  const storage = getFileStorage();
  if (companyLogoFile) {
    try {
      if (existingFounderProfile?.companyLogoStorageKey) {
        await storage.delete(existingFounderProfile.companyLogoStorageKey).catch(() => undefined);
      }
      uploadedCompanyLogo = await optimizeAndStoreImage(
        companyLogoFile,
        "company-logo",
        existingFounderProfile?.id ?? session.user.id
      );
    } catch (error) {
      logger.error({
        scope: "profile.upsertFounderProfile.companyLogoUpload",
        message: "Founder company logo upload failed.",
        error,
        data: { userId: session.user.id },
      });
      return { success: false, error: error instanceof Error ? error.message : "Company logo upload failed." };
    }
  }

  const companyLogoUrl = uploadedCompanyLogo?.fileUrl ?? toNullableUrl(parsed.data.companyLogoUrl);
  const shouldKeepExistingLogoMeta =
    !uploadedCompanyLogo &&
    Boolean(companyLogoUrl) &&
    companyLogoUrl === existingFounderProfile?.companyLogoUrl;

  if (!uploadedCompanyLogo && companyLogoUrl !== existingFounderProfile?.companyLogoUrl && existingFounderProfile?.companyLogoStorageKey) {
    await storage.delete(existingFounderProfile.companyLogoStorageKey).catch(() => undefined);
  }

  const founderCreateData: Prisma.FounderProfileUncheckedCreateInput = {
    userId: session.user.id,
    companyLogoUrl,
    companyLogoStorageKey: uploadedCompanyLogo?.storageKey ?? (shouldKeepExistingLogoMeta ? existingFounderProfile?.companyLogoStorageKey ?? null : null),
    companyLogoMimeType: uploadedCompanyLogo?.mimeType ?? (shouldKeepExistingLogoMeta ? existingFounderProfile?.companyLogoMimeType ?? null : null),
    companyLogoSize: uploadedCompanyLogo?.fileSize ?? (shouldKeepExistingLogoMeta ? existingFounderProfile?.companyLogoSize ?? null : null),
    companyLogoWidth: uploadedCompanyLogo?.width ?? (shouldKeepExistingLogoMeta ? existingFounderProfile?.companyLogoWidth ?? null : null),
    companyLogoHeight: uploadedCompanyLogo?.height ?? (shouldKeepExistingLogoMeta ? existingFounderProfile?.companyLogoHeight ?? null : null),
    companyLogoOriginalName: uploadedCompanyLogo?.originalName ?? (shouldKeepExistingLogoMeta ? existingFounderProfile?.companyLogoOriginalName ?? null : null),
    companyName: parsed.data.companyName.trim(),
    companyDescription: parsed.data.companyDescription.trim(),
    roleTitle: parsed.data.roleTitle || null,
    bio: parsed.data.bio || null,
    location: parsed.data.location || null,
    timezone: parsed.data.timezone || null,
    isHiring: parsed.data.isHiring,
    projectStage: parsed.data.projectStage,
    chainFocus: parsed.data.chainFocus.trim(),
    currentNeeds: splitCommaValues(parsed.data.currentNeeds),
    website: toNullableUrl(parsed.data.website),
    pitchDeckUrl: toNullableUrl(parsed.data.pitchDeckUrl),
    linkedin: toNullableUrl(parsed.data.linkedin),
    telegram: parsed.data.telegram || null,
    twitter: parsed.data.twitter || null,
    publicVisible: parsed.data.publicVisible,
  };

  const founderUpdateData: Prisma.FounderProfileUncheckedUpdateInput = {
    companyLogoUrl: founderCreateData.companyLogoUrl,
    companyLogoStorageKey: founderCreateData.companyLogoStorageKey,
    companyLogoMimeType: founderCreateData.companyLogoMimeType,
    companyLogoSize: founderCreateData.companyLogoSize,
    companyLogoWidth: founderCreateData.companyLogoWidth,
    companyLogoHeight: founderCreateData.companyLogoHeight,
    companyLogoOriginalName: founderCreateData.companyLogoOriginalName,
    companyName: founderCreateData.companyName,
    companyDescription: founderCreateData.companyDescription,
    roleTitle: founderCreateData.roleTitle,
    bio: founderCreateData.bio,
    location: founderCreateData.location,
    timezone: founderCreateData.timezone,
    isHiring: founderCreateData.isHiring,
    projectStage: founderCreateData.projectStage,
    chainFocus: founderCreateData.chainFocus,
    currentNeeds: founderCreateData.currentNeeds,
    website: founderCreateData.website,
    pitchDeckUrl: founderCreateData.pitchDeckUrl,
    linkedin: founderCreateData.linkedin,
    telegram: founderCreateData.telegram,
    twitter: founderCreateData.twitter,
    publicVisible: founderCreateData.publicVisible,
  };

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.fullName.trim(),
        image: avatarUpdate.image,
        imageStorageKey: avatarUpdate.imageStorageKey,
        imageMimeType: avatarUpdate.imageMimeType,
        imageSize: avatarUpdate.imageSize,
        imageWidth: avatarUpdate.imageWidth,
        imageHeight: avatarUpdate.imageHeight,
        imageOriginalName: avatarUpdate.imageOriginalName,
        onboardingComplete: true,
      },
    });

    const savedFounder = await db.founderProfile.upsert({
      where: { userId: session.user.id },
      create: founderCreateData,
      update: founderUpdateData,
    });

    if (avatarUpdate.image) {
      await upsertAvatarUploadAsset(session.user.id, {
        ownerUserId: session.user.id,
        fileUrl: avatarUpdate.image,
        storageKey: avatarUpdate.imageStorageKey ?? null,
        mimeType: avatarUpdate.imageMimeType ?? null,
        fileSize: avatarUpdate.imageSize ?? null,
        width: avatarUpdate.imageWidth ?? null,
        height: avatarUpdate.imageHeight ?? null,
        originalName: avatarUpdate.imageOriginalName ?? null,
      });
    } else {
      await db.uploadAsset.updateMany({
        where: { userId: session.user.id },
        data: {
          status: "REMOVED",
          moderationReason: "Owner removed profile image.",
          moderatedAt: new Date(),
        },
      });
    }

    if (savedFounder.companyLogoUrl) {
      await upsertFounderLogoUploadAsset(savedFounder.id, {
        ownerUserId: session.user.id,
        fileUrl: savedFounder.companyLogoUrl,
        storageKey: savedFounder.companyLogoStorageKey ?? null,
        mimeType: savedFounder.companyLogoMimeType ?? null,
        fileSize: savedFounder.companyLogoSize ?? null,
        width: savedFounder.companyLogoWidth ?? null,
        height: savedFounder.companyLogoHeight ?? null,
        originalName: savedFounder.companyLogoOriginalName ?? null,
      });
    } else {
      await db.uploadAsset.updateMany({
        where: { founderProfileId: savedFounder.id },
        data: {
          status: "REMOVED",
          moderationReason: "Owner removed company logo.",
          moderatedAt: new Date(),
        },
      });
    }
  } catch (_error) {
    logger.error({
      scope: "profile.upsertFounderProfile.persist",
      message: "Founder profile save failed.",
      error: _error,
      data: { userId: session.user.id },
    });
    return { success: false, error: "Could not save founder profile. Please try again." };
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath("/builders");
  revalidatePath("/projects");
  revalidatePath("/app/hiring");
  revalidatePath("/app/founders");
  revalidatePath("/startups");
  return { success: true };
}

export async function upsertInvestorProfile(formData: FormData): Promise<ProfileResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, error: "Not authenticated" };
  if (!hasRole(session.user.role, ["INVESTOR", "ADMIN"])) {
    return { success: false, error: "Only investors can update this profile." };
  }
  const limiter = await rateLimitAsync(rateLimitKey(session.user.id, "profile-investor-upsert"), 20, 60_000);
  if (!limiter.ok) return { success: false, error: "Too many updates. Please try again shortly." };

  const raw = {
    fullName: getOptionalString(formData, "fullName") ?? session.user.name ?? "",
    profilePhoto: getOptionalString(formData, "profilePhoto") ?? "",
    firmName: getOptionalString(formData, "firmName") ?? "",
    roleTitle: getOptionalString(formData, "roleTitle"),
    focus: getOptionalString(formData, "focus"),
    location: getOptionalString(formData, "location"),
    website: getOptionalString(formData, "website") ?? "",
    linkedin: getOptionalString(formData, "linkedin") ?? "",
    twitter: getOptionalString(formData, "twitter"),
    ticketSize: getOptionalString(formData, "ticketSize"),
    lookingFor: getOptionalString(formData, "lookingFor"),
    investmentThesis: getOptionalString(formData, "investmentThesis"),
  };

  const parsed = investorProfileSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

  const existingUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, imageStorageKey: true },
  });

  let avatarUpdate: AvatarUpdate;
  try {
    avatarUpdate = await resolveAvatarUpdateForUser(
      formData,
      existingUser?.image ?? session.user.image ?? null,
      existingUser?.imageStorageKey ?? null,
      session.user.id
    );
  } catch (error) {
    logger.error({
      scope: "profile.upsertInvestorProfile.avatarUpload",
      message: "Investor avatar upload failed.",
      error,
      data: { userId: session.user.id },
    });
    return { success: false, error: error instanceof Error ? error.message : "Profile image upload failed." };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.fullName.trim(),
        image: avatarUpdate.image,
        imageStorageKey: avatarUpdate.imageStorageKey,
        imageMimeType: avatarUpdate.imageMimeType,
        imageSize: avatarUpdate.imageSize,
        imageWidth: avatarUpdate.imageWidth,
        imageHeight: avatarUpdate.imageHeight,
        imageOriginalName: avatarUpdate.imageOriginalName,
        onboardingComplete: true,
      },
    });

    if (avatarUpdate.image) {
      await upsertAvatarUploadAsset(session.user.id, {
        ownerUserId: session.user.id,
        fileUrl: avatarUpdate.image,
        storageKey: avatarUpdate.imageStorageKey ?? null,
        mimeType: avatarUpdate.imageMimeType ?? null,
        fileSize: avatarUpdate.imageSize ?? null,
        width: avatarUpdate.imageWidth ?? null,
        height: avatarUpdate.imageHeight ?? null,
        originalName: avatarUpdate.imageOriginalName ?? null,
      });
    } else {
      await db.uploadAsset.updateMany({
        where: { userId: session.user.id },
        data: {
          status: "REMOVED",
          moderationReason: "Owner removed profile image.",
          moderatedAt: new Date(),
        },
      });
    }

    await db.investorProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        firmName: parsed.data.firmName.trim(),
        roleTitle: parsed.data.roleTitle || null,
        focus: parsed.data.focus || null,
        location: parsed.data.location || null,
        website: toNullableUrl(parsed.data.website),
        linkedin: toNullableUrl(parsed.data.linkedin),
        twitter: parsed.data.twitter || null,
        ticketSize: parsed.data.ticketSize || null,
        lookingFor: parsed.data.lookingFor || null,
        investmentThesis: parsed.data.investmentThesis || null,
      },
      update: {
        firmName: parsed.data.firmName.trim(),
        roleTitle: parsed.data.roleTitle || null,
        focus: parsed.data.focus || null,
        location: parsed.data.location || null,
        website: toNullableUrl(parsed.data.website),
        linkedin: toNullableUrl(parsed.data.linkedin),
        twitter: parsed.data.twitter || null,
        ticketSize: parsed.data.ticketSize || null,
        lookingFor: parsed.data.lookingFor || null,
        investmentThesis: parsed.data.investmentThesis || null,
      },
    });
  } catch (_error) {
    logger.error({
      scope: "profile.upsertInvestorProfile.persist",
      message: "Investor profile save failed.",
      error: _error,
      data: { userId: session.user.id },
    });
    return { success: false, error: "Could not save investor profile. Please try again." };
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  return { success: true };
}

