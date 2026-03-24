"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";

const builderProjectSchema = z.object({
  projectId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().min(2).max(120),
  tagline: z.string().max(180).optional().or(z.literal("")),
  description: z.string().max(3000).optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  achievements: z.string().max(2000).optional().or(z.literal("")),
  openSourceContributions: z.string().max(2000).optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  liveUrl: z.string().url().optional().or(z.literal("")),
  techStack: z.string().max(400).optional().or(z.literal("")),
});

function toNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function splitCsv(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export type BuilderProjectResult = { success: true } | { success: false; error: string };

async function requireBuilder() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!["BUILDER", "ADMIN"].includes(session.user.role)) return null;
  return session.user;
}

export async function upsertBuilderProject(formData: FormData): Promise<BuilderProjectResult> {
  const user = await requireBuilder();
  if (!user) return { success: false, error: "Unauthorized." };

  const parsed = builderProjectSchema.safeParse({
    projectId: String(formData.get("projectId") ?? ""),
    title: String(formData.get("title") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    achievements: String(formData.get("achievements") ?? ""),
    openSourceContributions: String(formData.get("openSourceContributions") ?? ""),
    githubUrl: String(formData.get("githubUrl") ?? ""),
    liveUrl: String(formData.get("liveUrl") ?? ""),
    techStack: String(formData.get("techStack") ?? ""),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid project data." };
  }

  const data = {
    title: parsed.data.title.trim(),
    tagline: toNull(parsed.data.tagline),
    description: toNull(parsed.data.description),
    imageUrl: toNull(parsed.data.imageUrl),
    achievements: toNull(parsed.data.achievements),
    openSourceContributions: toNull(parsed.data.openSourceContributions),
    githubUrl: toNull(parsed.data.githubUrl),
    liveUrl: toNull(parsed.data.liveUrl),
    techStack: splitCsv(parsed.data.techStack),
  };

  if (parsed.data.projectId) {
    const existing = await db.builderProject.findFirst({
      where: user.role === "ADMIN" ? { id: parsed.data.projectId } : { id: parsed.data.projectId, builderId: user.id },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Project not found." };
    await db.builderProject.update({
      where: { id: parsed.data.projectId },
      data,
    });
  } else {
    await db.builderProject.create({
      data: {
        builderId: user.id,
        ...data,
      },
    });
  }

  revalidatePath("/app");
  revalidatePath("/app/builder-projects");
  revalidatePath("/app/profile");
  return { success: true };
}

export async function deleteBuilderProject(projectId: string): Promise<BuilderProjectResult> {
  const user = await requireBuilder();
  if (!user) return { success: false, error: "Unauthorized." };

  const project = await db.builderProject.findFirst({
    where: user.role === "ADMIN" ? { id: projectId } : { id: projectId, builderId: user.id },
    select: { id: true },
  });
  if (!project) return { success: false, error: "Project not found." };

  await db.builderProject.delete({ where: { id: projectId } });
  revalidatePath("/app");
  revalidatePath("/app/builder-projects");
  return { success: true };
}
