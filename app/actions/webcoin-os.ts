"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Role, SubscriptionTier, WorkspaceType } from "@prisma/client";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { writeAuditLog } from "@/lib/audit";
import { identityService } from "@/server/services/identity.service";
import { integrationService } from "@/server/services/integration.service";

type ActionResult = { success: true; message?: string } | { success: false; error: string };

const workspaceSchema = z.enum(["FOUNDER_OS", "BUILDER_OS", "INVESTOR_OS"]);

const profileIdentitySchema = z.object({
  name: z.string().min(2).max(80),
  username: z
    .string()
    .min(3)
    .max(25)
    .regex(/^[a-z0-9_]+$/, "Username must use lowercase letters, numbers, or underscore."),
  bio: z.string().max(1200).optional().or(z.literal("")),
  educationBackground: z.string().max(2000).optional().or(z.literal("")),
  twitter: z.string().max(200).optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

const founderSetupSchema = z.object({
  companyName: z.string().max(180).optional().or(z.literal("")),
  companyDescription: z.string().max(2500).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().max(200).optional().or(z.literal("")),
  chainFocus: z.string().max(120).optional().or(z.literal("")),
  stage: z.string().max(120).optional().or(z.literal("")),
  lookingForCsv: z.string().max(800).optional().or(z.literal("")),
  founderDescription: z.string().max(2500).optional().or(z.literal("")),
  educationBackground: z.string().max(2000).optional().or(z.literal("")),
});

const builderSetupSchema = z.object({
  title: z.string().max(120).optional().or(z.literal("")),
  headline: z.string().max(160).optional().or(z.literal("")),
  skillsCsv: z.string().max(900).optional().or(z.literal("")),
  stackCsv: z.string().max(900).optional().or(z.literal("")),
  chainExpertiseCsv: z.string().max(900).optional().or(z.literal("")),
  lookingForCsv: z.string().max(900).optional().or(z.literal("")),
  builderDescription: z.string().max(2500).optional().or(z.literal("")),
  educationBackground: z.string().max(2000).optional().or(z.literal("")),
  availability: z.string().max(120).optional().or(z.literal("")),
  github: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
});

const investorSetupSchema = z.object({
  investorType: z.enum(["ANGEL", "VENTURE_FUND", "SCOUT", "OPERATOR_INVESTOR"]).optional(),
  roleTitle: z.string().max(120).optional().or(z.literal("")),
  thesis: z.string().max(2500).optional().or(z.literal("")),
  sectorFocusCsv: z.string().max(700).optional().or(z.literal("")),
  chainFocusCsv: z.string().max(700).optional().or(z.literal("")),
  stageFocusCsv: z.string().max(700).optional().or(z.literal("")),
  geography: z.string().max(120).optional().or(z.literal("")),
  checkSizeMin: z.coerce.number().int().min(0).optional(),
  checkSizeMax: z.coerce.number().int().min(0).optional(),
  companyName: z.string().max(160).optional().or(z.literal("")),
  companyDescription: z.string().max(2500).optional().or(z.literal("")),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  companyLinkedin: z.string().url().optional().or(z.literal("")),
  companyTwitter: z.string().max(200).optional().or(z.literal("")),
  companyLocation: z.string().max(140).optional().or(z.literal("")),
});

const integrationSchema = z.object({
  providers: z.array(
    z.enum([
      "GMAIL",
      "GOOGLE_CALENDAR",
      "NOTION",
      "GITHUB",
      "JIRA",
      "CALENDLY",
      "CAL_DOT_COM",
      "FARCASTER",
    ]),
  ),
});

const walletSchema = z.object({
  network: z.enum(["EVM", "SOLANA"]),
  provider: z.enum(["METAMASK", "COINBASE", "PHANTOM", "WALLETCONNECT", "PRIVY_EMBEDDED", "OTHER"]),
  address: z.string().min(10).max(200),
  signatureDigest: z.string().max(300).optional().or(z.literal("")),
});

const miniAppSchema = z.object({
  platform: z.enum(["BASE", "FARCASTER", "OTHER"]),
  sourceUrl: z.string().url(),
  appName: z.string().max(120).optional().or(z.literal("")),
  manifestUrl: z.string().url().optional().or(z.literal("")),
  chain: z.string().max(80).optional().or(z.literal("")),
});

function splitCsv(input: string | undefined) {
  if (!input) return [];
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nullIfEmpty(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRole(workspace: WorkspaceType): Role {
  if (workspace === "FOUNDER_OS") return "FOUNDER";
  if (workspace === "INVESTOR_OS") return "INVESTOR";
  return "BUILDER";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

async function ensureWorkspaceAccess(userId: string, workspace: WorkspaceType) {
  const existing = await db.userWorkspace.findUnique({
    where: {
      userId_workspace: { userId, workspace },
    },
  });
  if (existing) return existing;
  return db.userWorkspace.create({
    data: {
      userId,
      workspace,
      status: "ENABLED",
      isDefault: workspace !== "INVESTOR_OS",
    },
  });
}

export async function switchWorkspace(workspaceInput: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const workspace = workspaceSchema.parse(workspaceInput) as WorkspaceType;

    if (workspace === "INVESTOR_OS" && !["INVESTOR", "ADMIN"].includes(user.role)) {
      const profile = await db.investorProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!profile) {
        return { success: false, error: "Investor OS is restricted. Complete investor onboarding first." };
      }
    }

    await ensureWorkspaceAccess(user.id, workspace);

    await identityService.setDefaultWorkspace(user.id, workspace);
    // Phased-compat: keep role update for existing route guards while treating workspace as active context.
    await db.user.update({ where: { id: user.id }, data: { role: toRole(workspace) } });

    revalidatePath("/app");
    revalidatePath("/app/workspaces");
    revalidatePath("/app/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to switch workspace." };
  }
}

export async function saveProfileIdentity(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = profileIdentitySchema.parse({
      name: String(formData.get("name") ?? ""),
      username: String(formData.get("username") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      educationBackground: String(formData.get("educationBackground") ?? ""),
      twitter: String(formData.get("twitter") ?? ""),
      linkedin: String(formData.get("linkedin") ?? ""),
      website: String(formData.get("website") ?? ""),
    });

    const existingUser = await db.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    });
    const normalizedUsername = parsed.username.trim();
    if (existingUser?.username && existingUser.username !== normalizedUsername) {
      return { success: false, error: "Username is locked and cannot be changed." };
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name.trim(),
        username: normalizedUsername,
        bio: nullIfEmpty(parsed.bio),
        educationBackground: nullIfEmpty(parsed.educationBackground),
        socialLinks: {
          twitter: nullIfEmpty(parsed.twitter),
          linkedin: nullIfEmpty(parsed.linkedin),
          website: nullIfEmpty(parsed.website),
        },
      },
    });

    await db.publicProfileSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    await identityService.saveOnboardingProgress(user.id, "identity", {
      username: normalizedUsername,
    });

    revalidatePath("/app/onboarding");
    revalidatePath("/app/profile");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to save identity." };
  }
}

