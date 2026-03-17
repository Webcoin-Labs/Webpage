"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  UploadModerationAction,
  UploadModerationStatus,
  type Prisma,
  type UploadAsset,
} from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFileStorage } from "@/lib/storage";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { retryPitchDeckAnalysis } from "@/app/actions/pitchdeck";
import { logger } from "@/lib/logger";

type ModerationResult =
  | { success: true; status: UploadModerationStatus; id: string }
  | { success: false; error: string };

type BulkModerationResult =
  | { success: true; processed: number; failed: Array<{ id: string; error: string }> }
  | { success: false; error: string };

const assetIdSchema = z.string().cuid("Invalid asset identifier.");
const noteSchema = z.string().trim().max(1200, "Note is too long.").optional().or(z.literal(""));
const reasonSchema = z.string().trim().max(240, "Reason is too long.").optional().or(z.literal(""));

type ModerateParams = {
  assetId: string;
  nextStatus: UploadModerationStatus;
  action: UploadModerationAction;
  reason?: string;
  note?: string;
};

async function assertAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "admin-upload-moderation"), 240, 60_000);
  if (!rl.ok) throw new Error("Too many moderation actions. Please slow down.");
  return session;
}

async function revalidateUploadPaths() {
  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath("/app/hiring");
  revalidatePath("/builders");
  revalidatePath("/projects");
  revalidatePath("/pitchdeck");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/uploads");
  revalidatePath("/app/admin/moderation");
  revalidatePath("/app/admin/pitch-decks");
}

async function syncVisibility(
  tx: Prisma.TransactionClient,
  asset: UploadAsset,
  status: UploadModerationStatus
) {
  const hidden = ["QUARANTINED", "REMOVED", "FAILED"].includes(status);

  if (asset.userId) {
    if (hidden) {
      await tx.user.update({
        where: { id: asset.userId },
        data: {
          image: null,
          imageStorageKey: null,
          imageMimeType: null,
          imageSize: null,
          imageWidth: null,
          imageHeight: null,
          imageOriginalName: null,
        },
      });
    } else {
      await tx.user.update({
        where: { id: asset.userId },
        data: {
          image: asset.fileUrl,
          imageStorageKey: asset.storageKey,
          imageMimeType: asset.mimeType,
          imageSize: asset.fileSize,
          imageWidth: asset.width,
          imageHeight: asset.height,
          imageOriginalName: asset.originalName,
        },
      });
    }
  }

  if (asset.founderProfileId) {
    if (hidden) {
      await tx.founderProfile.update({
        where: { id: asset.founderProfileId },
        data: {
          companyLogoUrl: null,
          companyLogoStorageKey: null,
          companyLogoMimeType: null,
          companyLogoSize: null,
          companyLogoWidth: null,
          companyLogoHeight: null,
          companyLogoOriginalName: null,
        },
      });
    } else {
      await tx.founderProfile.update({
        where: { id: asset.founderProfileId },
        data: {
          companyLogoUrl: asset.fileUrl,
          companyLogoStorageKey: asset.storageKey,
          companyLogoMimeType: asset.mimeType,
          companyLogoSize: asset.fileSize,
          companyLogoWidth: asset.width,
          companyLogoHeight: asset.height,
          companyLogoOriginalName: asset.originalName,
        },
      });
    }
  }

  if (asset.pitchDeckId) {
    if (hidden) {
      await tx.pitchDeck.update({
        where: { id: asset.pitchDeckId },
        data: {
          uploadStatus: "FAILED",
          extractionError: "Asset is unavailable due to moderation status.",
        },
      });
    } else {
      await tx.pitchDeck.update({
        where: { id: asset.pitchDeckId },
        data: {
          uploadStatus: "STORED",
          extractionError: null,
        },
      });
    }
  }
}

