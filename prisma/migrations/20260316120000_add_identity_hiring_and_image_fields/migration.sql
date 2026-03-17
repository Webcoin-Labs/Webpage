-- CreateEnum
CREATE TYPE "HiringInterestStatus" AS ENUM ('NEW', 'REVIEWING', 'CONTACTED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "BuilderProfile"
ADD COLUMN "affiliation" TEXT,
ADD COLUMN "independent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "openToWork" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "FounderProfile"
ADD COLUMN "companyLogoHeight" INTEGER,
ADD COLUMN "companyLogoMimeType" TEXT,
ADD COLUMN "companyLogoOriginalName" TEXT,
ADD COLUMN "companyLogoSize" INTEGER,
ADD COLUMN "companyLogoStorageKey" TEXT,
ADD COLUMN "companyLogoUrl" TEXT,
ADD COLUMN "companyLogoWidth" INTEGER,
ADD COLUMN "isHiring" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "imageHeight" INTEGER,
ADD COLUMN "imageMimeType" TEXT,
ADD COLUMN "imageOriginalName" TEXT,
ADD COLUMN "imageSize" INTEGER,
ADD COLUMN "imageStorageKey" TEXT,
ADD COLUMN "imageWidth" INTEGER;

-- CreateTable
CREATE TABLE "HiringInterest" (
    "id" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "founderProfileId" TEXT,
    "builderUserId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "portfolioUrl" TEXT,
    "message" TEXT,
    "source" TEXT,
    "founderNameSnapshot" TEXT,
    "companyNameSnapshot" TEXT,
    "status" "HiringInterestStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HiringInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HiringInterest_founderId_createdAt_idx" ON "HiringInterest"("founderId", "createdAt");

-- CreateIndex
CREATE INDEX "HiringInterest_builderUserId_createdAt_idx" ON "HiringInterest"("builderUserId", "createdAt");

-- CreateIndex
CREATE INDEX "HiringInterest_status_createdAt_idx" ON "HiringInterest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "HiringInterest" ADD CONSTRAINT "HiringInterest_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringInterest" ADD CONSTRAINT "HiringInterest_founderProfileId_fkey" FOREIGN KEY ("founderProfileId") REFERENCES "FounderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HiringInterest" ADD CONSTRAINT "HiringInterest_builderUserId_fkey" FOREIGN KEY ("builderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
