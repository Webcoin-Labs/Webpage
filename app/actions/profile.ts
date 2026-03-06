"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const builderProfileSchema = z.object({
    handle: z.string().min(2).max(30).regex(/^[a-z0-9-_]+$/i, "Handle: letters, numbers, hyphens, underscores only").optional().or(z.literal("")),
    headline: z.string().max(120).optional(),
    bio: z.string().max(500).optional(),
    skills: z.string().optional(),
    location: z.string().optional(),
    github: z.string().url().optional().or(z.literal("")),
    twitter: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    interests: z.string().optional(),
});

const founderProfileSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    roleTitle: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    pitchDeckUrl: z.string().url().optional().or(z.literal("")),
    telegram: z.string().optional(),
    twitter: z.string().optional(),
});

type ProfileResult = { success: true } | { success: false; error: string };

export async function upsertBuilderProfile(formData: FormData): Promise<ProfileResult> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { success: false, error: "Not authenticated" };

    const raw = {
        handle: (formData.get("handle") as string) || "",
        headline: (formData.get("headline") as string) || undefined,
        bio: (formData.get("bio") as string) || undefined,
        skills: (formData.get("skills") as string) || undefined,
        location: (formData.get("location") as string) || undefined,
        github: (formData.get("github") as string) || "",
        twitter: (formData.get("twitter") as string) || undefined,
        website: (formData.get("website") as string) || "",
        interests: (formData.get("interests") as string) || undefined,
    };

    const result = builderProfileSchema.safeParse(raw);
    if (!result.success) return { success: false, error: result.error.errors[0].message };

    const data = {
        handle: result.data.handle?.trim() || null,
        headline: result.data.headline || null,
        bio: result.data.bio,
        skills: result.data.skills?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
        location: result.data.location,
        github: result.data.github || null,
        twitter: result.data.twitter,
        website: result.data.website || null,
        interests: result.data.interests?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
    };

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
        companyName: formData.get("companyName") as string,
        roleTitle: (formData.get("roleTitle") as string) || undefined,
        website: (formData.get("website") as string) || "",
        pitchDeckUrl: (formData.get("pitchDeckUrl") as string) || "",
        telegram: (formData.get("telegram") as string) || undefined,
        twitter: (formData.get("twitter") as string) || undefined,
    };

    const result = founderProfileSchema.safeParse(raw);
    if (!result.success) return { success: false, error: result.error.errors[0].message };

    await prisma.founderProfile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, ...result.data },
        update: result.data,
    });

    return { success: true };
}