async function writeLog(
  tx: Prisma.TransactionClient,
  input: {
    uploadAssetId: string;
    action: UploadModerationAction;
    fromStatus?: UploadModerationStatus;
    toStatus?: UploadModerationStatus;
    reason?: string;
    note?: string;
    actedByUserId?: string;
  }
) {
  await tx.uploadModerationLog.create({
    data: {
      uploadAssetId: input.uploadAssetId,
      action: input.action,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      reason: input.reason ?? null,
      note: input.note ?? null,
      actedByUserId: input.actedByUserId ?? null,
    },
  });
}

async function moderateAsset({
  assetId,
  nextStatus,
  action,
  reason,
  note,
}: ModerateParams): Promise<ModerationResult> {
  let session: Awaited<ReturnType<typeof assertAdminSession>>;
  try {
    session = await assertAdminSession();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }
  const idParsed = assetIdSchema.safeParse(assetId);
  if (!idParsed.success) return { success: false, error: idParsed.error.errors[0]?.message ?? "Invalid asset id." };

  const reasonParsed = reasonSchema.safeParse(reason ?? "");
  if (!reasonParsed.success) return { success: false, error: reasonParsed.error.errors[0]?.message ?? "Invalid reason." };
  const noteParsed = noteSchema.safeParse(note ?? "");
  if (!noteParsed.success) return { success: false, error: noteParsed.error.errors[0]?.message ?? "Invalid note." };

  const asset = await prisma.uploadAsset.findUnique({ where: { id: idParsed.data } });
  if (!asset) return { success: false, error: "Upload asset not found." };

  const reasonValue = reasonParsed.data?.trim() || undefined;
  const noteValue = noteParsed.data?.trim() || undefined;

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.uploadAsset.update({
        where: { id: asset.id },
        data: {
          status: nextStatus,
          moderationReason: reasonValue ?? null,
          moderationNote: noteValue ?? null,
          moderatedByUserId: session.user.id,
          moderatedAt: new Date(),
        },
      });
      await syncVisibility(tx, updated, nextStatus);
      await writeLog(tx, {
        uploadAssetId: asset.id,
        action,
        fromStatus: asset.status,
        toStatus: nextStatus,
        reason: reasonValue,
        note: noteValue,
        actedByUserId: session.user.id,
      });
    });
    await revalidateUploadPaths();
    return { success: true, status: nextStatus, id: asset.id };
  } catch (error) {
    logger.error({
      scope: "uploadModeration.moderateAsset",
      message: "Upload moderation action failed.",
      error,
      data: { assetId: asset.id, nextStatus, action, actorId: session.user.id },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Moderation action failed.",
    };
  }
}

export async function flagUploadAsset(assetId: string, reason?: string, note?: string) {
  return moderateAsset({
    assetId,
    nextStatus: "FLAGGED",
    action: "FLAGGED",
    reason,
    note,
  });
}

export async function quarantineUploadAsset(assetId: string, reason?: string, note?: string) {
  return moderateAsset({
    assetId,
    nextStatus: "QUARANTINED",
    action: "QUARANTINED",
    reason: reason || "Quarantined by admin moderation.",
    note,
  });
}

export async function restoreUploadAsset(assetId: string, note?: string) {
  return moderateAsset({
    assetId,
    nextStatus: "ACTIVE",
    action: "RESTORED",
    note,
  });
}

export async function removeUploadAsset(
  assetId: string,
  confirmationToken: string,
  options?: { reason?: string; note?: string; deleteFromStorage?: boolean }
): Promise<ModerationResult> {
  if (confirmationToken !== "REMOVE") {
    return { success: false, error: "Confirmation token is invalid." };
  }
  const result = await moderateAsset({
    assetId,
    nextStatus: "REMOVED",
    action: "REMOVED",
    reason: options?.reason || "Removed by admin moderation.",
    note: options?.note,
  });
  if (!result.success) return result;

  if (options?.deleteFromStorage) {
    const asset = await prisma.uploadAsset.findUnique({ where: { id: assetId }, select: { storageKey: true } });
    if (asset?.storageKey) {
      try {
        const storage = getFileStorage();
        await storage.delete(asset.storageKey);
      } catch (_error) {
        logger.error({
          scope: "uploadModeration.remove.storageDelete",
          message: "Storage delete failed after removal status update.",
          error: _error,
          data: { assetId, storageKey: asset.storageKey },
        });
        return {
          success: false,
          error: "Asset was marked removed but storage deletion failed. Review storage credentials/logs.",
        };
      }
    }
  }
  await revalidateUploadPaths();
  return result;
}

