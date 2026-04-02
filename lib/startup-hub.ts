import "server-only";

import { db } from "@/server/db/client";

export type StartupHubCard = {
  startupId: string;
  ventureId: string | null;
  slugOrId: string;
  name: string;
  tagline: string | null;
  stage: string | null;
  chain: string | null;
  founderName: string;
  founderRoleTitle: string | null;
  founderCompanyName: string | null;
  founderUsername: string | null;
  isHiring: boolean;
  website: string | null;
  githubRepo: string | null;
  ratingAverage: number | null;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StartupHubDetail = {
  card: StartupHubCard;
  founderCompanyLogoUrl: string | null;
  description: string | null;
  problem: string | null;
  solution: string | null;
  traction: string | null;
  revenue: string | null;
  usersCount: number | null;
    founderLinks: {
      twitter: string | null;
      linkedin: string | null;
      website: string | null;
  };
  startupLinks: {
    twitter: string | null;
    linkedin: string | null;
    website: string | null;
    githubRepo: string | null;
    pitchDeckUrl: string | null;
  };
  founderSignals: {
    whyThisStartup: string | null;
    targetUser: string | null;
    businessModel: string | null;
  };
  canonicalVenture: {
    id: string;
    name: string;
    stage: string | null;
    chain: string | null;
    website: string | null;
    githubUrl: string | null;
  } | null;
  ratings: Array<{
    score: number;
    note: string | null;
    reviewerName: string;
  }>;
  githubActivity: {
    repoName: string;
    repoUrl: string;
    lastCommitMessage: string | null;
  } | null;
};

export type StartupSignalSummary = {
  startupCount: number;
  linkedVentureCount: number;
  hiringCount: number;
};

function toRatingAverage(scores: number[]) {
  if (scores.length === 0) return null;
  return scores.reduce((acc, score) => acc + score, 0) / scores.length;
}

export async function listStartupHubCards(options?: {
  take?: number;
  search?: string;
}): Promise<StartupHubCard[]> {
  const take = Math.min(100, Math.max(10, options?.take ?? 60));
  const search = options?.search?.trim();

  const startups = await db.startup.findMany({
    where: {
      founder: {
        founderProfile: {
          is: {
            publicVisible: true,
          },
        },
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { tagline: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      founder: {
        select: {
          name: true,
          username: true,
          founderProfile: {
            select: {
              roleTitle: true,
              companyName: true,
              isHiring: true,
            },
          },
        },
      },
      ratings: {
        select: {
          score: true,
        },
      },
      canonicalVenture: {
        select: {
          id: true,
          stage: true,
          chainEcosystem: true,
          website: true,
          githubUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return startups.map((startup) => {
    const ratingScores = startup.ratings.map((rating) => rating.score);
    return {
      startupId: startup.id,
      ventureId: startup.canonicalVentureId,
      slugOrId: startup.slug ?? startup.id,
      name: startup.name,
      tagline: startup.tagline,
      stage: startup.stage ?? startup.canonicalVenture?.stage ?? null,
      chain: startup.chainFocus ?? startup.canonicalVenture?.chainEcosystem ?? null,
      founderName: startup.founder.name ?? "Founder",
      founderRoleTitle: startup.founder.founderProfile?.roleTitle ?? null,
      founderCompanyName: startup.founder.founderProfile?.companyName ?? null,
      founderUsername: startup.founder.username,
      isHiring: startup.founder.founderProfile?.isHiring ?? startup.isHiring,
      website: startup.website ?? startup.canonicalVenture?.website ?? null,
      githubRepo: startup.githubRepo ?? startup.canonicalVenture?.githubUrl ?? null,
      ratingAverage: toRatingAverage(ratingScores),
      ratingCount: ratingScores.length,
      createdAt: startup.createdAt,
      updatedAt: startup.updatedAt,
    };
  });
}

export async function getStartupHubDetailBySlugOrId(startupSlugOrId: string): Promise<StartupHubDetail | null> {
  const startup = await db.startup.findFirst({
    where: {
      AND: [
        { OR: [{ id: startupSlugOrId }, { slug: startupSlugOrId }] },
        { founder: { founderProfile: { is: { publicVisible: true } } } },
      ],
    },
    include: {
      founder: {
        select: {
          name: true,
          username: true,
          founderProfile: {
            select: {
              roleTitle: true,
              companyName: true,
              companyLogoUrl: true,
              twitter: true,
              linkedin: true,
              website: true,
              isHiring: true,
              currentNeeds: true,
            },
          },
          founderProfileExtended: {
            select: {
              targetUser: true,
              businessModel: true,
              whyThisStartup: true,
            },
          },
        },
      },
      canonicalVenture: {
        select: {
          id: true,
          name: true,
          stage: true,
          chainEcosystem: true,
          website: true,
          githubUrl: true,
        },
      },
      githubActivity: {
        select: {
          repoName: true,
          repoUrl: true,
          lastCommitMessage: true,
        },
      },
      ratings: {
        select: {
          score: true,
          note: true,
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
    },
  });

  if (!startup) return null;

  const card: StartupHubCard = {
    startupId: startup.id,
    ventureId: startup.canonicalVentureId,
    slugOrId: startup.slug ?? startup.id,
    name: startup.name,
    tagline: startup.tagline,
    stage: startup.stage ?? startup.canonicalVenture?.stage ?? null,
    chain: startup.chainFocus ?? startup.canonicalVenture?.chainEcosystem ?? null,
    founderName: startup.founder.name ?? "Founder",
    founderRoleTitle: startup.founder.founderProfile?.roleTitle ?? null,
    founderCompanyName: startup.founder.founderProfile?.companyName ?? null,
    founderUsername: startup.founder.username,
    isHiring: startup.founder.founderProfile?.isHiring ?? startup.isHiring,
    website: startup.website ?? startup.canonicalVenture?.website ?? null,
    githubRepo: startup.githubRepo ?? startup.canonicalVenture?.githubUrl ?? null,
    ratingAverage: toRatingAverage(startup.ratings.map((rating) => rating.score)),
    ratingCount: startup.ratings.length,
    createdAt: startup.createdAt,
    updatedAt: startup.updatedAt,
  };

  return {
    card,
    description: startup.description,
    founderCompanyLogoUrl: startup.founder.founderProfile?.companyLogoUrl ?? null,
    problem: startup.problem,
    solution: startup.solution,
    traction: startup.traction,
    revenue: startup.revenue,
    usersCount: startup.usersCount,
    founderLinks: {
      twitter: startup.founder.founderProfile?.twitter ?? null,
      linkedin: startup.founder.founderProfile?.linkedin ?? null,
      website: startup.founder.founderProfile?.website ?? null,
    },
    startupLinks: {
      twitter: startup.twitter,
      linkedin: startup.linkedin,
      website: startup.website,
      githubRepo: startup.githubRepo,
      pitchDeckUrl: startup.pitchDeckUrl,
    },
    founderSignals: {
      whyThisStartup: startup.founder.founderProfileExtended?.whyThisStartup ?? null,
      targetUser: startup.founder.founderProfileExtended?.targetUser ?? null,
      businessModel: startup.founder.founderProfileExtended?.businessModel ?? null,
    },
    canonicalVenture: startup.canonicalVenture
      ? {
          id: startup.canonicalVenture.id,
          name: startup.canonicalVenture.name,
          stage: startup.canonicalVenture.stage,
          chain: startup.canonicalVenture.chainEcosystem,
          website: startup.canonicalVenture.website,
          githubUrl: startup.canonicalVenture.githubUrl,
        }
      : null,
    ratings: startup.ratings.map((rating) => ({
      score: rating.score,
      note: rating.note,
      reviewerName: rating.reviewer.name ?? "Founder",
    })),
    githubActivity: startup.githubActivity
      ? {
          repoName: startup.githubActivity.repoName,
          repoUrl: startup.githubActivity.repoUrl,
          lastCommitMessage: startup.githubActivity.lastCommitMessage,
        }
      : null,
  };
}

export async function getStartupHubDetailByVentureId(ventureId: string) {
  const [venture, startupDetail] = await Promise.all([
    db.venture.findUnique({
      where: { id: ventureId },
      include: {
        raiseRounds: {
          where: { isActive: true },
          orderBy: { updatedAt: "desc" },
          take: 3,
        },
      },
    }),
    db.startup.findFirst({
      where: { canonicalVentureId: ventureId },
      select: { id: true, slug: true },
    }),
  ]);

  if (!venture) return null;

  const startup = startupDetail
    ? await getStartupHubDetailBySlugOrId(startupDetail.slug ?? startupDetail.id)
    : null;

  return {
    venture,
    startup,
  };
}

export async function getStartupSignalSummary(): Promise<StartupSignalSummary> {
  const [startupCount, linkedVentureCount, hiringCount] = await Promise.all([
    db.startup.count(),
    db.startup.count({ where: { canonicalVentureId: { not: null } } }),
    db.startup.count({ where: { isHiring: true } }),
  ]);

  return {
    startupCount,
    linkedVentureCount,
    hiringCount,
  };
}
