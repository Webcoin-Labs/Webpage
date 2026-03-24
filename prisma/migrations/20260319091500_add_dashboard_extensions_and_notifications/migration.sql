ALTER TABLE "BuilderProfile"
ADD COLUMN "achievements" TEXT,
ADD COLUMN "openSourceContributions" TEXT,
ADD COLUMN "resumeUrl" TEXT;

ALTER TABLE "InvestorProfile"
ADD COLUMN "ticketSize" TEXT,
ADD COLUMN "lookingFor" TEXT,
ADD COLUMN "investmentThesis" TEXT;

CREATE TABLE "BuilderProject" (
  "id" TEXT NOT NULL,
  "builderId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT,
  "imageUrl" TEXT,
  "achievements" TEXT,
  "openSourceContributions" TEXT,
  "githubUrl" TEXT,
  "liveUrl" TEXT,
  "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BuilderProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "featureUrl" TEXT,
  "targetRoles" "Role"[] NOT NULL DEFAULT ARRAY['BUILDER'::"Role",'FOUNDER'::"Role",'INVESTOR'::"Role",'ADMIN'::"Role"],
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationRead" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InviteOnlyCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InviteOnlyCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InviteOnlyMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InviteOnlyMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationRead_notificationId_userId_key" ON "NotificationRead"("notificationId", "userId");
CREATE UNIQUE INDEX "InviteOnlyCode_code_key" ON "InviteOnlyCode"("code");
CREATE UNIQUE INDEX "InviteOnlyMembership_userId_key" ON "InviteOnlyMembership"("userId");

CREATE INDEX "BuilderProject_builderId_updatedAt_idx" ON "BuilderProject"("builderId", "updatedAt");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_createdById_createdAt_idx" ON "Notification"("createdById", "createdAt");
CREATE INDEX "NotificationRead_userId_readAt_idx" ON "NotificationRead"("userId", "readAt");
CREATE INDEX "InviteOnlyCode_isActive_createdAt_idx" ON "InviteOnlyCode"("isActive", "createdAt");
CREATE INDEX "InviteOnlyMembership_codeId_joinedAt_idx" ON "InviteOnlyMembership"("codeId", "joinedAt");

ALTER TABLE "BuilderProject"
ADD CONSTRAINT "BuilderProject_builderId_fkey"
FOREIGN KEY ("builderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NotificationRead"
ADD CONSTRAINT "NotificationRead_notificationId_fkey"
FOREIGN KEY ("notificationId") REFERENCES "Notification"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationRead"
ADD CONSTRAINT "NotificationRead_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InviteOnlyCode"
ADD CONSTRAINT "InviteOnlyCode_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InviteOnlyMembership"
ADD CONSTRAINT "InviteOnlyMembership_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InviteOnlyMembership"
ADD CONSTRAINT "InviteOnlyMembership_codeId_fkey"
FOREIGN KEY ("codeId") REFERENCES "InviteOnlyCode"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