export async function completeWorkspaceOnboarding(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const workspace = workspaceSchema.parse(String(formData.get("workspace") ?? "")) as WorkspaceType;
    await ensureWorkspaceAccess(user.id, workspace);

    if (workspace === "FOUNDER_OS") {
      const parsed = founderSetupSchema.parse({
        companyName: String(formData.get("companyName") ?? ""),
        companyDescription: String(formData.get("companyDescription") ?? ""),
        website: String(formData.get("website") ?? ""),
        github: String(formData.get("github") ?? ""),
        linkedin: String(formData.get("linkedin") ?? ""),
        twitter: String(formData.get("twitter") ?? ""),
        chainFocus: String(formData.get("chainFocus") ?? ""),
        stage: String(formData.get("stage") ?? ""),
        lookingForCsv: String(formData.get("lookingForCsv") ?? ""),
        founderDescription: String(formData.get("founderDescription") ?? ""),
        educationBackground: String(formData.get("educationBackground") ?? ""),
      });

      await db.founderProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          companyName: nullIfEmpty(parsed.companyName),
          companyDescription: nullIfEmpty(parsed.companyDescription),
          website: nullIfEmpty(parsed.website),
          linkedin: nullIfEmpty(parsed.linkedin),
          twitter: nullIfEmpty(parsed.twitter),
          chainFocus: nullIfEmpty(parsed.chainFocus),
          founderDescription: nullIfEmpty(parsed.founderDescription),
          educationBackground: nullIfEmpty(parsed.educationBackground),
          lookingFor: splitCsv(parsed.lookingForCsv),
          projectStage: parsed.stage === "MVP" || parsed.stage === "LIVE" ? parsed.stage : "IDEA",
        },
        update: {
          companyName: nullIfEmpty(parsed.companyName),
          companyDescription: nullIfEmpty(parsed.companyDescription),
          website: nullIfEmpty(parsed.website),
          linkedin: nullIfEmpty(parsed.linkedin),
          twitter: nullIfEmpty(parsed.twitter),
          chainFocus: nullIfEmpty(parsed.chainFocus),
          founderDescription: nullIfEmpty(parsed.founderDescription),
          educationBackground: nullIfEmpty(parsed.educationBackground),
          lookingFor: splitCsv(parsed.lookingForCsv),
          projectStage: parsed.stage === "MVP" || parsed.stage === "LIVE" ? parsed.stage : "IDEA",
        },
      });

      await db.venture.upsert({
        where: { slug: `${user.id}-primary-venture` },
        create: {
          ownerUserId: user.id,
          name: nullIfEmpty(parsed.companyName) ?? "Untitled Venture",
          slug: `${user.id}-primary-venture`,
          description: nullIfEmpty(parsed.companyDescription),
          website: nullIfEmpty(parsed.website),
          githubUrl: nullIfEmpty(parsed.github),
          linkedin: nullIfEmpty(parsed.linkedin),
          twitter: nullIfEmpty(parsed.twitter),
          chainEcosystem: nullIfEmpty(parsed.chainFocus),
          stage: nullIfEmpty(parsed.stage),
        },
        update: {
          name: nullIfEmpty(parsed.companyName) ?? "Untitled Venture",
          description: nullIfEmpty(parsed.companyDescription),
          website: nullIfEmpty(parsed.website),
          githubUrl: nullIfEmpty(parsed.github),
          linkedin: nullIfEmpty(parsed.linkedin),
          twitter: nullIfEmpty(parsed.twitter),
          chainEcosystem: nullIfEmpty(parsed.chainFocus),
          stage: nullIfEmpty(parsed.stage),
        },
      });
    }

    if (workspace === "BUILDER_OS") {
      const parsed = builderSetupSchema.parse({
        title: String(formData.get("title") ?? ""),
        headline: String(formData.get("headline") ?? ""),
        skillsCsv: String(formData.get("skillsCsv") ?? ""),
        stackCsv: String(formData.get("stackCsv") ?? ""),
        chainExpertiseCsv: String(formData.get("chainExpertiseCsv") ?? ""),
        lookingForCsv: String(formData.get("lookingForCsv") ?? ""),
        builderDescription: String(formData.get("builderDescription") ?? ""),
        educationBackground: String(formData.get("educationBackground") ?? ""),
        availability: String(formData.get("availability") ?? ""),
        github: String(formData.get("github") ?? ""),
        portfolioUrl: String(formData.get("portfolioUrl") ?? ""),
      });

      await db.builderProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          title: nullIfEmpty(parsed.title),
          headline: nullIfEmpty(parsed.headline),
          bio: nullIfEmpty(parsed.builderDescription),
          educationBackground: nullIfEmpty(parsed.educationBackground),
          skills: splitCsv(parsed.skillsCsv),
          stack: splitCsv(parsed.stackCsv),
          preferredChains: splitCsv(parsed.chainExpertiseCsv),
          chainExpertise: splitCsv(parsed.chainExpertiseCsv),
          openTo: splitCsv(parsed.lookingForCsv),
          lookingForRoles: splitCsv(parsed.lookingForCsv),
          availability: nullIfEmpty(parsed.availability),
          github: nullIfEmpty(parsed.github),
          portfolioUrl: nullIfEmpty(parsed.portfolioUrl),
        },
        update: {
          title: nullIfEmpty(parsed.title),
          headline: nullIfEmpty(parsed.headline),
          bio: nullIfEmpty(parsed.builderDescription),
          educationBackground: nullIfEmpty(parsed.educationBackground),
          skills: splitCsv(parsed.skillsCsv),
          stack: splitCsv(parsed.stackCsv),
          preferredChains: splitCsv(parsed.chainExpertiseCsv),
          chainExpertise: splitCsv(parsed.chainExpertiseCsv),
          openTo: splitCsv(parsed.lookingForCsv),
          lookingForRoles: splitCsv(parsed.lookingForCsv),
          availability: nullIfEmpty(parsed.availability),
          github: nullIfEmpty(parsed.github),
          portfolioUrl: nullIfEmpty(parsed.portfolioUrl),
        },
      });
    }

    if (workspace === "INVESTOR_OS") {
      const parsed = investorSetupSchema.parse({
        investorType: formData.get("investorType") ? String(formData.get("investorType")) : undefined,
        roleTitle: String(formData.get("roleTitle") ?? ""),
        thesis: String(formData.get("thesis") ?? ""),
        sectorFocusCsv: String(formData.get("sectorFocusCsv") ?? ""),
        chainFocusCsv: String(formData.get("chainFocusCsv") ?? ""),
        stageFocusCsv: String(formData.get("stageFocusCsv") ?? ""),
        geography: String(formData.get("geography") ?? ""),
        checkSizeMin: formData.get("checkSizeMin") ? String(formData.get("checkSizeMin")) : undefined,
        checkSizeMax: formData.get("checkSizeMax") ? String(formData.get("checkSizeMax")) : undefined,
        companyName: String(formData.get("companyName") ?? ""),
        companyDescription: String(formData.get("companyDescription") ?? ""),
        companyWebsite: String(formData.get("companyWebsite") ?? ""),
        companyLinkedin: String(formData.get("companyLinkedin") ?? ""),
        companyTwitter: String(formData.get("companyTwitter") ?? ""),
        companyLocation: String(formData.get("companyLocation") ?? ""),
      });

      let companyId: string | null = null;
      const companyName = parsed.companyName?.trim() ?? "";
      if (companyName.length > 0) {
        const baseSlug = slugify(companyName);
        let slug = baseSlug;
        let suffix = 0;
        while (await db.investorCompany.findFirst({ where: { slug } })) {
          suffix += 1;
          slug = `${baseSlug}-${suffix}`;
        }
        const company = await db.investorCompany.upsert({
          where: { name: companyName },
          create: {
            name: companyName,
            slug,
            description: nullIfEmpty(parsed.companyDescription),
            website: nullIfEmpty(parsed.companyWebsite),
            linkedin: nullIfEmpty(parsed.companyLinkedin),
            twitter: nullIfEmpty(parsed.companyTwitter),
            location: nullIfEmpty(parsed.companyLocation),
          },
          update: {
            description: nullIfEmpty(parsed.companyDescription),
            website: nullIfEmpty(parsed.companyWebsite),
            linkedin: nullIfEmpty(parsed.companyLinkedin),
            twitter: nullIfEmpty(parsed.companyTwitter),
            location: nullIfEmpty(parsed.companyLocation),
          },
        });
        companyId = company.id;
        await db.investorCompanyMember.upsert({
          where: { userId_companyId: { userId: user.id, companyId: company.id } },
          create: {
            userId: user.id,
            companyId: company.id,
            roleTitle: nullIfEmpty(parsed.roleTitle),
            isPrimary: true,
          },
          update: {
            roleTitle: nullIfEmpty(parsed.roleTitle),
            isPrimary: true,
          },
        });
      }

      await db.investorProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          investorType: parsed.investorType,
          roleTitle: nullIfEmpty(parsed.roleTitle),
          investmentThesis: nullIfEmpty(parsed.thesis),
          sectorFocus: splitCsv(parsed.sectorFocusCsv),
          chainFocus: splitCsv(parsed.chainFocusCsv),
          stageFocus: splitCsv(parsed.stageFocusCsv),
          geography: nullIfEmpty(parsed.geography),
          checkSizeMin: parsed.checkSizeMin ?? null,
          checkSizeMax: parsed.checkSizeMax ?? null,
          companyId,
          firmName: companyId ? companyName : null,
        },
        update: {
          investorType: parsed.investorType,
          roleTitle: nullIfEmpty(parsed.roleTitle),
          investmentThesis: nullIfEmpty(parsed.thesis),
          sectorFocus: splitCsv(parsed.sectorFocusCsv),
          chainFocus: splitCsv(parsed.chainFocusCsv),
          stageFocus: splitCsv(parsed.stageFocusCsv),
          geography: nullIfEmpty(parsed.geography),
          checkSizeMin: parsed.checkSizeMin ?? null,
          checkSizeMax: parsed.checkSizeMax ?? null,
          companyId,
          firmName: companyId ? companyName : null,
        },
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        role: toRole(workspace),
        onboardingComplete: true,
      },
    });
    await identityService.saveOnboardingProgress(user.id, "role_setup", { workspace });

    await db.premiumSubscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        tier: "FREE",
        status: "ACTIVE",
      },
      update: {},
    });

    revalidatePath("/app");
    revalidatePath("/app/onboarding");
    revalidatePath("/app/workspaces");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to complete onboarding." };
  }
}

