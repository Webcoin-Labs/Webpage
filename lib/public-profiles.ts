import "server-only";

import { Role } from "@prisma/client";
import { db } from "@/server/db/client";
import { selectBuilderPublicProfile, selectFounderPublicProfile } from "@/server/selectors/public-profile.selectors";
import { canViewerAccessEntity } from "@/server/policies/visibility";

type ViewerContext = {
  userId?: string | null;
  role?: Role | null;
};

export async function getFounderPublicProfile(username: string, viewer: ViewerContext = {}) {
  return selectFounderPublicProfile(username, viewer);
}

export async function getBuilderPublicProfile(username: string, viewer: ViewerContext = {}) {
  return selectBuilderPublicProfile(username, viewer);
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
