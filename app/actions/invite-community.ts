"use server";

import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db/client";

type InviteResult = { success: true; code?: string } | { success: false; error: string };

const createCodeSchema = z.object({
  label: z.string().max(120).optional().or(z.literal("")),
  maxUses: z.coerce.number().int().min(1).max(500).optional(),
  expiresAt: z.string().optional().or(z.literal("")),
});

const redeemSchema = z.object({
  code: z.string().min(4).max(64),
});

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function buildCodeToken() {
  return `WCL-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export async function createInviteOnlyCode(formData: FormData): Promise<InviteResult> {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN" || !session.user.id) return { success: false, error: "Unauthorized." };

  const parsed = createCodeSchema.safeParse({
    label: String(formData.get("label") ?? ""),
    maxUses: formData.get("maxUses") ? String(formData.get("maxUses")) : undefined,
    expiresAt: String(formData.get("expiresAt") ?? ""),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid code config." };

  let code = buildCodeToken();
  while (await db.inviteOnlyCode.findUnique({ where: { code } })) {
    code = buildCodeToken();
  }

  await db.inviteOnlyCode.create({
    data: {
      code,
      label: parsed.data.label?.trim() || null,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/app/admin/notifications");
  revalidatePath("/app/invite-community");
  return { success: true, code };
}

export async function redeemInviteOnlyCode(formData: FormData): Promise<InviteResult> {
  const session = await getServerSession();
  if (!session?.user?.id) return { success: false, error: "Unauthorized." };

  const parsed = redeemSchema.safeParse({
    code: normalizeCode(String(formData.get("code") ?? "")),
  });
  if (!parsed.success) return { success: false, error: "Invalid invite code." };

  const existingMembership = await db.inviteOnlyMembership.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existingMembership) return { success: false, error: "You already have invite-only access." };

  const code = await db.inviteOnlyCode.findUnique({
    where: { code: parsed.data.code },
    select: { id: true, isActive: true, expiresAt: true, maxUses: true, usedCount: true },
  });
  if (!code || !code.isActive) return { success: false, error: "Code is invalid or inactive." };
  if (code.expiresAt && code.expiresAt < new Date()) return { success: false, error: "Code has expired." };
  if (code.maxUses && code.usedCount >= code.maxUses) return { success: false, error: "Code usage limit reached." };

  await db.$transaction([
    db.inviteOnlyMembership.create({
      data: {
        userId: session.user.id,
        codeId: code.id,
      },
    }),
    db.inviteOnlyCode.update({
      where: { id: code.id },
      data: {
        usedCount: { increment: 1 },
      },
    }),
  ]);

  revalidatePath("/app/invite-community");
  return { success: true };
}

