-- Founder OS expansion hardening migration
-- Safe-forward SQL for environments with partial schema drift.

-- Round aggregate rollups
ALTER TABLE "RaiseRound"
  ADD COLUMN IF NOT EXISTS "committedAmount" DECIMAL(24,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "interestedAmount" DECIMAL(24,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "coverageRatio" DECIMAL(8,4);

-- Telegram idempotency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'TelegramMessage_threadId_externalMessageId_key'
  ) THEN
    CREATE UNIQUE INDEX "TelegramMessage_threadId_externalMessageId_key"
      ON "TelegramMessage" ("threadId", "externalMessageId");
  END IF;
END $$;

-- Enforce single active round per venture at DB level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'raise_round_single_active_per_venture_idx'
  ) THEN
    CREATE UNIQUE INDEX "raise_round_single_active_per_venture_idx"
      ON "RaiseRound" ("ventureId")
      WHERE "isActive" = true;
  END IF;
END $$;

-- Tokenomics revision history
CREATE TABLE IF NOT EXISTS "TokenomicsScenarioRevision" (
  "id" TEXT NOT NULL,
  "scenarioId" TEXT NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "createdById" TEXT NOT NULL,
  "reason" TEXT,
  "snapshotJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TokenomicsScenarioRevision_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TokenomicsScenarioRevision_scenarioId_fkey'
  ) THEN
    ALTER TABLE "TokenomicsScenarioRevision"
      ADD CONSTRAINT "TokenomicsScenarioRevision_scenarioId_fkey"
      FOREIGN KEY ("scenarioId") REFERENCES "TokenomicsScenario"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TokenomicsScenarioRevision_createdById_fkey'
  ) THEN
    ALTER TABLE "TokenomicsScenarioRevision"
      ADD CONSTRAINT "TokenomicsScenarioRevision_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "TokenomicsScenarioRevision_scenarioId_revisionNumber_key"
  ON "TokenomicsScenarioRevision" ("scenarioId", "revisionNumber");
CREATE INDEX IF NOT EXISTS "TokenomicsScenarioRevision_scenarioId_createdAt_idx"
  ON "TokenomicsScenarioRevision" ("scenarioId", "createdAt");

-- Mutation audit log
CREATE TABLE IF NOT EXISTS "MutationAuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MutationAuditLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'MutationAuditLog_userId_fkey'
  ) THEN
    ALTER TABLE "MutationAuditLog"
      ADD CONSTRAINT "MutationAuditLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "MutationAuditLog_entityType_entityId_createdAt_idx"
  ON "MutationAuditLog" ("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "MutationAuditLog_userId_createdAt_idx"
  ON "MutationAuditLog" ("userId", "createdAt");
