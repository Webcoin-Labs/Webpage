"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
import { z } from "zod";
import { BadgeType, Role, StartupChainFocus, StartupStage } from "@prisma/client";
import { db } from "@/server/db/client";
import {
  buildStartupSlug,
  detectBadgesFromText,
  detectTechStackFromText,
  parseRepoName,
} from "@/lib/founder-os";
import {
  generateInvestorPitchEmail,
  generatePitchOneLiner,
  summarizeMarketSignals,
} from "@/lib/ai/founderOs";

type ActionResult = { success: true; message?: string } | { success: false; error: string };

const startupSchema = z.object({
  startupId: z.string().cuid().optional().or(z.literal("")),
  name: z.string().min(2).max(120),
  tagline: z.string().max(180).optional().or(z.literal("")),
  description: z.string().max(2500).optional().or(z.literal("")),
  stage: z.nativeEnum(StartupStage),
  chainFocus: z.nativeEnum(StartupChainFocus),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().max(300).optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
  pitchDeckUrl: z.string().max(600).optional().or(z.literal("")),
  githubRepo: z.string().url().optional().or(z.literal("")),
  problem: z.string().max(2500).optional().or(z.literal("")),
  solution: z.string().max(2500).optional().or(z.literal("")),
  traction: z.string().max(2500).optional().or(z.literal("")),
  revenue: z.string().max(120).optional().or(z.literal("")),
  usersCount: z.coerce.number().int().min(0).max(100000000).optional(),
  isHiring: z.coerce.boolean().default(false),
});

const founderProfileExtendedSchema = z.object({
  whyThisStartup: z.string().max(2500).optional().or(z.literal("")),
  problemStatement: z.string().max(2500).optional().or(z.literal("")),
  targetUser: z.string().max(1800).optional().or(z.literal("")),
  businessModel: z.string().max(1800).optional().or(z.literal("")),
  competitors: z.string().max(1800).optional().or(z.literal("")),
  differentiation: z.string().max(1800).optional().or(z.literal("")),
  longTermVision: z.string().max(1800).optional().or(z.literal("")),
  freeTimeActivities: z.string().max(1200).optional().or(z.literal("")),
  pastExperience: z.string().max(1800).optional().or(z.literal("")),
  whyYou: z.string().max(1800).optional().or(z.literal("")),
});

const cofounderPreferencesSchema = z.object({
  roleWanted: z.string().min(2).max(100),
  equityExpectation: z.string().max(120).optional().or(z.literal("")),
  timeCommitment: z.string().max(120).optional().or(z.literal("")),
  remotePreference: z.string().max(120).optional().or(z.literal("")),
  skillsNeeded: z.string().max(800).optional().or(z.literal("")),
  motivation: z.string().max(1800).optional().or(z.literal("")),
  expectations: z.string().max(1800).optional().or(z.literal("")),
  workingStyle: z.string().max(1800).optional().or(z.literal("")),
});

const investorSchema = z.object({
  fundName: z.string().min(2).max(140),
  investmentStage: z.string().min(2).max(120),
  ticketSize: z.string().max(120).optional().or(z.literal("")),
  thesis: z.string().max(2500).optional().or(z.literal("")),
  chainsInterested: z.string().max(300).optional().or(z.literal("")),
});

const githubActivitySchema = z.object({
  startupId: z.string().cuid(),
  githubUsername: z.string().min(2).max(80),
  repoUrl: z.string().url(),
  lastCommitHash: z.string().max(80).optional().or(z.literal("")),
  lastCommitMessage: z.string().max(300).optional().or(z.literal("")),
  contributorsCsv: z.string().max(500).optional().or(z.literal("")),
  techStackCsv: z.string().max(500).optional().or(z.literal("")),
});

const investorIntroSchema = z.object({
  startupId: z.string().cuid(),
  investorUserId: z.string().cuid(),
  founderNote: z.string().max(1800).optional().or(z.literal("")),
});

const chatThreadSchema = z.object({
  startupId: z.string().cuid().optional().or(z.literal("")),
  title: z.string().min(2).max(120),
  contextType: z.enum(["GENERAL", "HIRE", "FUNDING", "BUILD"]).default("GENERAL"),
  contextLabel: z.string().max(120).optional().or(z.literal("")),
  participantIds: z.string().max(1000).optional().or(z.literal("")),
});

