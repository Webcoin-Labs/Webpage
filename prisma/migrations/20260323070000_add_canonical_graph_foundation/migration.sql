-- Canonical graph foundation (phased-compat, additive)

DO $$ BEGIN
    CREATE TYPE "ScoreKind" AS ENUM ('FOUNDER_LAUNCH_READINESS', 'BUILDER_PROOF', 'INVESTOR_FIT_HELPER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ScoreStatus" AS ENUM ('ACTIVE', 'UNDER_REVIEW', 'OVERRIDDEN', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "DiligenceStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'FINAL', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminAssignmentType" AS ENUM (
      'BUILDER_TO_FOUNDER',
      'FOUNDER_TO_INVESTOR',
      'INVESTOR_TO_VENTURE_REVIEW',
      'PROFILE_REVIEW',
      'TRUST_REVIEW'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "AdminAssignmentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "VisibilityEntityType" AS ENUM (
      'VENTURE',
      'BUILDER_PROFILE',
      'FOUNDER_PROFILE',
      'INVESTOR_PROFILE',
      'APPLICATION',
      'PITCH_DECK',
      'MEETING',
      'NOTE'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "VisibilityAccessLevel" AS ENUM ('PRIVATE', 'INTERNAL', 'SHARED', 'PUBLIC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ScoreSnapshot" (
  "id" TEXT NOT NULL,
  "kind" "ScoreKind" NOT NULL,
  "status" "ScoreStatus" NOT NULL DEFAULT 'ACTIVE',
  "label" TEXT,
  "score" INTEGER NOT NULL,
  "sourceVersion" TEXT NOT NULL DEFAULT 'v1',
  "factorsJson" JSONB NOT NULL,
  "scoredUserId" TEXT,
  "ventureId" TEXT,
  "overriddenByAdminId" TEXT,
  "overrideReason" TEXT,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DiligenceMemo" (
  "id" TEXT NOT NULL,
  "ventureId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "DiligenceStatus" NOT NULL DEFAULT 'DRAFT',
  "summary" TEXT,
  "sectionsJson" JSONB,
  "riskFlagsJson" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "isInternal" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiligenceMemo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminAssignment" (
  "id" TEXT NOT NULL,
  "type" "AdminAssignmentType" NOT NULL,
  "status" "AdminAssignmentStatus" NOT NULL DEFAULT 'OPEN',
  "createdByAdminId" TEXT NOT NULL,
  "assigneeAdminId" TEXT,
  "founderUserId" TEXT,
  "builderUserId" TEXT,
  "investorUserId" TEXT,
  "ventureId" TEXT,
  "legacyJobPostId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "AdminAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VisibilityRule" (
  "id" TEXT NOT NULL,
  "entityType" "VisibilityEntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "accessLevel" "VisibilityAccessLevel" NOT NULL,
  "appliesToRole" "Role",
  "allowedUserId" TEXT,
  "createdByAdminId" TEXT,
  "reason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisibilityRule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "canonicalVentureId" TEXT;
ALTER TABLE "Startup" ADD COLUMN IF NOT EXISTS "canonicalVentureId" TEXT;
ALTER TABLE "Investor" ADD COLUMN IF NOT EXISTS "canonicalInvestorProfileId" TEXT;

CREATE INDEX IF NOT EXISTS "ScoreSnapshot_kind_status_computedAt_idx" ON "ScoreSnapshot"("kind", "status", "computedAt");
CREATE INDEX IF NOT EXISTS "ScoreSnapshot_scoredUserId_kind_computedAt_idx" ON "ScoreSnapshot"("scoredUserId", "kind", "computedAt");
CREATE INDEX IF NOT EXISTS "ScoreSnapshot_ventureId_kind_computedAt_idx" ON "ScoreSnapshot"("ventureId", "kind", "computedAt");

CREATE INDEX IF NOT EXISTS "DiligenceMemo_ventureId_status_updatedAt_idx" ON "DiligenceMemo"("ventureId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "DiligenceMemo_authorUserId_updatedAt_idx" ON "DiligenceMemo"("authorUserId", "updatedAt");

CREATE INDEX IF NOT EXISTS "AdminAssignment_status_type_updatedAt_idx" ON "AdminAssignment"("status", "type", "updatedAt");
CREATE INDEX IF NOT EXISTS "AdminAssignment_assigneeAdminId_status_updatedAt_idx" ON "AdminAssignment"("assigneeAdminId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "AdminAssignment_ventureId_status_updatedAt_idx" ON "AdminAssignment"("ventureId", "status", "updatedAt");

CREATE INDEX IF NOT EXISTS "VisibilityRule_entityType_entityId_isActive_idx" ON "VisibilityRule"("entityType", "entityId", "isActive");
CREATE INDEX IF NOT EXISTS "VisibilityRule_appliesToRole_isActive_idx" ON "VisibilityRule"("appliesToRole", "isActive");
CREATE INDEX IF NOT EXISTS "VisibilityRule_allowedUserId_isActive_idx" ON "VisibilityRule"("allowedUserId", "isActive");

CREATE INDEX IF NOT EXISTS "Project_canonicalVentureId_idx" ON "Project"("canonicalVentureId");
CREATE INDEX IF NOT EXISTS "Startup_canonicalVentureId_idx" ON "Startup"("canonicalVentureId");
CREATE UNIQUE INDEX IF NOT EXISTS "Investor_canonicalInvestorProfileId_key" ON "Investor"("canonicalInvestorProfileId");
CREATE INDEX IF NOT EXISTS "Investor_canonicalInvestorProfileId_idx" ON "Investor"("canonicalInvestorProfileId");

DO $$ BEGIN
  ALTER TABLE "ScoreSnapshot"
    ADD CONSTRAINT "ScoreSnapshot_scoredUserId_fkey"
    FOREIGN KEY ("scoredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScoreSnapshot"
    ADD CONSTRAINT "ScoreSnapshot_ventureId_fkey"
    FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ScoreSnapshot"
    ADD CONSTRAINT "ScoreSnapshot_overriddenByAdminId_fkey"
    FOREIGN KEY ("overriddenByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DiligenceMemo"
    ADD CONSTRAINT "DiligenceMemo_ventureId_fkey"
    FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DiligenceMemo"
    ADD CONSTRAINT "DiligenceMemo_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAssignment"
    ADD CONSTRAINT "AdminAssignment_createdByAdminId_fkey"
    FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAssignment"
    ADD CONSTRAINT "AdminAssignment_assigneeAdminId_fkey"
    FOREIGN KEY ("assigneeAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAssignment"
    ADD CONSTRAINT "AdminAssignment_founderUserId_fkey"
    FOREIGN KEY ("founderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAssignment"
    ADD CONSTRAINT "AdminAssignment_builderUserId_fkey"
    FOREIGN KEY ("builderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAssignment"
    ADD CONSTRAINT "AdminAssignment_investorUserId_fkey"
    FOREIGN KEY ("investorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAssignment"
    ADD CONSTRAINT "AdminAssignment_ventureId_fkey"
    FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminAssignment"
    ADD CONSTRAINT "AdminAssignment_legacyJobPostId_fkey"
    FOREIGN KEY ("legacyJobPostId") REFERENCES "JobPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "VisibilityRule"
    ADD CONSTRAINT "VisibilityRule_allowedUserId_fkey"
    FOREIGN KEY ("allowedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "VisibilityRule"
    ADD CONSTRAINT "VisibilityRule_createdByAdminId_fkey"
    FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Project"
    ADD CONSTRAINT "Project_canonicalVentureId_fkey"
    FOREIGN KEY ("canonicalVentureId") REFERENCES "Venture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Startup"
    ADD CONSTRAINT "Startup_canonicalVentureId_fkey"
    FOREIGN KEY ("canonicalVentureId") REFERENCES "Venture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Investor"
    ADD CONSTRAINT "Investor_canonicalInvestorProfileId_fkey"
    FOREIGN KEY ("canonicalInvestorProfileId") REFERENCES "InvestorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

