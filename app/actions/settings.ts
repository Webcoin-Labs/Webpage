"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const allowedRoles = ["BUILDER", "FOUNDER", "INVESTOR"] as const;

export type SettingsResult = { success: true } | { success: false; error: string };

export async function updateRole(role: string): Promise<SettingsResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!allowedRoles.includes(role as (typeof allowedRoles)[number])) {
    return { success: false, error: "Invalid role" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: role as "BUILDER" | "FOUNDER" | "INVESTOR" },
  });

  revalidatePath("/app");
  revalidatePath("/app/settings");
  return { success: true };
}