const chatMessageSchema = z.object({
  threadId: z.string().cuid(),
  content: z.string().min(1).max(1800),
});

const meetingLinkSchema = z.object({
  calendlyUrl: z.string().url().optional().or(z.literal("")),
});

const meetingSchema = z.object({
  startupId: z.string().cuid().optional().or(z.literal("")),
  attendeeUserId: z.string().cuid(),
  title: z.string().min(2).max(120),
  scheduledAt: z.string(),
  notes: z.string().max(1500).optional().or(z.literal("")),
});

const marketSignalSchema = z.object({
  source: z.string().min(2).max(80),
  signalType: z.string().min(2).max(80),
  title: z.string().min(2).max(180),
  summary: z.string().min(8).max(2500),
  signalUrl: z.string().url().optional().or(z.literal("")),
});

function splitCsv(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function requireRole(roles: Role[]) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("You must be signed in.");
  if (!roles.includes(session.user.role)) throw new Error("You are not authorized for this action.");
  return session.user;
}

async function ensureStartupOwnership(userId: string, role: Role, startupId: string) {
  const startup = await db.startup.findFirst({
    where: role === "ADMIN" ? { id: startupId } : { id: startupId, founderId: userId },
  });
  if (!startup) throw new Error("Startup not found or inaccessible.");
  return startup;
}

export async function upsertStartup(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "ADMIN"]);
    const parsed = startupSchema.safeParse({
      startupId: String(formData.get("startupId") ?? ""),
      name: String(formData.get("name") ?? ""),
      tagline: String(formData.get("tagline") ?? ""),
      description: String(formData.get("description") ?? ""),
      stage: String(formData.get("stage") ?? "IDEA"),
      chainFocus: String(formData.get("chainFocus") ?? "ARC"),
      website: String(formData.get("website") ?? ""),
      twitter: String(formData.get("twitter") ?? ""),
      linkedin: String(formData.get("linkedin") ?? ""),
      pitchDeckUrl: String(formData.get("pitchDeckUrl") ?? ""),
      githubRepo: String(formData.get("githubRepo") ?? ""),
      problem: String(formData.get("problem") ?? ""),
      solution: String(formData.get("solution") ?? ""),
      traction: String(formData.get("traction") ?? ""),
      revenue: String(formData.get("revenue") ?? ""),
      usersCount: formData.get("usersCount") ? String(formData.get("usersCount")) : undefined,
      isHiring: String(formData.get("isHiring") ?? "false") === "true",
    });

    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };
    const payload = parsed.data;

    if (!payload.startupId && user.role !== "ADMIN") {
      const startupCount = await db.startup.count({ where: { founderId: user.id } });
      if (startupCount >= 10) {
        return { success: false, error: "You can manage up to 10 startups in this workspace." };
      }
    }

    const slugBase = buildStartupSlug(payload.name);
    let slug = slugBase;
    let n = 0;
    while (await db.startup.findFirst({ where: { slug, ...(payload.startupId ? { id: { not: payload.startupId } } : {}) } })) {
      n += 1;
      slug = `${slugBase}-${n}`;
    }

    const data = {
      name: payload.name.trim(),
      slug,
      tagline: toNull(payload.tagline),
      description: toNull(payload.description),
      stage: payload.stage,
      chainFocus: payload.chainFocus,
      website: toNull(payload.website),
      twitter: toNull(payload.twitter),
      linkedin: toNull(payload.linkedin),
      pitchDeckUrl: toNull(payload.pitchDeckUrl),
      githubRepo: toNull(payload.githubRepo),
      problem: toNull(payload.problem),
      solution: toNull(payload.solution),
      traction: toNull(payload.traction),
      revenue: toNull(payload.revenue),
      usersCount: payload.usersCount ?? null,
      isHiring: payload.isHiring,
    };

    if (payload.startupId) {
      await ensureStartupOwnership(user.id, user.role, payload.startupId);
      await db.startup.update({
        where: { id: payload.startupId },
        data,
      });
    } else {
      await db.startup.create({
        data: {
          founderId: user.id,
          ...data,
        },
      });
    }

    revalidatePath("/app");
    revalidatePath("/app/founder-os");
    revalidatePath("/startups");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save startup." };
  }
}

