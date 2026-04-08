import "server-only";

import { Role } from "@prisma/client";
import { db } from "@/server/db/client";
import { canViewerAccessEntity } from "@/server/policies/visibility";

type ViewerContext = {
  userId?: string | null;
  role?: Role | null;
};

export async function selectFounderPublicProfile(username: string, viewer: ViewerContext = {}) {
  const profile = await db.user.findFirst({
    where: {
      username: username.toLowerCase(),
      founderProfile: { is: { publicVisible: true } },
      OR: [
        { publicProfileSettings: { is: null } },
        { publicProfileSettings: { is: { founderProfileLive: true } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      bio: true,
      educationBackground: true,
      socialLinks: true,
      founderProfile: true,
      builderProfile: { select: { id: true } },
      publicProfileSettings: true,
      profileContactMethods: {
        where: { isEnabled: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      ownedVentures: {
        where: { isPublic: true },
        orderBy: { updatedAt: "desc" },
        take: 10,
      },
      walletConnections: {
        where: { isPrimary: true },
        orderBy: { updatedAt: "desc" },
      },
      miniApps: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      profileLinksFrom: {
        select: {
          id: true,
          toUser: {
            select: {
              id: true,
              username: true,
              name: true,
              founderProfile: { select: { id: true, telegram: true } },
              builderProfile: { select: { id: true } },
              publicProfileSettings: { select: { showTelegramToInvestors: true } },
            },
          },
        },
      },
    },
  });
  if (!profile?.founderProfile) return profile;
  const allowed = await canViewerAccessEntity("FOUNDER_PROFILE", profile.founderProfile.id, viewer);
  return allowed ? profile : null;
}

export async function selectBuilderPublicProfile(username: string, viewer: ViewerContext = {}) {
  const profile = await db.user.findFirst({
    where: {
      username: username.toLowerCase(),
      builderProfile: { is: { publicVisible: true } },
      OR: [
        { publicProfileSettings: { is: null } },
        { publicProfileSettings: { is: { builderProfileLive: true } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      bio: true,
      educationBackground: true,
      socialLinks: true,
      builderProfile: true,
      founderProfile: { select: { id: true } },
      publicProfileSettings: true,
      profileContactMethods: {
        where: { isEnabled: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      builderProjects: { orderBy: { updatedAt: "desc" }, take: 10 },
      githubConnection: true,
      walletConnections: {
        where: { isPrimary: true },
        orderBy: { updatedAt: "desc" },
      },
      miniApps: { orderBy: { createdAt: "desc" }, take: 10 },
      profileLinksFrom: {
        select: {
          id: true,
          toUser: {
            select: {
              id: true,
              username: true,
              name: true,
              founderProfile: { select: { id: true, telegram: true } },
              builderProfile: { select: { id: true } },
              publicProfileSettings: { select: { showTelegramToInvestors: true } },
            },
          },
        },
      },
    },
  });
  if (!profile?.builderProfile) return profile;
  const allowed = await canViewerAccessEntity("BUILDER_PROFILE", profile.builderProfile.id, viewer);
  return allowed ? profile : null;
}

/**
 * selectInvestorPublicProfile
 * ---------------------------
 * Mirrors the pattern of selectFounderPublicProfile and selectBuilderPublicProfile.
 * Previously this logic was inline in app/investor/[[...segments]]/page.tsx.
 *
 * Lookup is by username (handle). The investor profile must be marked isPublic
 * and the PublicProfileSettings (if present) must have investorProfileLive = true.
 */
export async function selectInvestorPublicProfile(
  username: string,
  viewer: ViewerContext = {}
) {
  const profile = await db.user.findFirst({
    where: {
      username: username.toLowerCase(),
      investorProfile: { is: { isPublic: true } },
      OR: [
        { publicProfileSettings: { is: null } },
        { publicProfileSettings: { is: { investorProfileLive: true } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      bio: true,
      socialLinks: true,
      investorProfile: true,
      founderProfile: { select: { id: true } },
      builderProfile: { select: { id: true } },
      publicProfileSettings: true,
      profileContactMethods: {
        where: { isEnabled: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      walletConnections: {
        where: { isPrimary: true },
        orderBy: { updatedAt: "desc" },
      },
      meetingLink: true,
      feedPosts: {
        where: { visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          body: true,
          postType: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile?.investorProfile) return null;

  const allowed = await canViewerAccessEntity(
    "INVESTOR_PROFILE",
    profile.investorProfile.id,
    viewer
  );
  return allowed ? profile : null;
}
