import "server-only";

import { prisma } from "@/lib/prisma";
import { scoreFounderToBuilder } from "@/lib/matching";
import type { DiscoveryService } from "@/server/services/contracts";

export const discoveryService: DiscoveryService = {
  async findBuilderMatches(founderUserId, take = 8) {
    const [founderProfile, builders] = await Promise.all([
      prisma.founderProfile.findUnique({ where: { userId: founderUserId } }),
      prisma.builderProfile.findMany({
        where: { publicVisible: true, userId: { not: founderUserId } },
        select: {
          userId: true,
          skills: true,
          preferredChains: true,
          openTo: true,
          interests: true,
          title: true,
          headline: true,
          bio: true,
        },
        take: 150,
      }),
    ]);
    if (!founderProfile) return [];
    return builders
      .map((builder) => ({ userId: builder.userId, match: scoreFounderToBuilder(founderProfile, builder) }))
      .filter((item) => item.match.score > 0)
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, take)
      .map((item) => ({ userId: item.userId, score: item.match.score, reasons: item.match.reasons }));
  },

  async findVentureMatches(investorUserId, take = 10) {
    const [investor, ventures] = await Promise.all([
      prisma.investorProfile.findUnique({
        where: { userId: investorUserId },
        select: { chainFocus: true, stageFocus: true, sectorFocus: true },
      }),
      prisma.venture.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          stage: true,
          chainEcosystem: true,
          description: true,
          tagline: true,
        },
        take: 250,
      }),
    ]);
    if (!investor) return [];
    const chainFocus = new Set(investor.chainFocus.map((x) => x.toLowerCase()));
    const stageFocus = new Set(investor.stageFocus.map((x) => x.toLowerCase()));
    const sectorFocus = new Set(investor.sectorFocus.map((x) => x.toLowerCase()));

    return ventures
      .map((venture) => {
        const reasons: string[] = [];
        let score = 0;
        if (venture.chainEcosystem && chainFocus.has(venture.chainEcosystem.toLowerCase())) {
          score += 40;
          reasons.push("Chain match");
        }
        if (venture.stage && stageFocus.has(venture.stage.toLowerCase())) {
          score += 30;
          reasons.push("Stage match");
        }
        const haystack = `${venture.description ?? ""} ${venture.tagline ?? ""}`.toLowerCase();
        const sectorHits = Array.from(sectorFocus).filter((sector) => haystack.includes(sector));
        if (sectorHits.length > 0) {
          score += Math.min(30, sectorHits.length * 10);
          reasons.push("Sector match");
        }
        return { ventureId: venture.id, score, reasons };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, take);
  },
};