export async function upsertFounderProfileExtended(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "ADMIN"]);
    const parsed = founderProfileExtendedSchema.safeParse({
      whyThisStartup: String(formData.get("whyThisStartup") ?? ""),
      problemStatement: String(formData.get("problemStatement") ?? ""),
      targetUser: String(formData.get("targetUser") ?? ""),
      businessModel: String(formData.get("businessModel") ?? ""),
      competitors: String(formData.get("competitors") ?? ""),
      differentiation: String(formData.get("differentiation") ?? ""),
      longTermVision: String(formData.get("longTermVision") ?? ""),
      freeTimeActivities: String(formData.get("freeTimeActivities") ?? ""),
      pastExperience: String(formData.get("pastExperience") ?? ""),
      whyYou: String(formData.get("whyYou") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    await db.founderProfileExtended.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        whyThisStartup: toNull(parsed.data.whyThisStartup),
        problemStatement: toNull(parsed.data.problemStatement),
        targetUser: toNull(parsed.data.targetUser),
        businessModel: toNull(parsed.data.businessModel),
        competitors: toNull(parsed.data.competitors),
        differentiation: toNull(parsed.data.differentiation),
        longTermVision: toNull(parsed.data.longTermVision),
        freeTimeActivities: toNull(parsed.data.freeTimeActivities),
        pastExperience: toNull(parsed.data.pastExperience),
        whyYou: toNull(parsed.data.whyYou),
      },
      update: {
        whyThisStartup: toNull(parsed.data.whyThisStartup),
        problemStatement: toNull(parsed.data.problemStatement),
        targetUser: toNull(parsed.data.targetUser),
        businessModel: toNull(parsed.data.businessModel),
        competitors: toNull(parsed.data.competitors),
        differentiation: toNull(parsed.data.differentiation),
        longTermVision: toNull(parsed.data.longTermVision),
        freeTimeActivities: toNull(parsed.data.freeTimeActivities),
        pastExperience: toNull(parsed.data.pastExperience),
        whyYou: toNull(parsed.data.whyYou),
      },
    });

    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save profile extension." };
  }
}

export async function upsertCofounderPreferences(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "ADMIN"]);
    const parsed = cofounderPreferencesSchema.safeParse({
      roleWanted: String(formData.get("roleWanted") ?? ""),
      equityExpectation: String(formData.get("equityExpectation") ?? ""),
      timeCommitment: String(formData.get("timeCommitment") ?? ""),
      remotePreference: String(formData.get("remotePreference") ?? ""),
      skillsNeeded: String(formData.get("skillsNeeded") ?? ""),
      motivation: String(formData.get("motivation") ?? ""),
      expectations: String(formData.get("expectations") ?? ""),
      workingStyle: String(formData.get("workingStyle") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    await db.cofounderPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        roleWanted: parsed.data.roleWanted.trim(),
        equityExpectation: toNull(parsed.data.equityExpectation),
        timeCommitment: toNull(parsed.data.timeCommitment),
        remotePreference: toNull(parsed.data.remotePreference),
        skillsNeeded: splitCsv(parsed.data.skillsNeeded),
        motivation: toNull(parsed.data.motivation),
        expectations: toNull(parsed.data.expectations),
        workingStyle: toNull(parsed.data.workingStyle),
      },
      update: {
        roleWanted: parsed.data.roleWanted.trim(),
        equityExpectation: toNull(parsed.data.equityExpectation),
        timeCommitment: toNull(parsed.data.timeCommitment),
        remotePreference: toNull(parsed.data.remotePreference),
        skillsNeeded: splitCsv(parsed.data.skillsNeeded),
        motivation: toNull(parsed.data.motivation),
        expectations: toNull(parsed.data.expectations),
        workingStyle: toNull(parsed.data.workingStyle),
      },
    });

    revalidatePath("/app/founder-os");
    revalidatePath("/app/matches");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save cofounder preferences." };
  }
}

export async function upsertInvestorOperatingProfile(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["INVESTOR", "ADMIN"]);
    const parsed = investorSchema.safeParse({
      fundName: String(formData.get("fundName") ?? ""),
      investmentStage: String(formData.get("investmentStage") ?? ""),
      ticketSize: String(formData.get("ticketSize") ?? ""),
      thesis: String(formData.get("thesis") ?? ""),
      chainsInterested: String(formData.get("chainsInterested") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    await db.investor.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        fundName: parsed.data.fundName.trim(),
        investmentStage: parsed.data.investmentStage.trim(),
        ticketSize: toNull(parsed.data.ticketSize),
        thesis: toNull(parsed.data.thesis),
        chainsInterested: splitCsv(parsed.data.chainsInterested),
      },
      update: {
        fundName: parsed.data.fundName.trim(),
        investmentStage: parsed.data.investmentStage.trim(),
        ticketSize: toNull(parsed.data.ticketSize),
        thesis: toNull(parsed.data.thesis),
        chainsInterested: splitCsv(parsed.data.chainsInterested),
      },
    });

    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save investor profile." };
  }
}

