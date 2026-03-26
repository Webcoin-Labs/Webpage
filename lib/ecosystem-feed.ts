import "server-only";

import type { FeedPostType, Role } from "@prisma/client";
import { db } from "@/server/db/client";

export type FeedScope = "GLOBAL" | "FOUNDER" | "BUILDER" | "INVESTOR";

export type EcosystemFeedItem = {
  id: string;
  source: "FEED_POST" | "STARTUP" | "RAISE_ROUND" | "HIRING" | "BUILDER_PROJECT" | "BUILDER_AVAILABLE" | "INVESTOR_THESIS";
  authorUserId: string;
  authorRole: Role;
  authorName: string;
  authorImage: string | null;
  authorUsername: string | null;
  authorProfileHref: string | null;
  authorProfilePublic: boolean;
  authorOpenToConnections: boolean;
  postType: FeedPostType;
  title: string;
  body: string;
  visibility: "PUBLIC";
  metadata: Record<string, string | number | boolean | null>;
  relatedVentureId: string | null;
  relatedProjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const FOUNDER_TYPES: FeedPostType[] = [
  "STARTUP_LAUNCH",
  "FUNDRAISING_UPDATE",
  "HIRING_BUILDER",
  "PRODUCT_UPDATE",
  "MILESTONE_UPDATE",
];
const BUILDER_TYPES: FeedPostType[] = [
  "BUILDER_PROJECT",
  "OPEN_SOURCE_UPDATE",
  "BUILDER_AVAILABLE",
  "PRODUCT_UPDATE",
  "MILESTONE_UPDATE",
];
const INVESTOR_TYPES: FeedPostType[] = [
  "INVESTOR_THESIS",
  "INVESTOR_OPEN_CALL",
  "PORTFOLIO_UPDATE",
  "ECOSYSTEM_SIGNAL",
];

function typesForScope(scope: FeedScope): FeedPostType[] | null {
  if (scope === "FOUNDER") return FOUNDER_TYPES;
  if (scope === "BUILDER") return BUILDER_TYPES;
  if (scope === "INVESTOR") return INVESTOR_TYPES;
  return null;
}

function normalizeSearch(search?: string | null) {
  return (search ?? "").trim().toLowerCase();
}

function matchSearch(item: EcosystemFeedItem, search: string) {
  if (!search) return true;
  return [
    item.title,
    item.body,
    item.authorName,
    item.authorUsername ?? "",
    String(item.metadata.chain ?? ""),
    String(item.metadata.stage ?? ""),
    String(item.metadata.sector ?? ""),
  ]
    .join(" ")
    .toLowerCase()
    .includes(search);
}

function authorProfileHref(input: {
  role: Role;
  username: string | null;
  founderPublic: boolean;
  builderPublic: boolean;
  investorPublic: boolean;
  investorCompanySlug?: string | null;
}) {
  if (!input.username) return null;
  if (input.role === "FOUNDER" && input.founderPublic) return `/founder/${input.username}`;
  if (input.role === "BUILDER" && input.builderPublic) return `/builder/${input.username}`;
  if (input.role === "INVESTOR" && input.investorPublic) {
    if (input.investorCompanySlug) return `/investor/${input.investorCompanySlug}/${input.username}`;
    return `/investor/${input.username}`;
  }
  return null;
}

function toFeedItem(input: Omit<EcosystemFeedItem, "visibility">): EcosystemFeedItem {
  return { ...input, visibility: "PUBLIC" };
}

export async function getEcosystemFeed(options: {
  scope: FeedScope;
  search?: string | null;
  take?: number;
}) {
  const take = Math.min(100, Math.max(10, options.take ?? 50));
  const scopedTypes = typesForScope(options.scope);
  const search = normalizeSearch(options.search);

  const [feedPosts, startups, rounds, founderHiring, builderProjects, builderAvailability, investorSignals] = await Promise.all([
    db.feedPost.findMany({
      where: {
        visibility: "PUBLIC",
        ...(scopedTypes ? { postType: { in: scopedTypes } } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            role: true,
            founderProfile: { select: { publicVisible: true } },
            builderProfile: { select: { publicVisible: true } },
            investorProfile: { select: { isPublic: true, company: { select: { slug: true } } } },
            publicProfileSettings: { select: { showInEcosystemFeed: true, openToConnections: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.startup.findMany({
      where: {
        founder: {
          founderProfile: { is: { publicVisible: true } },
          OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { founderProfileLive: true } } }],
        },
      },
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            role: true,
            founderProfile: { select: { publicVisible: true } },
            publicProfileSettings: { select: { showInEcosystemFeed: true, openToConnections: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.raiseRound.findMany({
      where: {
        founder: {
          founderProfile: { is: { publicVisible: true } },
          OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { founderProfileLive: true } } }],
        },
      },
      include: {
        venture: { select: { id: true, name: true, stage: true, chainEcosystem: true } },
        founder: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            role: true,
            founderProfile: { select: { publicVisible: true } },
            publicProfileSettings: { select: { showInEcosystemFeed: true, openToConnections: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take,
    }),
    db.founderProfile.findMany({
      where: {
        publicVisible: true,
        isHiring: true,
        user: {
          OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { founderProfileLive: true } } }],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            role: true,
            publicProfileSettings: { select: { showInEcosystemFeed: true, openToConnections: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take,
    }),
    db.builderProject.findMany({
      where: {
        builder: {
          builderProfile: { is: { publicVisible: true } },
          OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { builderProfileLive: true } } }],
        },
      },
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            role: true,
            builderProfile: { select: { publicVisible: true } },
            publicProfileSettings: { select: { showInEcosystemFeed: true, openToConnections: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take,
    }),
    db.builderProfile.findMany({
      where: {
        publicVisible: true,
        openToWork: true,
        user: {
          OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { builderProfileLive: true } } }],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            role: true,
            publicProfileSettings: { select: { showInEcosystemFeed: true, openToConnections: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take,
    }),
    db.investorProfile.findMany({
      where: {
        isPublic: true,
        user: {
          OR: [{ publicProfileSettings: { is: null } }, { publicProfileSettings: { is: { investorProfileLive: true } } }],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            role: true,
            publicProfileSettings: { select: { showInEcosystemFeed: true, openToConnections: true } },
          },
        },
        company: { select: { slug: true } },
      },
      orderBy: { updatedAt: "desc" },
      take,
    }),
  ]);

  const explicit = feedPosts
    .filter((post) => post.author.publicProfileSettings?.showInEcosystemFeed !== false)
    .map((post) =>
      toFeedItem({
        id: `feed:${post.id}`,
        source: "FEED_POST",
        authorUserId: post.authorUserId,
        authorRole: post.authorRole,
        authorName: post.author.name ?? "Member",
        authorImage: post.author.image,
        authorUsername: post.author.username,
        authorProfileHref: authorProfileHref({
          role: post.authorRole,
          username: post.author.username,
          founderPublic: post.author.founderProfile?.publicVisible ?? false,
          builderPublic: post.author.builderProfile?.publicVisible ?? false,
          investorPublic: post.author.investorProfile?.isPublic ?? false,
          investorCompanySlug: post.author.investorProfile?.company?.slug ?? null,
        }),
        authorProfilePublic: Boolean(
          (post.authorRole === "FOUNDER" && post.author.founderProfile?.publicVisible) ||
            (post.authorRole === "BUILDER" && post.author.builderProfile?.publicVisible) ||
            (post.authorRole === "INVESTOR" && post.author.investorProfile?.isPublic),
        ),
        authorOpenToConnections: post.author.publicProfileSettings?.openToConnections ?? true,
        postType: post.postType,
        title: post.title,
        body: post.body,
        metadata: (post.metadata as Record<string, string | number | boolean | null> | null) ?? {},
        relatedVentureId: post.relatedVentureId,
        relatedProjectId: post.relatedProjectId,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }),
    );

  const generatedStartups = startups
    .filter((startup) => startup.founder.publicProfileSettings?.showInEcosystemFeed !== false)
    .map((startup) =>
    toFeedItem({
      id: `startup:${startup.id}`,
      source: "STARTUP",
      authorUserId: startup.founder.id,
      authorRole: startup.founder.role,
      authorName: startup.founder.name ?? "Founder",
      authorImage: startup.founder.image,
      authorUsername: startup.founder.username,
      authorProfileHref: authorProfileHref({
        role: "FOUNDER",
        username: startup.founder.username,
        founderPublic: true,
        builderPublic: false,
        investorPublic: false,
      }),
      authorProfilePublic: true,
      authorOpenToConnections: startup.founder.publicProfileSettings?.openToConnections ?? true,
      postType: "STARTUP_LAUNCH",
      title: `${startup.name} is live on Webcoin Labs`,
      body: startup.tagline ?? startup.description ?? "Startup published in the ecosystem.",
      metadata: { stage: startup.stage, chain: startup.chainFocus },
      relatedVentureId: startup.canonicalVentureId ?? null,
      relatedProjectId: null,
      createdAt: startup.createdAt,
      updatedAt: startup.updatedAt,
    }),
    );

  const generatedRounds = rounds
    .filter((round) => round.founder.publicProfileSettings?.showInEcosystemFeed !== false)
    .map((round) =>
    toFeedItem({
      id: `round:${round.id}`,
      source: "RAISE_ROUND",
      authorUserId: round.founder.id,
      authorRole: round.founder.role,
      authorName: round.founder.name ?? "Founder",
      authorImage: round.founder.image,
      authorUsername: round.founder.username,
      authorProfileHref: authorProfileHref({
        role: "FOUNDER",
        username: round.founder.username,
        founderPublic: true,
        builderPublic: false,
        investorPublic: false,
      }),
      authorProfilePublic: true,
      authorOpenToConnections: round.founder.publicProfileSettings?.openToConnections ?? true,
      postType: "FUNDRAISING_UPDATE",
      title: `${round.venture.name} ${round.roundName} update`,
      body: `${round.status} · ${round.currency} ${Number(round.raisedAmount)} raised of ${Number(round.targetAmount)} target.`,
      metadata: { stage: round.venture.stage, chain: round.venture.chainEcosystem },
      relatedVentureId: round.ventureId,
      relatedProjectId: null,
      createdAt: round.createdAt,
      updatedAt: round.updatedAt,
    }),
    );

  const generatedHiring = founderHiring
    .filter((profile) => profile.user.publicProfileSettings?.showInEcosystemFeed !== false)
    .map((profile) =>
    toFeedItem({
      id: `hiring:${profile.id}`,
      source: "HIRING",
      authorUserId: profile.user.id,
      authorRole: profile.user.role,
      authorName: profile.user.name ?? "Founder",
      authorImage: profile.user.image,
      authorUsername: profile.user.username,
      authorProfileHref: authorProfileHref({
        role: "FOUNDER",
        username: profile.user.username,
        founderPublic: true,
        builderPublic: false,
        investorPublic: false,
      }),
      authorProfilePublic: true,
      authorOpenToConnections: profile.user.publicProfileSettings?.openToConnections ?? true,
      postType: "HIRING_BUILDER",
      title: `${profile.companyName ?? "Founder"} is hiring builders`,
      body: `Current needs: ${(profile.currentNeeds ?? []).join(", ") || "Product and engineering support"}`,
      metadata: { stage: profile.projectStage ?? null, chain: profile.chainFocus ?? null },
      relatedVentureId: null,
      relatedProjectId: null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }),
    );

  const generatedBuilderProjects = builderProjects
    .filter((project) => project.builder.publicProfileSettings?.showInEcosystemFeed !== false)
    .map((project) =>
    toFeedItem({
      id: `builder_project:${project.id}`,
      source: "BUILDER_PROJECT",
      authorUserId: project.builder.id,
      authorRole: project.builder.role,
      authorName: project.builder.name ?? "Builder",
      authorImage: project.builder.image,
      authorUsername: project.builder.username,
      authorProfileHref: authorProfileHref({
        role: "BUILDER",
        username: project.builder.username,
        founderPublic: false,
        builderPublic: true,
        investorPublic: false,
      }),
      authorProfilePublic: true,
      authorOpenToConnections: project.builder.publicProfileSettings?.openToConnections ?? true,
      postType: "BUILDER_PROJECT",
      title: `${project.title} shipped`,
      body: project.tagline ?? project.description ?? "Builder project updated.",
      metadata: { repo: project.githubUrl ?? null },
      relatedVentureId: null,
      relatedProjectId: null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }),
    );

  const generatedBuilderAvailable = builderAvailability
    .filter((profile) => profile.user.publicProfileSettings?.showInEcosystemFeed !== false)
    .map((profile) =>
    toFeedItem({
      id: `builder_available:${profile.id}`,
      source: "BUILDER_AVAILABLE",
      authorUserId: profile.user.id,
      authorRole: profile.user.role,
      authorName: profile.user.name ?? "Builder",
      authorImage: profile.user.image,
      authorUsername: profile.user.username,
      authorProfileHref: authorProfileHref({
        role: "BUILDER",
        username: profile.user.username,
        founderPublic: false,
        builderPublic: true,
        investorPublic: false,
      }),
      authorProfilePublic: true,
      authorOpenToConnections: profile.user.publicProfileSettings?.openToConnections ?? true,
      postType: "BUILDER_AVAILABLE",
      title: `${profile.user.name ?? "Builder"} is open to collaborate`,
      body: profile.headline ?? profile.bio ?? "Open to new startup execution opportunities.",
      metadata: { skills: (profile.skills ?? []).slice(0, 6).join(", ") },
      relatedVentureId: null,
      relatedProjectId: null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }),
    );

  const generatedInvestorSignals = investorSignals
    .filter((profile) => profile.user.publicProfileSettings?.showInEcosystemFeed !== false)
    .filter((profile) => Boolean(profile.investmentThesis || profile.lookingFor))
    .map((profile) =>
      toFeedItem({
        id: `investor:${profile.id}`,
        source: "INVESTOR_THESIS",
        authorUserId: profile.user.id,
        authorRole: profile.user.role,
        authorName: profile.user.name ?? "Investor",
        authorImage: profile.user.image,
        authorUsername: profile.user.username,
        authorProfileHref: authorProfileHref({
          role: "INVESTOR",
          username: profile.user.username,
          founderPublic: false,
          builderPublic: false,
          investorPublic: true,
          investorCompanySlug: profile.company?.slug ?? null,
        }),
        authorProfilePublic: true,
        authorOpenToConnections: profile.user.publicProfileSettings?.openToConnections ?? true,
        postType: profile.lookingFor ? "INVESTOR_OPEN_CALL" : "INVESTOR_THESIS",
        title: profile.lookingFor ? `${profile.user.name ?? "Investor"} is open for new founder intros` : `${profile.user.name ?? "Investor"} thesis update`,
        body: profile.lookingFor ?? profile.investmentThesis ?? "Investor thesis updated.",
        metadata: {
          stage: profile.stageFocus.join(", ") || null,
          sector: profile.sectorFocus.join(", ") || null,
          chain: profile.chainFocus.join(", ") || null,
        },
        relatedVentureId: null,
        relatedProjectId: null,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }),
    );

  const combined = [
    ...explicit,
    ...generatedStartups,
    ...generatedRounds,
    ...generatedHiring,
    ...generatedBuilderProjects,
    ...generatedBuilderAvailable,
    ...generatedInvestorSignals,
  ]
    .filter((item) => matchSearch(item, search))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const filtered = scopedTypes ? combined.filter((item) => scopedTypes.includes(item.postType)) : combined;
  return filtered.slice(0, take);
}
