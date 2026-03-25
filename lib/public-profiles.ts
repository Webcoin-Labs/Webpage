import "server-only";

import { Role } from "@prisma/client";
import { db } from "@/server/db/client";
import { selectBuilderPublicProfile, selectFounderPublicProfile } from "@/server/selectors/public-profile.selectors";
import { canViewerAccessEntity } from "@/server/policies/visibility";

type ViewerContext = {
  userId?: string | null;
  role?: Role | null;
};

type PublicSettings = {
  showEmailToInvestors?: boolean | null;
  showLinkedinToInvestors?: boolean | null;
  showTelegramToInvestors?: boolean | null;
} | null;

type FounderSanitizable = {
  id: string;
  email: string | null;
  socialLinks: unknown;
  publicProfileSettings?: PublicSettings;
  founderProfile: {
    telegram: string | null;
    linkedin: string | null;
  } | null;
};

type BuilderSanitizable = {
  id: string;
  email: string | null;
  socialLinks: unknown;
  publicProfileSettings?: PublicSettings;
  builderProfile: {
    linkedin: string | null;
  } | null;
};

function isOwnerOrAdmin(viewer: ViewerContext, ownerUserId: string) {
  if (viewer.userId && viewer.userId === ownerUserId) return true;
  if (viewer.role === "ADMIN") return true;
  return false;
}

function canInvestorSee(viewer: ViewerContext, enabled: boolean | null | undefined) {
  const investorViewer = viewer.role === "INVESTOR";
  return investorViewer && Boolean(enabled);
}

function sanitizeFounderProfile<T extends FounderSanitizable | null>(profile: T, viewer: ViewerContext): T {
  if (!profile?.founderProfile) return profile;
  if (isOwnerOrAdmin(viewer, profile.id)) return profile;
  return {
    ...profile,
    email: canInvestorSee(viewer, profile.publicProfileSettings?.showEmailToInvestors) ? profile.email : null,
    socialLinks: null,
    founderProfile: {
      ...profile.founderProfile,
      telegram: canInvestorSee(viewer, profile.publicProfileSettings?.showTelegramToInvestors) ? profile.founderProfile.telegram : null,
      linkedin: canInvestorSee(viewer, profile.publicProfileSettings?.showLinkedinToInvestors) ? profile.founderProfile.linkedin : null,
    },
  } as T;
}

function sanitizeBuilderProfile<T extends BuilderSanitizable | null>(profile: T, viewer: ViewerContext): T {
  if (!profile?.builderProfile) return profile;
  if (isOwnerOrAdmin(viewer, profile.id)) return profile;
  return {
    ...profile,
    email: canInvestorSee(viewer, profile.publicProfileSettings?.showEmailToInvestors) ? profile.email : null,
    socialLinks: null,
    builderProfile: {
      ...profile.builderProfile,
      linkedin: canInvestorSee(viewer, profile.publicProfileSettings?.showLinkedinToInvestors) ? profile.builderProfile.linkedin : null,
    },
  } as T;
}

export async function getFounderPublicProfile(username: string, viewer: ViewerContext = {}) {
  const profile = await selectFounderPublicProfile(username, viewer);
  return sanitizeFounderProfile(profile, viewer);
}

export async function getBuilderPublicProfile(username: string, viewer: ViewerContext = {}) {
  const profile = await selectBuilderPublicProfile(username, viewer);
  return sanitizeBuilderProfile(profile, viewer);
}

export async function getInvestorPublicByUsername(username: string, viewer: ViewerContext = {}) {
  const profile = await db.user.findFirst({
    where: {
      username: username.toLowerCase(),
      investorProfile: {
        is: { isPublic: true },
      },
    },
    include: {
      investorProfile: {
        include: { company: true },
      },
      investorCompanyMemberships: {
        where: { isPrimary: true },
        include: { company: true },
        take: 1,
      },
      walletConnections: {
        where: { isPrimary: true },
      },
    },
  });
  if (!profile?.investorProfile) return profile;
  const allowed = await canViewerAccessEntity("INVESTOR_PROFILE", profile.investorProfile.id, viewer);
  return allowed ? profile : null;
}

export async function getInvestorByCompanyAndUsername(companySlug: string, username: string, viewer: ViewerContext = {}) {
  const profile = await db.user.findFirst({
    where: {
      username: username.toLowerCase(),
      investorProfile: {
        is: {
          isPublic: true,
          company: {
            is: { slug: companySlug.toLowerCase() },
          },
        },
      },
    },
    include: {
      investorProfile: {
        include: { company: true },
      },
    },
  });
  if (!profile?.investorProfile) return profile;
  const allowed = await canViewerAccessEntity("INVESTOR_PROFILE", profile.investorProfile.id, viewer);
  return allowed ? profile : null;
}

export async function getInvestorCompanyPublic(companySlug: string) {
  return db.investorCompany.findFirst({
    where: { slug: companySlug.toLowerCase(), isPublic: true },
    include: {
      members: {
        where: { isPrimary: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              investorProfile: {
                select: {
                  investorType: true,
                  roleTitle: true,
                  investmentThesis: true,
                  stageFocus: true,
                  chainFocus: true,
                  sectorFocus: true,
                  checkSizeMin: true,
                  checkSizeMax: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
