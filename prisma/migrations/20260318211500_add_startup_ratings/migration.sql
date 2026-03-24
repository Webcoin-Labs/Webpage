-- CreateTable
CREATE TABLE "StartupRating" (
  "id" TEXT NOT NULL,
  "startupId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StartupRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StartupRating_startupId_reviewerId_key" ON "StartupRating"("startupId", "reviewerId");
CREATE INDEX "StartupRating_startupId_createdAt_idx" ON "StartupRating"("startupId", "createdAt");
CREATE INDEX "StartupRating_reviewerId_createdAt_idx" ON "StartupRating"("reviewerId", "createdAt");

-- AddForeignKey
ALTER TABLE "StartupRating"
ADD CONSTRAINT "StartupRating_startupId_fkey"
FOREIGN KEY ("startupId") REFERENCES "Startup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StartupRating"
ADD CONSTRAINT "StartupRating_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
