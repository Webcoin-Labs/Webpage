"use server";

import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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
export type BuilderRepoPreviewResult =
  | {
      success: true;
      data: {
        title: string;
        tagline: string;
        description: string;
        githubUrl: string;
        liveUrl: string;
        techStack: string;
        achievements: string;
        openSourceContributions: string;
      };
    }
  | { success: false; error: string };

async function requireBuilder() {
  const session = await getServerSession();
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

function parseGithubRepository(url: string) {
  try {
    const parsed = new URL(url);
    if (!/github\.com$/i.test(parsed.hostname)) return null;
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    return {
      owner,
      repo: repo.replace(/\.git$/i, ""),
    };
  } catch {
    return null;
  }
}

export async function previewGithubRepository(repoUrl: string): Promise<BuilderRepoPreviewResult> {
  const user = await requireBuilder();
  if (!user) return { success: false, error: "Unauthorized." };

  const parsed = parseGithubRepository(repoUrl.trim());
  if (!parsed) {
    return { success: false, error: "Enter a valid GitHub repository URL like https://github.com/owner/repo." };
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Webcoin-Labs-Builder-Import",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "Repository not found. Double-check the repo URL." };
      }
      return { success: false, error: "GitHub import failed. Try again in a moment." };
    }

    const repo = (await response.json()) as {
      name?: string;
      full_name?: string;
      description?: string | null;
      homepage?: string | null;
      html_url?: string;
      language?: string | null;
      topics?: string[];
      stargazers_count?: number;
      forks_count?: number;
      subscribers_count?: number;
      open_issues_count?: number;
      pushed_at?: string | null;
      visibility?: string;
      archived?: boolean;
    };

    const stack = [repo.language, ...(repo.topics ?? [])].filter(Boolean) as string[];
    const uniqueStack = [...new Set(stack)].slice(0, 8);
    const achievements = [
      typeof repo.stargazers_count === "number" ? `${repo.stargazers_count} stars` : null,
      typeof repo.forks_count === "number" ? `${repo.forks_count} forks` : null,
      typeof repo.subscribers_count === "number" ? `${repo.subscribers_count} watchers` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const contributionBits = [
      repo.visibility ? `${repo.visibility} repository` : null,
      typeof repo.open_issues_count === "number" ? `${repo.open_issues_count} open issues` : null,
      repo.pushed_at ? `Last pushed ${new Date(repo.pushed_at).toLocaleDateString("en-IN")}` : null,
      repo.archived ? "Repository archived" : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      success: true,
      data: {
        title: repo.name ?? parsed.repo,
        tagline: repo.description ?? "",
        description: repo.description
          ? `${repo.description}\n\nImported from GitHub. Add your specific role, shipped outcomes, and user impact before saving.`
          : "",
        githubUrl: repo.html_url ?? repoUrl.trim(),
        liveUrl: repo.homepage ?? "",
        techStack: uniqueStack.join(", "),
        achievements,
        openSourceContributions: contributionBits,
      },
    };
  } catch {
    return { success: false, error: "Could not reach GitHub right now." };
  }
}