export async function upsertGithubActivity(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "BUILDER", "ADMIN"]);
    const parsed = githubActivitySchema.safeParse({
      startupId: String(formData.get("startupId") ?? ""),
      githubUsername: String(formData.get("githubUsername") ?? ""),
      repoUrl: String(formData.get("repoUrl") ?? ""),
      lastCommitHash: String(formData.get("lastCommitHash") ?? ""),
      lastCommitMessage: String(formData.get("lastCommitMessage") ?? ""),
      contributorsCsv: String(formData.get("contributorsCsv") ?? ""),
      techStackCsv: String(formData.get("techStackCsv") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const startup = await ensureStartupOwnership(user.id, user.role, parsed.data.startupId);
    const repoName = parseRepoName(parsed.data.repoUrl);
    const contributors = splitCsv(parsed.data.contributorsCsv);
    const manualTechStack = splitCsv(parsed.data.techStackCsv);
    const detectedTechStack = detectTechStackFromText(
      [parsed.data.repoUrl, parsed.data.lastCommitMessage, startup.description, startup.problem, startup.solution].filter(Boolean).join(" "),
    );
    const techStack = Array.from(new Set([...manualTechStack, ...detectedTechStack]));

    await db.githubConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        username: parsed.data.githubUsername.trim(),
        profileUrl: `https://github.com/${parsed.data.githubUsername.trim()}`,
        accessMode: "manual_sync",
        lastSyncedAt: new Date(),
      },
      update: {
        username: parsed.data.githubUsername.trim(),
        profileUrl: `https://github.com/${parsed.data.githubUsername.trim()}`,
        accessMode: "manual_sync",
        lastSyncedAt: new Date(),
      },
    });

    await db.startupGithubActivity.upsert({
      where: { startupId: startup.id },
      create: {
        startupId: startup.id,
        repoUrl: parsed.data.repoUrl,
        repoName,
        lastCommitHash: toNull(parsed.data.lastCommitHash),
        lastCommitMessage: toNull(parsed.data.lastCommitMessage),
        lastCommitAt: parsed.data.lastCommitMessage ? new Date() : null,
        contributorsJson: contributors,
        commitActivityJson: {
          source: "manual_sync",
          updatedAt: new Date().toISOString(),
        },
        techStack,
      },
      update: {
        repoUrl: parsed.data.repoUrl,
        repoName,
        lastCommitHash: toNull(parsed.data.lastCommitHash),
        lastCommitMessage: toNull(parsed.data.lastCommitMessage),
        lastCommitAt: parsed.data.lastCommitMessage ? new Date() : null,
        contributorsJson: contributors,
        commitActivityJson: {
          source: "manual_sync",
          updatedAt: new Date().toISOString(),
        },
        techStack,
      },
    });

    const badges = detectBadgesFromText([parsed.data.repoUrl, parsed.data.lastCommitMessage, techStack.join(",")].join(" "));
    for (const badgeType of badges) {
      await db.userBadge.upsert({
        where: { userId_badgeType: { userId: user.id, badgeType } },
        create: { userId: user.id, badgeType, verified: false, sourceNote: "Auto-detected from repo activity." },
        update: { sourceNote: "Auto-detected from repo activity." },
      });
    }

    revalidatePath("/app/founder-os");
    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not sync GitHub activity." };
  }
}

export async function setManualBadge(badgeType: BadgeType): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "BUILDER", "ADMIN"]);
    await db.userBadge.upsert({
      where: { userId_badgeType: { userId: user.id, badgeType } },
      create: { userId: user.id, badgeType, verified: false, sourceNote: "Manual request by user." },
      update: { sourceNote: "Manual request by user." },
    });
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save badge." };
  }
}

