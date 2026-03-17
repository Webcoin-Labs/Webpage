import { prisma } from "@/lib/prisma";
import { UploadAssetType, UploadModerationAction, UploadModerationStatus } from "@prisma/client";

type AssetPayload = {
  fileUrl: string;
  storageKey?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  originalName?: string | null;
  ownerUserId?: string | null;
};

async function createInitialLog(uploadAssetId: string, actedByUserId?: string | null) {
  await prisma.uploadModerationLog.create({
    data: {
      uploadAssetId,
      action: UploadModerationAction.CREATED,
      toStatus: UploadModerationStatus.ACTIVE,
      actedByUserId: actedByUserId ?? null,
      note: "Asset registered for moderation lifecycle.",
    },
  });
}

export async function upsertAvatarUploadAsset(userId: string, payload: AssetPayload) {
  const existing = await prisma.uploadAsset.findUnique({ where: { userId } });
  if (existing) {
    return prisma.uploadAsset.update({
      where: { userId },
      data: {
        assetType: UploadAssetType.AVATAR,
        status: UploadModerationStatus.ACTIVE,
        fileUrl: payload.fileUrl,
        storageKey: payload.storageKey ?? null,
        mimeType: payload.mimeType ?? null,
        fileSize: payload.fileSize ?? null,
        width: payload.width ?? null,
        height: payload.height ?? null,
        originalName: payload.originalName ?? null,
        ownerUserId: payload.ownerUserId ?? null,
        moderationReason: null,
        moderationNote: null,
      },
    });
  }

  const created = await prisma.uploadAsset.create({
    data: {
      assetType: UploadAssetType.AVATAR,
      status: UploadModerationStatus.ACTIVE,
      userId,
      ownerUserId: payload.ownerUserId ?? userId,
      fileUrl: payload.fileUrl,
      storageKey: payload.storageKey ?? null,
      mimeType: payload.mimeType ?? null,
      fileSize: payload.fileSize ?? null,
      width: payload.width ?? null,
      height: payload.height ?? null,
      originalName: payload.originalName ?? null,
    },
  });
  await createInitialLog(created.id, payload.ownerUserId ?? userId);
  return created;
}

export async function upsertFounderLogoUploadAsset(founderProfileId: string, payload: AssetPayload) {
  const existing = await prisma.uploadAsset.findUnique({ where: { founderProfileId } });
  if (existing) {
    return prisma.uploadAsset.update({
      where: { founderProfileId },
      data: {
        assetType: UploadAssetType.COMPANY_LOGO,
        status: UploadModerationStatus.ACTIVE,
        fileUrl: payload.fileUrl,
        storageKey: payload.storageKey ?? null,
        mimeType: payload.mimeType ?? null,
        fileSize: payload.fileSize ?? null,
        width: payload.width ?? null,
        height: payload.height ?? null,
        originalName: payload.originalName ?? null,
        ownerUserId: payload.ownerUserId ?? null,
        moderationReason: null,
        moderationNote: null,
      },
    });
  }

  const created = await prisma.uploadAsset.create({
    data: {
      assetType: UploadAssetType.COMPANY_LOGO,
      status: UploadModerationStatus.ACTIVE,
      founderProfileId,
      ownerUserId: payload.ownerUserId ?? null,
      fileUrl: payload.fileUrl,
      storageKey: payload.storageKey ?? null,
      mimeType: payload.mimeType ?? null,
      fileSize: payload.fileSize ?? null,
      width: payload.width ?? null,
      height: payload.height ?? null,
      originalName: payload.originalName ?? null,
    },
  });
  await createInitialLog(created.id, payload.ownerUserId ?? null);
  return created;
}

export async function upsertPitchDeckUploadAsset(pitchDeckId: string, payload: AssetPayload) {
  const existing = await prisma.uploadAsset.findUnique({ where: { pitchDeckId } });
  if (existing) {
    return prisma.uploadAsset.update({
      where: { pitchDeckId },
      data: {
        assetType: UploadAssetType.PITCH_DECK,
        status: UploadModerationStatus.ACTIVE,
        fileUrl: payload.fileUrl,
        storageKey: payload.storageKey ?? null,
        mimeType: payload.mimeType ?? null,
        fileSize: payload.fileSize ?? null,
        width: payload.width ?? null,
        height: payload.height ?? null,
        originalName: payload.originalName ?? null,
        ownerUserId: payload.ownerUserId ?? null,
        moderationReason: null,
      },
    });
  }

  const created = await prisma.uploadAsset.create({
    data: {
      assetType: UploadAssetType.PITCH_DECK,
      status: UploadModerationStatus.ACTIVE,
      pitchDeckId,
      ownerUserId: payload.ownerUserId ?? null,
      fileUrl: payload.fileUrl,
      storageKey: payload.storageKey ?? null,
      mimeType: payload.mimeType ?? null,
      fileSize: payload.fileSize ?? null,
      width: payload.width ?? null,
      height: payload.height ?? null,
      originalName: payload.originalName ?? null,
    },
  });
  await createInitialLog(created.id, payload.ownerUserId ?? null);
  return created;
}

export function isUploadVisibleStatus(status?: UploadModerationStatus | null) {
  if (!status) return true;
  return !["QUARANTINED", "REMOVED", "FAILED"].includes(status);
}
