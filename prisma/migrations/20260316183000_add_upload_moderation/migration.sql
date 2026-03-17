-- CreateEnum
CREATE TYPE "UploadAssetType" AS ENUM ('AVATAR', 'COMPANY_LOGO', 'PITCH_DECK', 'OTHER');

-- CreateEnum
CREATE TYPE "UploadModerationStatus" AS ENUM ('ACTIVE', 'FLAGGED', 'QUARANTINED', 'REMOVED', 'FAILED', 'REPROCESSING');

-- CreateEnum
CREATE TYPE "UploadModerationAction" AS ENUM (
  'CREATED',
  'FLAGGED',
  'QUARANTINED',
  'RESTORED',
  'REMOVED',
  'REPROCESSING_STARTED',
  'REPROCESSING_SUCCEEDED',
  'REPROCESSING_FAILED',
  'NOTE_UPDATED'
);

-- CreateTable
CREATE TABLE "UploadAsset" (
  "id" TEXT NOT NULL,
  "assetType" "UploadAssetType" NOT NULL,
  "status" "UploadModerationStatus" NOT NULL DEFAULT 'ACTIVE',
  "fileUrl" TEXT NOT NULL,
  "storageKey" TEXT,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "originalName" TEXT,
  "ownerUserId" TEXT,
  "userId" TEXT,
  "founderProfileId" TEXT,
  "pitchDeckId" TEXT,
  "relatedEntityType" TEXT,
  "relatedEntityId" TEXT,
  "moderationReason" TEXT,
  "moderationNote" TEXT,
  "moderatedByUserId" TEXT,
  "moderatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UploadAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadModerationLog" (
  "id" TEXT NOT NULL,
  "uploadAssetId" TEXT NOT NULL,
  "action" "UploadModerationAction" NOT NULL,
  "fromStatus" "UploadModerationStatus",
  "toStatus" "UploadModerationStatus",
  "reason" TEXT,
  "note" TEXT,
  "actedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UploadModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadAsset_storageKey_key" ON "UploadAsset"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "UploadAsset_userId_key" ON "UploadAsset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UploadAsset_founderProfileId_key" ON "UploadAsset"("founderProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UploadAsset_pitchDeckId_key" ON "UploadAsset"("pitchDeckId");

-- CreateIndex
CREATE INDEX "UploadAsset_assetType_status_createdAt_idx" ON "UploadAsset"("assetType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "UploadAsset_ownerUserId_createdAt_idx" ON "UploadAsset"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "UploadAsset_status_updatedAt_idx" ON "UploadAsset"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "UploadModerationLog_uploadAssetId_createdAt_idx" ON "UploadModerationLog"("uploadAssetId", "createdAt");

-- CreateIndex
CREATE INDEX "UploadModerationLog_action_createdAt_idx" ON "UploadModerationLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "UploadAsset"
ADD CONSTRAINT "UploadAsset_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadAsset"
ADD CONSTRAINT "UploadAsset_moderatedByUserId_fkey"
FOREIGN KEY ("moderatedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadAsset"
ADD CONSTRAINT "UploadAsset_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadAsset"
ADD CONSTRAINT "UploadAsset_founderProfileId_fkey"
FOREIGN KEY ("founderProfileId") REFERENCES "FounderProfile"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadAsset"
ADD CONSTRAINT "UploadAsset_pitchDeckId_fkey"
FOREIGN KEY ("pitchDeckId") REFERENCES "PitchDeck"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadModerationLog"
ADD CONSTRAINT "UploadModerationLog_uploadAssetId_fkey"
FOREIGN KEY ("uploadAssetId") REFERENCES "UploadAsset"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadModerationLog"
ADD CONSTRAINT "UploadModerationLog_actedByUserId_fkey"
FOREIGN KEY ("actedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
