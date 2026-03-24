"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { revalidatePath } from "next/cache";

const allowedRoles = ["BUILDER", "FOUNDER", "INVESTOR"] as const;

export type SettingsResult = { success: true } | { success: false; error: string };

function normalizeUsername(raw: string) {
  const trimmed = raw.trim().replace(/^@+/, "");
  return trimmed.toLowerCase();
}

function isValidUsername(username: string) {
  // 3-20 chars, starts with letter/number, allows letters/numbers/underscore.
  return /^[a-z0-9][a-z0-9_]{2,19}$/.test(username);
}

export async function updateRole(role: string): Promise<SettingsResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
    return { success: false, error: "Invalid role" };
  }

  if (role === "INVESTOR") {
    const investorProfile = await db.investorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!investorProfile) {
      return {
        success: false,
        error: "Investor OS is restricted. Complete investor onboarding first.",
      };
    }
  }

  const workspace = role === "FOUNDER" ? "FOUNDER_OS" : role === "INVESTOR" ? "INVESTOR_OS" : "BUILDER_OS";

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { role: role as "BUILDER" | "FOUNDER" | "INVESTOR" },
    }),
    db.userWorkspace.upsert({
      where: {
        userId_workspace: {
          userId: session.user.id,
          workspace,
        },
      },
      create: {
        userId: session.user.id,
        workspace,
        status: "ENABLED",
        isDefault: true,
      },
      update: {
        status: "ENABLED",
        isDefault: true,
      },
    }),
    db.userWorkspace.updateMany({
      where: {
        userId: session.user.id,
        workspace: {
          not: workspace,
        },
      },
      data: { isDefault: false },
    }),
  ]);

  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath("/app/workspaces");
  return { success: true };
}

export async function updateUsername(usernameRaw: string): Promise<SettingsResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const username = normalizeUsername(usernameRaw);
  if (!username) return { success: false, error: "Username is required" };
  if (!isValidUsername(username)) {
    return {
      success: false,
      error: "Username must be 3-20 characters and use only letters, numbers, or underscores.",
    };
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: { username },
    });
  } catch (e: unknown) {
    const message = String(e);
    if (message.includes("P2002")) {
      return { success: false, error: "That username is already taken." };
    }
    return { success: false, error: "Unable to update username right now." };
  }

  revalidatePath("/app");
  revalidatePath("/app/settings");
  revalidatePath("/");
  return { success: true };
}
