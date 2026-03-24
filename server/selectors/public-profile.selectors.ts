import "server-only";

import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewerAccessEntity } from "@/server/policies/visibility";

type ViewerContext = {
  userId?: string | null;
  role?: Role | null;
};

export async function selectFounderPublicProfile(username: string, viewer: ViewerContext = {}) {
  const profile = await prisma.user.findFirst({
    where: {
      username: username.toLowerCase(),
      founderProfile: { is: { publicVisible: true } },
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
  const profile = await prisma.user.findFirst({
    where: {
      username: username.toLowerCase(),
      builderProfile: { is: { publicVisible: true } },
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
