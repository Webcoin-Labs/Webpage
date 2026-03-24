import "server-only";

import { Prisma, ScoreKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { scoringService } from "@/server/services/scoring.service";
import type { ScoreExplanation } from "@/server/services/contracts";

function scoreLabel(value: number) {
  if (value >= 75) return "strong";
  if (value >= 45) return "moderate";
  return "missing";
}

export async function createAdminAssignment(input: {
  createdByAdminId: string;
  type: "BUILDER_TO_FOUNDER" | "FOUNDER_TO_INVESTOR" | "INVESTOR_TO_VENTURE_REVIEW" | "PROFILE_REVIEW" | "TRUST_REVIEW";
  founderUserId?: string | null;
  builderUserId?: string | null;
  investorUserId?: string | null;
  ventureId?: string | null;
  note?: string | null;
}) {
  const assignment = await prisma.adminAssignment.create({
    data: {
      createdByAdminId: input.createdByAdminId,
      type: input.type,
      founderUserId: input.founderUserId ?? null,
      builderUserId: input.builderUserId ?? null,
      investorUserId: input.investorUserId ?? null,
      ventureId: input.ventureId ?? null,
      note: input.note ?? null,
      status: "OPEN",
    },
  });
  await writeAuditLog({
    userId: input.createdByAdminId,
    action: "admin_create_assignment",
    entityType: "AdminAssignment",
    entityId: assignment.id,
    metadata: {
      type: input.type,
      founderUserId: input.founderUserId ?? null,
      builderUserId: input.builderUserId ?? null,
      investorUserId: input.investorUserId ?? null,
      ventureId: input.ventureId ?? null,
    },
  });
  return assignment;
}

export async function updateAdminAssignmentStatus(input: {
  assignmentId: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";
  assigneeAdminId?: string | null;
}) {
  const assignment = await prisma.adminAssignment.update({
    where: { id: input.assignmentId },
    data: {
      status: input.status,
      assigneeAdminId: input.assigneeAdminId ?? undefined,
      resolvedAt: input.status === "RESOLVED" || input.status === "DISMISSED" ? new Date() : null,
    },
  });
  await writeAuditLog({
    userId: input.assigneeAdminId ?? null,
    action: "admin_update_assignment_status",
    entityType: "AdminAssignment",
    entityId: assignment.id,
    metadata: {
      status: input.status,
    },
  });
  return assignment;
}

export async function createDiligenceMemo(input: {
  authorUserId: string;
  ventureId: string;
  title: string;
  summary?: string | null;
  sectionsJson?: Prisma.InputJsonValue | null;
  riskFlagsJson?: Prisma.InputJsonValue | null;
  isInternal?: boolean;
}) {
  const memo = await prisma.diligenceMemo.create({
    data: {
      authorUserId: input.authorUserId,
      ventureId: input.ventureId,
      title: input.title,
      summary: input.summary ?? null,
      sectionsJson: input.sectionsJson ?? Prisma.JsonNull,
      riskFlagsJson: input.riskFlagsJson ?? Prisma.JsonNull,
      isInternal: input.isInternal ?? true,
      status: "DRAFT",
    },
  });
  await writeAuditLog({
    userId: input.authorUserId,
    action: "create_diligence_memo",
    entityType: "DiligenceMemo",
    entityId: memo.id,
    metadata: {
      ventureId: input.ventureId,
      isInternal: input.isInternal ?? true,
    },
  });
  return memo;
}

export async function overrideScoreSnapshot(input: {
  snapshotId: string;
  adminUserId: string;
  status: "ACTIVE" | "UNDER_REVIEW" | "OVERRIDDEN" | "ARCHIVED";
  reason?: string | null;
}) {
  const snapshot = await prisma.scoreSnapshot.update({
    where: { id: input.snapshotId },
    data: {
      status: input.status,
      overriddenByAdminId: input.adminUserId,
      overrideReason: input.reason ?? null,
    },
  });
  await writeAuditLog({
    userId: input.adminUserId,
    action: "admin_override_score_snapshot",
    entityType: "ScoreSnapshot",
    entityId: snapshot.id,
    metadata: {
      status: input.status,
      reason: input.reason ?? null,
    },
  });
  return snapshot;
}

async function persistScoreSnapshot(input: {
  kind: ScoreKind;
  explanation: ScoreExplanation;
  scoredUserId?: string | null;
  ventureId?: string | null;
}) {
  return prisma.scoreSnapshot.create({
    data: {
      kind: input.kind,
      status: "ACTIVE",
      score: input.explanation.score,
      label: scoreLabel(input.explanation.score),
      sourceVersion: input.explanation.sourceVersion,
      factorsJson: input.explanation.factors as Prisma.InputJsonValue,
      scoredUserId: input.scoredUserId ?? null,
      ventureId: input.ventureId ?? null,
      computedAt: new Date(input.explanation.lastComputedAt),
    },
  });
}

export async function recomputeFounderReadinessSnapshot(userId: string) {
  const explanation = await scoringService.computeFounderLaunchReadiness(userId);
  return persistScoreSnapshot({
    kind: "FOUNDER_LAUNCH_READINESS",
    explanation,
    scoredUserId: userId,
  });
}

export async function recomputeBuilderProofSnapshot(userId: string) {
  const explanation = await scoringService.computeBuilderProofScore(userId);
  return persistScoreSnapshot({
    kind: "BUILDER_PROOF",
    explanation,
    scoredUserId: userId,
  });
}

export async function recomputeInvestorFitSnapshot(investorUserId: string, ventureId: string) {
  const explanation = await scoringService.computeInvestorFitScore({ investorUserId, ventureId });
  return persistScoreSnapshot({
    kind: "INVESTOR_FIT_HELPER",
    explanation,
    scoredUserId: investorUserId,
    ventureId,
  });
}
