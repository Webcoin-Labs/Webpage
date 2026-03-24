-- CreateEnum
CREATE TYPE "StartupStage" AS ENUM ('IDEA', 'MVP', 'EARLY', 'GROWTH');

-- CreateEnum
CREATE TYPE "StartupChainFocus" AS ENUM ('SOLANA', 'BASE', 'ETHEREUM', 'ARC');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('ARC_DEVELOPER', 'SOLANA_DEVELOPER', 'ETHEREUM_DEVELOPER', 'BASE_BUILDER');

-- CreateEnum
CREATE TYPE "InvestorIntroStatus" AS ENUM ('PENDING', 'REVIEWING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ChatContextType" AS ENUM ('GENERAL', 'HIRING', 'FUNDING', 'BUILD');

-- CreateTable
CREATE TABLE "Startup" (
  "id" TEXT NOT NULL,
  "founderId" TEXT NOT NULL,
  "slug" TEXT,
  "name" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT,
  "stage" "StartupStage" NOT NULL,
  "chainFocus" "StartupChainFocus" NOT NULL,
  "website" TEXT,
  "twitter" TEXT,
  "linkedin" TEXT,
  "pitchDeckUrl" TEXT,
  "githubRepo" TEXT,
  "problem" TEXT,
  "solution" TEXT,
  "traction" TEXT,
  "revenue" TEXT,
  "usersCount" INTEGER,
  "isHiring" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Startup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderProfileExtended" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "whyThisStartup" TEXT,
  "problemStatement" TEXT,
  "targetUser" TEXT,
  "businessModel" TEXT,
  "competitors" TEXT,
  "differentiation" TEXT,
  "longTermVision" TEXT,
  "freeTimeActivities" TEXT,
  "pastExperience" TEXT,
  "whyYou" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FounderProfileExtended_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CofounderPreferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleWanted" TEXT NOT NULL,
  "equityExpectation" TEXT,
  "timeCommitment" TEXT,
  "remotePreference" TEXT,
  "skillsNeeded" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "motivation" TEXT,
  "expectations" TEXT,
  "workingStyle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CofounderPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GithubConnection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "profileUrl" TEXT,
  "accessMode" TEXT NOT NULL DEFAULT 'mock',
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GithubConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartupGithubActivity" (
  "id" TEXT NOT NULL,
  "startupId" TEXT NOT NULL,
  "repoUrl" TEXT NOT NULL,
  "repoName" TEXT NOT NULL,
  "lastCommitHash" TEXT,
  "lastCommitMessage" TEXT,
  "lastCommitAt" TIMESTAMP(3),
  "commitActivityJson" JSONB,
  "contributorsJson" JSONB,
  "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StartupGithubActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badgeType" "BadgeType" NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "sourceNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fundName" TEXT NOT NULL,
  "investmentStage" TEXT NOT NULL,
  "ticketSize" TEXT,
  "thesis" TEXT,
  "chainsInterested" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorIntroRequest" (
  "id" TEXT NOT NULL,
  "founderId" TEXT NOT NULL,
  "startupId" TEXT NOT NULL,
  "investorUserId" TEXT NOT NULL,
  "status" "InvestorIntroStatus" NOT NULL DEFAULT 'PENDING',
  "generatedEmail" TEXT,
  "founderNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InvestorIntroRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatThread" (
  "id" TEXT NOT NULL,
  "startupId" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contextType" "ChatContextType" NOT NULL DEFAULT 'GENERAL',
  "contextLabel" TEXT,
  "inviteToken" TEXT NOT NULL,
  "isGroup" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParticipant" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleLabel" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingLink" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "calendlyUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MeetingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingRecord" (
  "id" TEXT NOT NULL,
  "startupId" TEXT,
  "hostUserId" TEXT NOT NULL,
  "attendeeUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MeetingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketSignal" (
  "id" TEXT NOT NULL,
  "createdById" TEXT,
  "source" TEXT NOT NULL,
  "signalType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "signalUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FounderMarketInsight" (
  "id" TEXT NOT NULL,
  "founderId" TEXT NOT NULL,
  "startupId" TEXT,
  "founderPainPoints" TEXT NOT NULL,
  "trendingProblems" TEXT NOT NULL,
  "generatedBy" TEXT DEFAULT 'GEMINI',
  "sourceSignalCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FounderMarketInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Startup_slug_key" ON "Startup"("slug");
CREATE INDEX "Startup_founderId_createdAt_idx" ON "Startup"("founderId", "createdAt");
CREATE INDEX "Startup_stage_chainFocus_createdAt_idx" ON "Startup"("stage", "chainFocus", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FounderProfileExtended_userId_key" ON "FounderProfileExtended"("userId");
CREATE UNIQUE INDEX "CofounderPreferences_userId_key" ON "CofounderPreferences"("userId");
CREATE UNIQUE INDEX "GithubConnection_userId_key" ON "GithubConnection"("userId");
CREATE UNIQUE INDEX "StartupGithubActivity_startupId_key" ON "StartupGithubActivity"("startupId");
CREATE UNIQUE INDEX "UserBadge_userId_badgeType_key" ON "UserBadge"("userId", "badgeType");
CREATE INDEX "UserBadge_badgeType_createdAt_idx" ON "UserBadge"("badgeType", "createdAt");
CREATE UNIQUE INDEX "Investor_userId_key" ON "Investor"("userId");
CREATE INDEX "InvestorIntroRequest_founderId_createdAt_idx" ON "InvestorIntroRequest"("founderId", "createdAt");
CREATE INDEX "InvestorIntroRequest_investorUserId_createdAt_idx" ON "InvestorIntroRequest"("investorUserId", "createdAt");
CREATE INDEX "InvestorIntroRequest_startupId_createdAt_idx" ON "InvestorIntroRequest"("startupId", "createdAt");
CREATE UNIQUE INDEX "ChatThread_inviteToken_key" ON "ChatThread"("inviteToken");
CREATE INDEX "ChatThread_createdByUserId_createdAt_idx" ON "ChatThread"("createdByUserId", "createdAt");
CREATE INDEX "ChatThread_startupId_createdAt_idx" ON "ChatThread"("startupId", "createdAt");
CREATE UNIQUE INDEX "ChatParticipant_threadId_userId_key" ON "ChatParticipant"("threadId", "userId");
CREATE INDEX "ChatMessage_threadId_createdAt_idx" ON "ChatMessage"("threadId", "createdAt");
CREATE UNIQUE INDEX "MeetingLink_userId_key" ON "MeetingLink"("userId");
CREATE INDEX "MeetingRecord_hostUserId_scheduledAt_idx" ON "MeetingRecord"("hostUserId", "scheduledAt");
CREATE INDEX "MeetingRecord_attendeeUserId_scheduledAt_idx" ON "MeetingRecord"("attendeeUserId", "scheduledAt");
CREATE INDEX "MarketSignal_source_createdAt_idx" ON "MarketSignal"("source", "createdAt");
CREATE INDEX "FounderMarketInsight_founderId_createdAt_idx" ON "FounderMarketInsight"("founderId", "createdAt");

-- AddForeignKey
ALTER TABLE "Startup"
ADD CONSTRAINT "Startup_founderId_fkey"
FOREIGN KEY ("founderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FounderProfileExtended"
ADD CONSTRAINT "FounderProfileExtended_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CofounderPreferences"
ADD CONSTRAINT "CofounderPreferences_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GithubConnection"
ADD CONSTRAINT "GithubConnection_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StartupGithubActivity"
ADD CONSTRAINT "StartupGithubActivity_startupId_fkey"
FOREIGN KEY ("startupId") REFERENCES "Startup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserBadge"
ADD CONSTRAINT "UserBadge_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Investor"
ADD CONSTRAINT "Investor_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvestorIntroRequest"
ADD CONSTRAINT "InvestorIntroRequest_founderId_fkey"
FOREIGN KEY ("founderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvestorIntroRequest"
ADD CONSTRAINT "InvestorIntroRequest_startupId_fkey"
FOREIGN KEY ("startupId") REFERENCES "Startup"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InvestorIntroRequest"
ADD CONSTRAINT "InvestorIntroRequest_investorUserId_fkey"
FOREIGN KEY ("investorUserId") REFERENCES "Investor"("userId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatThread"
ADD CONSTRAINT "ChatThread_startupId_fkey"
FOREIGN KEY ("startupId") REFERENCES "Startup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ChatThread"
ADD CONSTRAINT "ChatThread_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatParticipant"
ADD CONSTRAINT "ChatParticipant_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatParticipant"
ADD CONSTRAINT "ChatParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage"
ADD CONSTRAINT "ChatMessage_threadId_fkey"
FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage"
ADD CONSTRAINT "ChatMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MeetingLink"
ADD CONSTRAINT "MeetingLink_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MeetingRecord"
ADD CONSTRAINT "MeetingRecord_startupId_fkey"
FOREIGN KEY ("startupId") REFERENCES "Startup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MeetingRecord"
ADD CONSTRAINT "MeetingRecord_hostUserId_fkey"
FOREIGN KEY ("hostUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MeetingRecord"
ADD CONSTRAINT "MeetingRecord_attendeeUserId_fkey"
FOREIGN KEY ("attendeeUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketSignal"
ADD CONSTRAINT "MarketSignal_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FounderMarketInsight"
ADD CONSTRAINT "FounderMarketInsight_founderId_fkey"
FOREIGN KEY ("founderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FounderMarketInsight"
ADD CONSTRAINT "FounderMarketInsight_startupId_fkey"
FOREIGN KEY ("startupId") REFERENCES "Startup"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
