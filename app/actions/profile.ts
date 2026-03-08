"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const builderProfileSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    profilePhoto: z.string().url().optional().or(z.literal("")),
    handle: z.string().min(2).max(30).regex(/^[a-z0-9-_]+$/i, "Handle: letters, numbers, hyphens, underscores only").optional().or(z.literal("")),
    title: z.string().min(2, "Title is required"),
    headline: z.string().max(120).optional(),
    bio: z.string().max(700).optional(),
    skills: z.string().min(2, "Skills are required"),
    preferredChains: z.string().min(2, "Preferred chains are required"),
    openTo: z.array(z.string()).min(1, "Select at least one availability"),
    location: z.string().optional(),
    timezone: z.string().optional(),
    experience: z.string().optional(),
    github: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal("")),
    twitter: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    portfolioUrl: z.string().url().optional().or(z.literal("")),
    interests: z.string().optional(),
});

const founderProfileSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    profilePhoto: z.string().url().optional().or(z.literal("")),
    companyName: z.string().min(1, "Company name is required"),
    companyDescription: z.string().min(10, "Company description is required"),
    roleTitle: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
    projectStage: z.enum(["IDEA", "MVP", "LIVE"]),
    chainFocus: z.string().min(2, "Chain focus is required"),
    currentNeeds: z.string().min(2, "Current needs are required"),
    website: z.string().url().optional().or(z.literal("")),
    pitchDeckUrl: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal("")),
    telegram: z.string().optional(),
    twitter: z.string().optional(),
});

const investorProfileSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    profilePhoto: z.string().url().optional().or(z.literal("")),
    firmName: z.string().min(2, "Firm name is required"),
    roleTitle: z.string().optional(),
    focus: z.string().optional(),
    location: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal("")),
    twitter: z.string().optional(),
});

type ProfileResult = { success: true } | { success: false; error: string };

export async function upsertBuilderProfile(formData: FormData): Promise<ProfileResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const raw = {
        fullName: (formData.get("fullName") as string) || session.user.name || "",
        profilePhoto: (formData.get("profilePhoto") as string) || "",
        handle: (formData.get("handle") as string) || "",
        title: (formData.get("title") as string) || "",
        headline: (formData.get("headline") as string) || undefined,
        bio: (formData.get("bio") as string) || undefined,
        skills: (formData.get("skills") as string) || "",
        preferredChains: (formData.get("preferredChains") as string) || "",
        openTo: formData.getAll("openTo").map((value) => String(value)),
        location: (formData.get("location") as string) || undefined,
        timezone: (formData.get("timezone") as string) || undefined,
        experience: (formData.get("experience") as string) || undefined,
        github: (formData.get("github") as string) || "",
        linkedin: (formData.get("linkedin") as string) || "",
        twitter: (formData.get("twitter") as string) || undefined,
        website: (formData.get("website") as string) || "",
        portfolioUrl: (formData.get("portfolioUrl") as string) || "",
        interests: (formData.get("interests") as string) || undefined,
    };

    const result = builderProfileSchema.safeParse(raw);
    if (!result.success) return { success: false, error: result.error.errors[0].message };

    const data = {
        handle: result.data.handle?.trim() || null,
        title: result.data.title,
        headline: result.data.headline || null,
        bio: result.data.bio,
        skills: result.data.skills?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
        preferredChains: result.data.preferredChains?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
        openTo: result.data.openTo ?? [],
        location: result.data.location,
        timezone: result.data.timezone,
        experience: result.data.experience,
        github: result.data.github || null,
        linkedin: result.data.linkedin || null,
        twitter: result.data.twitter,
        website: result.data.website || null,
        portfolioUrl: result.data.portfolioUrl || null,
        interests: result.data.interests?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
    };

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: result.data.fullName.trim(),
            image: result.data.profilePhoto || session.user.image || null,
            onboardingComplete: true,
        },
    });

    await prisma.builderProfile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, ...data },
        update: data,
    });

    return { success: true };
}