export async function updateUploadModerationNote(assetId: string, note: string): Promise<ModerationResult> {
  let session: Awaited<ReturnType<typeof assertAdminSession>>;
  try {
    session = await assertAdminSession();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }
  const idParsed = assetIdSchema.safeParse(assetId);
  if (!idParsed.success) return { success: false, error: idParsed.error.errors[0]?.message ?? "Invalid asset id." };
  const noteParsed = noteSchema.safeParse(note);
  if (!noteParsed.success) return { success: false, error: noteParsed.error.errors[0]?.message ?? "Invalid note." };
  const noteValue = noteParsed.data?.trim() || "";

  const asset = await prisma.uploadAsset.findUnique({ where: { id: idParsed.data } });
  if (!asset) return { success: false, error: "Upload asset not found." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.uploadAsset.update({
        where: { id: asset.id },
        data: {
          moderationNote: noteValue || null,
          moderatedByUserId: session.user.id,
          moderatedAt: new Date(),
        },
      });
      await writeLog(tx, {
        uploadAssetId: asset.id,
        action: "NOTE_UPDATED",
        fromStatus: asset.status,
        toStatus: asset.status,
        note: noteValue,
        actedByUserId: session.user.id,
      });
    });
    await revalidateUploadPaths();
    return { success: true, status: asset.status, id: asset.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update moderation note.",
    };
  }
}