export async function saveOnboardingIntegrations(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = integrationSchema.parse({
      providers: formData.getAll("providers").map((item) => String(item)),
    });

    await Promise.all(parsed.providers.map((provider) => integrationService.connectProvider({ userId: user.id, provider })));
    await identityService.saveOnboardingProgress(user.id, "integrations", { providers: parsed.providers });

    revalidatePath("/app/onboarding");
    revalidatePath("/app/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to save integrations." };
  }
}

export async function saveWalletConnection(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = walletSchema.parse({
      network: String(formData.get("network") ?? ""),
      provider: String(formData.get("provider") ?? ""),
      address: String(formData.get("address") ?? ""),
      signatureDigest: String(formData.get("signatureDigest") ?? ""),
    });

    await db.walletConnection.upsert({
      where: { network_address: { network: parsed.network, address: parsed.address.toLowerCase() } },
      create: {
        userId: user.id,
        network: parsed.network,
        provider: parsed.provider,
        address: parsed.address.toLowerCase(),
        signatureDigest: nullIfEmpty(parsed.signatureDigest),
        verifiedAt: new Date(),
        isPrimary: true,
      },
      update: {
        userId: user.id,
        provider: parsed.provider,
        signatureDigest: nullIfEmpty(parsed.signatureDigest),
        verifiedAt: new Date(),
        isPrimary: true,
      },
    });

    await db.walletConnection.updateMany({
      where: {
        userId: user.id,
        network: parsed.network,
        address: { not: parsed.address.toLowerCase() },
      },
      data: { isPrimary: false },
    });
    await identityService.saveOnboardingProgress(user.id, "wallet", {
      network: parsed.network,
      provider: parsed.provider,
    });

    revalidatePath("/app/onboarding");
    revalidatePath("/app/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to save wallet." };
  }
}