export async function requestInvestorIntro(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "ADMIN"]);
    const parsed = investorIntroSchema.safeParse({
      startupId: String(formData.get("startupId") ?? ""),
      investorUserId: String(formData.get("investorUserId") ?? ""),
      founderNote: String(formData.get("founderNote") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const [startup, investorProfile, founderInfo, founderExtended] = await Promise.all([
      ensureStartupOwnership(user.id, user.role, parsed.data.startupId),
      db.investor.findUnique({
        where: { userId: parsed.data.investorUserId },
        include: { user: { select: { name: true } } },
      }),
      db.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      }),
      db.founderProfileExtended.findUnique({
        where: { userId: user.id },
        select: { targetUser: true },
      }),
    ]);

    if (!investorProfile) return { success: false, error: "Investor not found." };
    const generatedEmail = await generateInvestorPitchEmail({
      founderName: founderInfo?.name ?? "Founder",
      startupName: startup.name,
      startupTagline: startup.tagline,
      problem: startup.problem,
      solution: startup.solution,
      traction: startup.traction,
      investorName: investorProfile.user.name ?? investorProfile.fundName,
      investorThesis: investorProfile.thesis,
    });
    const oneLiner = await generatePitchOneLiner({
      startupName: startup.name,
      problem: startup.problem,
      solution: startup.solution,
      targetUser: founderExtended?.targetUser ?? null,
    });

    await db.investorIntroRequest.create({
      data: {
        founderId: user.id,
        startupId: startup.id,
        investorUserId: investorProfile.userId,
        generatedEmail: `${generatedEmail}\n\nOne-liner: ${oneLiner}`,
        founderNote: toNull(parsed.data.founderNote),
      },
    });

    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not send investor intro request." };
  }
}