export async function upsertFounderProfile(formData: FormData): Promise<ProfileResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const raw = {
        fullName: (formData.get("fullName") as string) || session.user.name || "",
        profilePhoto: (formData.get("profilePhoto") as string) || "",
        companyName: formData.get("companyName") as string,
        companyDescription: (formData.get("companyDescription") as string) || "",
        roleTitle: (formData.get("roleTitle") as string) || undefined,
        bio: (formData.get("bio") as string) || undefined,
        location: (formData.get("location") as string) || undefined,
        timezone: (formData.get("timezone") as string) || undefined,
        projectStage: (formData.get("projectStage") as "IDEA" | "MVP" | "LIVE") || "IDEA",
        chainFocus: (formData.get("chainFocus") as string) || "",
        currentNeeds: (formData.get("currentNeeds") as string) || "",
        website: (formData.get("website") as string) || "",
        pitchDeckUrl: (formData.get("pitchDeckUrl") as string) || "",
        linkedin: (formData.get("linkedin") as string) || "",
        telegram: (formData.get("telegram") as string) || undefined,
        twitter: (formData.get("twitter") as string) || undefined,
    };

    const result = founderProfileSchema.safeParse(raw);
    if (!result.success) return { success: false, error: result.error.errors[0].message };

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: result.data.fullName.trim(),
            image: result.data.profilePhoto || session.user.image || null,
            onboardingComplete: true,
        },
    });

    await prisma.founderProfile.upsert({
        where: { userId: session.user.id },
        create: {
            userId: session.user.id,
            companyName: result.data.companyName,
            companyDescription: result.data.companyDescription,
            roleTitle: result.data.roleTitle,
            bio: result.data.bio,
            location: result.data.location,
            timezone: result.data.timezone,
            projectStage: result.data.projectStage,
            chainFocus: result.data.chainFocus,
            currentNeeds: result.data.currentNeeds.split(",").map((s) => s.trim()).filter(Boolean),
            website: result.data.website,
            pitchDeckUrl: result.data.pitchDeckUrl || null,
            linkedin: result.data.linkedin || null,
            telegram: result.data.telegram,
            twitter: result.data.twitter,
        },
        update: {
            companyName: result.data.companyName,
            companyDescription: result.data.companyDescription,
            roleTitle: result.data.roleTitle,
            bio: result.data.bio,
            location: result.data.location,
            timezone: result.data.timezone,
            projectStage: result.data.projectStage,
            chainFocus: result.data.chainFocus,
            currentNeeds: result.data.currentNeeds.split(",").map((s) => s.trim()).filter(Boolean),
            website: result.data.website,
            pitchDeckUrl: result.data.pitchDeckUrl || null,
            linkedin: result.data.linkedin || null,
            telegram: result.data.telegram,
            twitter: result.data.twitter,
        },
    });

    return { success: true };
}

export async function upsertInvestorProfile(formData: FormData): Promise<ProfileResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const raw = {
        fullName: (formData.get("fullName") as string) || session.user.name || "",
        profilePhoto: (formData.get("profilePhoto") as string) || "",
        firmName: (formData.get("firmName") as string) || "",
        roleTitle: (formData.get("roleTitle") as string) || undefined,
        focus: (formData.get("focus") as string) || undefined,
        location: (formData.get("location") as string) || undefined,
        website: (formData.get("website") as string) || "",
        linkedin: (formData.get("linkedin") as string) || "",
        twitter: (formData.get("twitter") as string) || undefined,
    };

    const result = investorProfileSchema.safeParse(raw);
    if (!result.success) return { success: false, error: result.error.errors[0].message };

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: result.data.fullName.trim(),
            image: result.data.profilePhoto || session.user.image || null,
            onboardingComplete: true,
        },
    });

    await prisma.investorProfile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, ...result.data },
        update: result.data,
    });

    return { success: true };
}