export async function saveMiniAppMetadata(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = miniAppSchema.parse({
      platform: String(formData.get("platform") ?? ""),
      sourceUrl: String(formData.get("sourceUrl") ?? ""),
      appName: String(formData.get("appName") ?? ""),
      manifestUrl: String(formData.get("manifestUrl") ?? ""),
      chain: String(formData.get("chain") ?? ""),
    });

    await db.miniAppMetadata.create({
      data: {
        ownerUserId: user.id,
        platform: parsed.platform,
        sourceUrl: parsed.sourceUrl,
        appName: nullIfEmpty(parsed.appName),
        manifestUrl: nullIfEmpty(parsed.manifestUrl),
        chain: nullIfEmpty(parsed.chain),
      },
    });

    revalidatePath("/app/founder-os");
    revalidatePath("/app/builder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to save mini app metadata." };
  }
}

async function resolveFounderQuota(userId: string) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));

  const subscription = await db.premiumSubscription.findUnique({ where: { userId } });
  const tier = subscription?.tier ?? SubscriptionTier.FREE;
  const limitCount = tier === SubscriptionTier.PREMIUM ? 10 : 3;

  const existing = await db.founderInvestorRequestQuota.findUnique({ where: { userId } });
  if (!existing || existing.cycleEnd <= now) {
    return db.founderInvestorRequestQuota.upsert({
      where: { userId },
      create: {
        userId,
        cycleStart: monthStart,
        cycleEnd: monthEnd,
        limitCount,
        sentCount: 0,
        tierSnapshot: tier,
      },
      update: {
        cycleStart: monthStart,
        cycleEnd: monthEnd,
        limitCount,
        sentCount: 0,
        tierSnapshot: tier,
      },
    });
  }

  if (existing.limitCount !== limitCount || existing.tierSnapshot !== tier) {
    return db.founderInvestorRequestQuota.update({
      where: { userId },
      data: {
        limitCount,
        tierSnapshot: tier,
      },
    });
  }

  return existing;
}