export async function createFounderChatThread(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "BUILDER", "INVESTOR", "ADMIN"]);
    const parsed = chatThreadSchema.safeParse({
      startupId: String(formData.get("startupId") ?? ""),
      title: String(formData.get("title") ?? ""),
      contextType: String(formData.get("contextType") ?? "GENERAL"),
      contextLabel: String(formData.get("contextLabel") ?? ""),
      participantIds: String(formData.get("participantIds") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    if (parsed.data.startupId) {
      await db.startup.findUniqueOrThrow({ where: { id: parsed.data.startupId } });
    }

    const inviteToken = crypto.randomUUID().replace(/-/g, "");
    const contextType = parsed.data.contextType === "HIRE" ? "HIRING" : parsed.data.contextType;
    const thread = await db.chatThread.create({
      data: {
        startupId: toNull(parsed.data.startupId),
        createdByUserId: user.id,
        title: parsed.data.title.trim(),
        contextType: contextType as "GENERAL" | "HIRING" | "FUNDING" | "BUILD",
        contextLabel: toNull(parsed.data.contextLabel),
        inviteToken,
        isGroup: splitCsv(parsed.data.participantIds).length > 1,
        participants: {
          create: [{ userId: user.id }, ...splitCsv(parsed.data.participantIds).map((userId) => ({ userId }))],
        },
      },
    });

    revalidatePath("/app/founder-os");
    return { success: true, message: `/app/founder-os?thread=${thread.id}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not create chat thread." };
  }
}

export async function sendFounderChatMessage(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "BUILDER", "INVESTOR", "ADMIN"]);
    const parsed = chatMessageSchema.safeParse({
      threadId: String(formData.get("threadId") ?? ""),
      content: String(formData.get("content") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const participant = await db.chatParticipant.findUnique({
      where: { threadId_userId: { threadId: parsed.data.threadId, userId: user.id } },
    });
    if (!participant && user.role !== "ADMIN") {
      return { success: false, error: "You are not a participant in this chat." };
    }

    await db.chatMessage.create({
      data: {
        threadId: parsed.data.threadId,
        senderId: user.id,
        content: parsed.data.content.trim(),
      },
    });

    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not send message." };
  }
}

export async function joinFounderChatByInvite(inviteToken: string): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "BUILDER", "INVESTOR", "ADMIN"]);
    const thread = await db.chatThread.findUnique({ where: { inviteToken } });
    if (!thread) return { success: false, error: "Invite link is invalid." };

    await db.chatParticipant.upsert({
      where: { threadId_userId: { threadId: thread.id, userId: user.id } },
      create: { threadId: thread.id, userId: user.id },
      update: {},
    });
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not join chat." };
  }
}

export async function upsertCalendlyLink(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "BUILDER", "INVESTOR", "ADMIN"]);
    const parsed = meetingLinkSchema.safeParse({
      calendlyUrl: String(formData.get("calendlyUrl") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    const calendlyUrl = toNull(parsed.data.calendlyUrl);

    await db.meetingLink.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        calendlyUrl,
      },
      update: {
        calendlyUrl,
      },
    });

    await db.integrationConnection.upsert({
      where: { userId_provider: { userId: user.id, provider: "CALENDLY" } },
      create: {
        userId: user.id,
        provider: "CALENDLY",
        status: calendlyUrl ? "CONNECTED" : "DISCONNECTED",
        externalEmail: user.email ?? null,
        externalUserId: user.username ?? null,
        lastSyncedAt: calendlyUrl ? new Date() : null,
      },
      update: {
        status: calendlyUrl ? "CONNECTED" : "DISCONNECTED",
        externalEmail: calendlyUrl ? user.email ?? null : null,
        externalUserId: calendlyUrl ? user.username ?? null : null,
        encryptedToken: calendlyUrl ? undefined : null,
        refreshToken: calendlyUrl ? undefined : null,
        lastSyncedAt: calendlyUrl ? new Date() : null,
      },
    });

    revalidatePath("/app/founder-os");
    revalidatePath("/app/founder-os/integrations");
    revalidatePath("/app/builder-os/integrations");
    revalidatePath("/app/investor-os/integrations");
    revalidatePath("/app/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save Calendly link." };
  }
}

export async function createMeetingRecord(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "BUILDER", "INVESTOR", "ADMIN"]);
    const parsed = meetingSchema.safeParse({
      startupId: String(formData.get("startupId") ?? ""),
      attendeeUserId: String(formData.get("attendeeUserId") ?? ""),
      title: String(formData.get("title") ?? ""),
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };
    const scheduledAt = new Date(parsed.data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) return { success: false, error: "Provide a valid schedule date." };

    await db.meetingRecord.create({
      data: {
        startupId: toNull(parsed.data.startupId),
        hostUserId: user.id,
        attendeeUserId: parsed.data.attendeeUserId,
        title: parsed.data.title.trim(),
        scheduledAt,
        notes: toNull(parsed.data.notes),
      },
    });

    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not create meeting." };
  }
}

export async function saveMarketSignal(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "BUILDER", "INVESTOR", "ADMIN"]);
    const parsed = marketSignalSchema.safeParse({
      source: String(formData.get("source") ?? ""),
      signalType: String(formData.get("signalType") ?? ""),
      title: String(formData.get("title") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      signalUrl: String(formData.get("signalUrl") ?? ""),
    });
    if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };

    await db.marketSignal.create({
      data: {
        createdById: user.id,
        source: parsed.data.source.trim(),
        signalType: parsed.data.signalType.trim(),
        title: parsed.data.title.trim(),
        summary: parsed.data.summary.trim(),
        signalUrl: toNull(parsed.data.signalUrl),
      },
    });
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not save market signal." };
  }
}

export async function generateFounderMarketInsight(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole(["FOUNDER", "ADMIN"]);
    const startupId = toNull(String(formData.get("startupId") ?? ""));
    const signals = await db.marketSignal.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { source: true, signalType: true, title: true, summary: true },
    });
    if (signals.length === 0) return { success: false, error: "Add some market signals first." };

    const startup = startupId
      ? await db.startup.findFirst({
          where: user.role === "ADMIN" ? { id: startupId } : { id: startupId, founderId: user.id },
          select: { id: true, name: true, description: true, problem: true },
        })
      : null;

    const signalText = signals
      .map((signal) => `[${signal.source}] ${signal.signalType} :: ${signal.title} - ${signal.summary}`)
      .join("\n");
    const ai = await summarizeMarketSignals({
      rawSignals: signalText,
      startupContext: startup ? `${startup.name}. ${startup.problem ?? ""} ${startup.description ?? ""}` : null,
    });

    await db.founderMarketInsight.create({
      data: {
        founderId: user.id,
        startupId: startup?.id ?? null,
        founderPainPoints: ai.founderPainPoints,
        trendingProblems: ai.trendingProblems,
        generatedBy: "GEMINI",
        sourceSignalCount: signals.length,
      },
    });

    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not generate market insight." };
  }
}

