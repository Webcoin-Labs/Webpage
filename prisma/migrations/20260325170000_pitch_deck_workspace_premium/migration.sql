-- Create enums for pitch workspace persistence
CREATE TYPE "PitchSectionQuality" AS ENUM ('STRONG', 'MODERATE', 'WEAK', 'MISSING', 'UNDERDEVELOPED');
CREATE TYPE "PitchDeckVersionType" AS ENUM ('ORIGINAL', 'AI_IMPROVED', 'STARTUP_DRAFT');

-- Persist section-level analysis per pitch deck/report
CREATE TABLE "PitchDeckSection" (
    "id" TEXT NOT NULL,
    "pitchDeckId" TEXT NOT NULL,
    "reportId" TEXT,
    "sectionKey" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "sectionOrder" INTEGER NOT NULL,
    "extractedText" TEXT NOT NULL,
    "qualityLabel" "PitchSectionQuality" NOT NULL,
    "goodPoints" JSONB,
    "unclearPoints" JSONB,
    "missingPoints" JSONB,
    "fixSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PitchDeckSection_pkey" PRIMARY KEY ("id")
);

-- Persist improved/draft deck versions generated from analysis
CREATE TABLE "PitchDeckVersion" (
    "id" TEXT NOT NULL,
    "pitchDeckId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT,
    "name" TEXT NOT NULL,
    "versionType" "PitchDeckVersionType" NOT NULL,
    "contentJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PitchDeckVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PitchDeckSection_pitchDeckId_sectionOrder_idx" ON "PitchDeckSection"("pitchDeckId", "sectionOrder");
CREATE INDEX "PitchDeckSection_reportId_createdAt_idx" ON "PitchDeckSection"("reportId", "createdAt");
CREATE INDEX "PitchDeckVersion_pitchDeckId_createdAt_idx" ON "PitchDeckVersion"("pitchDeckId", "createdAt");
CREATE INDEX "PitchDeckVersion_userId_createdAt_idx" ON "PitchDeckVersion"("userId", "createdAt");

ALTER TABLE "PitchDeckSection"
    ADD CONSTRAINT "PitchDeckSection_pitchDeckId_fkey"
    FOREIGN KEY ("pitchDeckId") REFERENCES "PitchDeck"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PitchDeckSection"
    ADD CONSTRAINT "PitchDeckSection_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "AIReport"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PitchDeckVersion"
    ADD CONSTRAINT "PitchDeckVersion_pitchDeckId_fkey"
    FOREIGN KEY ("pitchDeckId") REFERENCES "PitchDeck"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PitchDeckVersion"
    ADD CONSTRAINT "PitchDeckVersion_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PitchDeckVersion"
    ADD CONSTRAINT "PitchDeckVersion_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "AIReport"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