export async function submitInvestorApplication(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!["FOUNDER", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Only founders can submit investor applications." };
    }

    const ventureId = String(formData.get("ventureId") ?? "");
    const investorUserId = String(formData.get("investorUserId") ?? "");
    const pitchDeckId = String(formData.get("pitchDeckId") ?? "");
    const note = String(formData.get("note") ?? "");

    const [venture, investorProfile, quota] = await Promise.all([
      db.venture.findFirst({
        where: user.role === "ADMIN" ? { id: ventureId } : { id: ventureId, ownerUserId: user.id },
        select: { id: true },
      }),
      db.investorProfile.findUnique({
        where: { userId: investorUserId },
        select: { userId: true },
      }),
      resolveFounderQuota(user.id),
    ]);

    if (!venture) return { success: false, error: "Venture not found." };
    if (!investorProfile) return { success: false, error: "Investor not found." };
    if (quota.sentCount >= quota.limitCount && user.role !== "ADMIN") {
      return {
        success: false,
        error:
          quota.tierSnapshot === "PREMIUM"
            ? "Investor application quota reached for this cycle."
            : "Free cycle quota reached. Upgrade to Premium to send up to 10 investor applications per cycle.",
      };
    }

    const application = await db.investorApplication.create({
      data: {
        founderUserId: user.id,
        investorUserId,
        ventureId,
        pitchDeckId: pitchDeckId || null,
        note: nullIfEmpty(note),
      },
    });
    await writeAuditLog({
      userId: user.id,
      action: "create_investor_application",
      entityType: "InvestorApplication",
      entityId: application.id,
      metadata: {
        ventureId,
        investorUserId,
        pitchDeckId: pitchDeckId || null,
      },
    });

    await db.founderInvestorRequestQuota.update({
      where: { userId: user.id },
      data: { sentCount: { increment: 1 } },
    });

    revalidatePath("/app/founder-os");
    revalidatePath("/app/investor-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to submit investor application." };
  }
}

