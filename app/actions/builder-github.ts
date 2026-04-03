"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";

const githubConnectSchema = z.object({
  username: z.string().min(2).max(80),
});

export type BuilderGithubActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

async function requireBuilder() {
  const session = await getServerSession();
  if (!session?.user?.id) return null;
  if (!["BUILDER", "ADMIN"].includes(session.user.role)) return null;
  return session.user;
}

export async function connectBuilderGithub(
  formData: FormData,
): Promise<BuilderGithubActionResult> {
  const user = await requireBuilder();
  if (!user) return { success: false, error: "Unauthorized." };

  const parsed = githubConnectSchema.safeParse({
    username: String(formData.get("username") ?? "").trim().replace(/^@+/, ""),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid GitHub username." };
  }

  const username = parsed.data.username;
  const profileUrl = `https://github.com/${username}`;

  await db.githubConnection.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      username,
      profileUrl,
      accessMode: "manual_sync",
      lastSyncedAt: new Date(),
    },
    update: {
      username,
      profileUrl,
      accessMode: "manual_sync",
      lastSyncedAt: new Date(),
    },
  });

  await db.integrationConnection.upsert({
    where: { userId_provider: { userId: user.id, provider: "GITHUB" } },
    create: {
      userId: user.id,
      provider: "GITHUB",
      status: "CONNECTED",
      externalUserId: username,
    },
    update: {
      status: "CONNECTED",
      externalUserId: username,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/builder-os");
  revalidatePath("/app/builder-os/github");
  revalidatePath("/app/builder-os/integrations");
  revalidatePath("/app/builder-projects");
  revalidatePath("/app/settings");
  return { success: true, message: `GitHub connected as @${username}.` };
}

export async function disconnectBuilderGithub(): Promise<BuilderGithubActionResult> {
  const user = await requireBuilder();
  if (!user) return { success: false, error: "Unauthorized." };

  await db.githubConnection.deleteMany({
    where: { userId: user.id },
  });

  await db.integrationConnection.upsert({
    where: { userId_provider: { userId: user.id, provider: "GITHUB" } },
    create: {
      userId: user.id,
      provider: "GITHUB",
      status: "DISCONNECTED",
    },
    update: {
      status: "DISCONNECTED",
      externalUserId: null,
      externalEmail: null,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/builder-os");
  revalidatePath("/app/builder-os/github");
  revalidatePath("/app/builder-os/integrations");
  revalidatePath("/app/builder-projects");
  revalidatePath("/app/settings");
  return { success: true, message: "GitHub disconnected." };
}
