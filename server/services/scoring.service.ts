import "server-only";

import { prisma } from "@/lib/prisma";
import { buildScoreExplanation } from "@/features/scoring/engine";
import type { ScoringService } from "@/server/services/contracts";

function ratio(hasValue: boolean) {
  return hasValue ? 1 : 0;
}

function listRatio(list: unknown[] | null | undefined, target = 1) {
  const size = list?.length ?? 0;
  if (target <= 0) return 0;
  return Math.max(0, Math.min(1, size / target));
}

export const scoringService: ScoringService = {
  async computeFounderLaunchReadiness(userId) {
    const [founderProfile, ventures, pitchDecks, applications, meetings, updates] = await Promise.all([
      prisma.founderProfile.findUnique({ where: { userId } }),
      prisma.venture.findMany({ where: { ownerUserId: userId }, take: 10 }),
      prisma.pitchDeck.count({ where: { userId } }),
      prisma.investorApplication.count({ where: { founderUserId: userId } }),
      prisma.workspaceMeeting.count({ where: { hostUserId: userId } }),
      prisma.mutationAuditLog.count({
        where: {
          userId,
          action: { in: ["onboarding_progress", "raise_round_progress_update", "raise_round_upsert"] },
        },
      }),
    ]);

    return buildScoreExplanation({
      sourceVersion: "founder-readiness-v1",
      factors: [
        { key: "identity", label: "Founder identity profile", weight: 1.2, value: ratio(Boolean(founderProfile)) },
        { key: "venture", label: "Venture workspace completeness", weight: 1.3, value: listRatio(ventures, 1) },
        { key: "deck", label: "Pitch deck attached", weight: 1.1, value: pitchDecks > 0 ? 1 : 0 },
        { key: "investor_outreach", label: "Investor application activity", weight: 1, value: applications > 0 ? 1 : 0.35 },
        { key: "meetings", label: "Meeting momentum", weight: 0.8, value: meetings > 0 ? 1 : 0.3 },
        { key: "weekly_updates", label: "Execution update consistency", weight: 0.9, value: updates >= 4 ? 1 : updates >= 1 ? 0.5 : 0.2 },
      ],
    });
  },

  async computeBuilderProofScore(userId) {
    const [builderProfile, githubConnection, projects, resumes, updates, references] = await Promise.all([
      prisma.builderProfile.findUnique({ where: { userId } }),
      prisma.githubConnection.findUnique({ where: { userId } }),
      prisma.builderProject.findMany({ where: { builderId: userId }, take: 20 }),
      prisma.resumeDocument.count({ where: { userId, isActive: true } }),
      prisma.mutationAuditLog.count({
        where: {
          userId,
          action: { in: ["onboarding_progress", "tokenomics_rows_upsert", "openclaw_send_reply"] },
        },
      }),
      prisma.userBadge.count({ where: { userId } }),
    ]);

    const reposWithLinks = projects.filter((project) => Boolean(project.githubUrl)).length;
    const deployments = projects.filter((project) => Boolean(project.liveUrl)).length;

    return buildScoreExplanation({
      sourceVersion: "builder-proof-v1",
      factors: [
        { key: "profile", label: "Builder profile depth", weight: 1.1, value: ratio(Boolean(builderProfile?.bio && builderProfile.skills.length > 0)) },
        { key: "github_linked", label: "GitHub identity linked", weight: 1.3, value: ratio(Boolean(githubConnection?.username)) },
        { key: "project_count", label: "Shipped projects", weight: 1.1, value: listRatio(projects, 3) },
        { key: "repo_evidence", label: "Repository evidence", weight: 1, value: reposWithLinks > 0 ? Math.min(1, reposWithLinks / 3) : 0.1 },
        { key: "deployment_evidence", label: "Live deployment evidence", weight: 1, value: deployments > 0 ? Math.min(1, deployments / 2) : 0.1 },
        { key: "resume", label: "Resume and profile assets", weight: 0.6, value: resumes > 0 ? 1 : 0.2 },
        { key: "activity", label: "Recent build activity", weight: 0.8, value: updates >= 4 ? 1 : updates >= 1 ? 0.5 : 0.2 },
        { key: "references", label: "Badges and references", weight: 0.6, value: references > 0 ? 1 : 0.2 },
      ],
    });
  },

  async computeInvestorFitScore({ investorUserId, ventureId }) {
    const [investor, venture, applications, meetings, diligenceSignals] = await Promise.all([
      prisma.investorProfile.findUnique({ where: { userId: investorUserId } }),
      prisma.venture.findUnique({ where: { id: ventureId } }),
      prisma.investorApplication.count({ where: { investorUserId, ventureId } }),
      prisma.workspaceMeeting.count({
        where: {
          OR: [{ hostUserId: investorUserId }, { guestUserId: investorUserId }],
        },
      }),
      prisma.mutationAuditLog.count({
        where: {
          userId: investorUserId,
          entityType: { in: ["DueDiligenceMemo", "InvestorCommitment"] },
        },
      }),
    ]);

    const chainMatch = investor?.chainFocus?.some((chain) =>
      venture?.chainEcosystem ? chain.toLowerCase() === venture.chainEcosystem.toLowerCase() : false,
    );
    const stageMatch = investor?.stageFocus?.some((stage) =>
      venture?.stage ? stage.toLowerCase() === venture.stage.toLowerCase() : false,
    );
    const sectorMatch = investor?.sectorFocus?.some((sector) => {
      const haystack = `${venture?.description ?? ""} ${venture?.tagline ?? ""}`.toLowerCase();
      return haystack.includes(sector.toLowerCase());
    });

    return buildScoreExplanation({
      sourceVersion: "investor-fit-v1",
      factors: [
        { key: "chain", label: "Chain thesis match", weight: 1.2, value: chainMatch ? 1 : 0.25 },
        { key: "stage", label: "Stage thesis match", weight: 1.1, value: stageMatch ? 1 : 0.3 },
        { key: "sector", label: "Sector relevance", weight: 1, value: sectorMatch ? 1 : 0.35 },
        { key: "application", label: "Application engagement", weight: 0.8, value: applications > 0 ? 1 : 0.2 },
        { key: "meetings", label: "Meeting progress", weight: 0.8, value: meetings > 0 ? 1 : 0.2 },
        { key: "diligence", label: "Diligence signal depth", weight: 1, value: diligenceSignals > 0 ? 1 : 0.2 },
      ],
    });
  },
};