export async function updateInvestorApplicationStatus(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!["INVESTOR", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Only investors can update application status." };
    }

    const applicationId = String(formData.get("applicationId") ?? "");
    const status = String(formData.get("status") ?? "") as
      | "NEW"
      | "REVIEWING"
      | "INTERESTED"
      | "MEETING_SCHEDULED"
      | "PASSED";

    const updateResult = await db.investorApplication.updateMany({
      where: user.role === "ADMIN" ? { id: applicationId } : { id: applicationId, investorUserId: user.id },
      data: { status },
    });
    if (updateResult.count > 0) {
      await writeAuditLog({
        userId: user.id,
        action: "update_investor_application_status",
        entityType: "InvestorApplication",
        entityId: applicationId,
        metadata: {
          status,
          byRole: user.role,
        },
      });
    }

    revalidatePath("/app/investor-os");
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to update status." };
  }
}

export async function upsertResumeDocument(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    if (!["BUILDER", "FOUNDER", "ADMIN"].includes(user.role)) {
      return { success: false, error: "Only founder/builder profiles can update resumes." };
    }
    const fileUrl = String(formData.get("fileUrl") ?? "");
    const fileName = String(formData.get("fileName") ?? "");
    if (!fileUrl.startsWith("http")) return { success: false, error: "Resume URL must be valid." };

    await db.resumeDocument.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });
    await db.resumeDocument.create({
      data: {
        userId: user.id,
        fileUrl,
        fileName: nullIfEmpty(fileName),
        isActive: true,
      },
    });

    if (user.role === "BUILDER") {
      await db.builderProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          skills: [],
          interests: [],
          resumeUrl: fileUrl,
        },
        update: {
          resumeUrl: fileUrl,
        },
      });
    }

    revalidatePath("/app/builder-os");
    revalidatePath("/app/profile");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to save resume." };
  }
}

export async function createCoverLetterDraft(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const content = String(formData.get("content") ?? "");
    const targetRoleType = String(formData.get("targetRoleType") ?? "");
    const opportunityType = String(formData.get("opportunityType") ?? "");
    const companyName = String(formData.get("companyName") ?? "");
    if (content.trim().length < 40) {
      return { success: false, error: "Cover letter draft is too short." };
    }

    await db.coverLetterDraft.create({
      data: {
        userId: user.id,
        targetRoleType: nullIfEmpty(targetRoleType),
        opportunityType: nullIfEmpty(opportunityType),
        companyName: nullIfEmpty(companyName),
        content: content.trim(),
      },
    });

    revalidatePath("/app/builder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unable to save cover letter draft." };
  }
}