export async function reprocessUploadAsset(assetId: string, note?: string): Promise<ModerationResult> {
  let session: Awaited<ReturnType<typeof assertAdminSession>>;
  try {
    session = await assertAdminSession();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }
  const idParsed = assetIdSchema.safeParse(assetId);
  if (!idParsed.success) return { success: false, error: idParsed.error.errors[0]?.message ?? "Invalid asset id." };
  const noteParsed = noteSchema.safeParse(note ?? "");
  if (!noteParsed.success) return { success: false, error: noteParsed.error.errors[0]?.message ?? "Invalid note." };
  const noteValue = noteParsed.data?.trim() || "";

  const asset = await prisma.uploadAsset.findUnique({ where: { id: idParsed.data } });
  if (!asset) return { success: false, error: "Upload asset not found." };

  await prisma.$transaction(async (tx) => {
    await tx.uploadAsset.update({
      where: { id: asset.id },
      data: {
        status: "REPROCESSING",
        moderatedByUserId: session.user.id,
        moderatedAt: new Date(),
        moderationReason: "Reprocessing requested by admin.",
        moderationNote: noteValue || null,
      },
    });
    await writeLog(tx, {
      uploadAssetId: asset.id,
      action: "REPROCESSING_STARTED",
      fromStatus: asset.status,
      toStatus: "REPROCESSING",
      note: noteValue,
      actedByUserId: session.user.id,
    });
  });

  try {
    if (asset.assetType === "PITCH_DECK" && asset.pitchDeckId) {
      const result = await retryPitchDeckAnalysis(asset.pitchDeckId);
      if (!result.success) {
        throw new Error(result.error);
      }
    } else {
      if (!asset.storageKey) throw new Error("Storage key missing for reprocessing.");
      const storage = getFileStorage();
      const buffer = await storage.getBuffer(asset.storageKey);

      let width: number | null = null;
      let height: number | null = null;
      let mimeType = asset.mimeType ?? null;
      if (asset.assetType === "AVATAR" || asset.assetType === "COMPANY_LOGO") {
        const sharpImport = await import("sharp");
        const sharp =
          ((sharpImport as unknown as { default: typeof import("sharp") }).default ??
            (sharpImport as unknown as typeof import("sharp")));
        const metadata = await sharp(buffer, { failOn: "error" }).metadata();
        width = metadata.width ?? null;
        height = metadata.height ?? null;
        mimeType = metadata.format ? `image/${metadata.format}` : mimeType;
      }

      await prisma.uploadAsset.update({
        where: { id: asset.id },
        data: {
          fileSize: buffer.length,
          width,
          height,
          mimeType,
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.uploadAsset.update({
        where: { id: asset.id },
        data: {
          status: "ACTIVE",
      moderationReason: null,
      moderatedByUserId: session.user.id,
      moderatedAt: new Date(),
      moderationNote: noteValue || null,
    },
  });
      await syncVisibility(tx, updated, "ACTIVE");
      await writeLog(tx, {
        uploadAssetId: asset.id,
        action: "REPROCESSING_SUCCEEDED",
        fromStatus: "REPROCESSING",
        toStatus: "ACTIVE",
        note: noteValue,
        actedByUserId: session.user.id,
      });
    });
    await revalidateUploadPaths();
    return { success: true, status: "ACTIVE", id: asset.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reprocessing failed.";
    logger.error({
      scope: "uploadModeration.reprocess",
      message: "Upload reprocessing failed.",
      error,
      data: { assetId: asset.id, assetType: asset.assetType, actorId: session.user.id },
    });
    await prisma.$transaction(async (tx) => {
      const updated = await tx.uploadAsset.update({
        where: { id: asset.id },
        data: {
          status: "FAILED",
          moderationReason: message.slice(0, 220),
          moderatedByUserId: session.user.id,
          moderatedAt: new Date(),
        },
      });
      await syncVisibility(tx, updated, "FAILED");
      await writeLog(tx, {
        uploadAssetId: asset.id,
        action: "REPROCESSING_FAILED",
        fromStatus: "REPROCESSING",
        toStatus: "FAILED",
        reason: message.slice(0, 220),
        actedByUserId: session.user.id,
      });
    });
    await revalidateUploadPaths();
    return { success: false, error: message };
  }
}

const bulkSchema = z.object({
  assetIds: z.array(z.string().cuid("Invalid asset id in bulk request.")).min(1).max(100),
  operation: z.enum(["FLAG", "QUARANTINE", "RESTORE", "REMOVE", "REPROCESS"]),
  reason: z.string().trim().max(240).optional(),
  note: z.string().trim().max(1200).optional(),
  deleteFromStorage: z.boolean().optional(),
});

export async function bulkModerateUploadAssets(input: {
  assetIds: string[];
  operation: "FLAG" | "QUARANTINE" | "RESTORE" | "REMOVE" | "REPROCESS";
  reason?: string;
  note?: string;
  deleteFromStorage?: boolean;
}): Promise<BulkModerationResult> {
  try {
    await assertAdminSession();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }

  const parsed = bulkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid bulk moderation payload." };
  }

  const { assetIds, operation, reason, note, deleteFromStorage } = parsed.data;
  const uniqueIds = Array.from(new Set(assetIds));
  const failed: Array<{ id: string; error: string }> = [];
  let processed = 0;

  for (const id of uniqueIds) {
    let result: ModerationResult;
    if (operation === "FLAG") result = await flagUploadAsset(id, reason, note);
    else if (operation === "QUARANTINE") result = await quarantineUploadAsset(id, reason, note);
    else if (operation === "RESTORE") result = await restoreUploadAsset(id, note);
    else if (operation === "REMOVE") {
      result = await removeUploadAsset(id, "REMOVE", {
        reason,
        note,
        deleteFromStorage: !!deleteFromStorage,
      });
    } else {
      result = await reprocessUploadAsset(id, note);
    }

    if (!result.success) {
      failed.push({ id, error: result.error });
      continue;
    }
    processed += 1;
  }

  await revalidateUploadPaths();
  return { success: true, processed, failed };
}
