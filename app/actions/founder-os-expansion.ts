"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { OpenClawConnectionStatus, Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { decryptSecret, encryptSecret } from "@/lib/security/crypto";
import { openClawConnect, OpenClawApiError, openClawListWorkspaces, openClawRefreshToken, openClawSendReply, openClawSyncThreads } from "@/lib/openclaw/client";
import { writeAuditLog } from "@/lib/audit";
import { logError, logEvent } from "@/lib/telemetry";
import { runUploadSafetyChecks } from "@/lib/security/upload-scan";
import { buildTokenomicsWorkbook, parseTokenomicsWorkbook } from "@/lib/tokenomics/sheet";
import { validateTokenomicsRows } from "@/lib/tokenomics/validation";
import { env } from "@/lib/env";

type Result = { success: true; message?: string } | { success: false; error: string };

const aiTokenomicsSchema = z.object({
  modelName: z.string().min(2),
  scenarioName: z.string().min(2),
  tokenSymbol: z.string().min(1).max(12),
  notes: z.string().min(1),
  allocations: z.array(
    z.object({
      label: z.string().min(1),
      percentage: z.number().min(0).max(100),
      cliffMonths: z.number().int().min(0).max(120).optional(),
      vestingMonths: z.number().int().min(0).max(120).optional(),
      unlockCadence: z.string().min(1).max(40).optional(),
      notes: z.string().max(200).optional(),
    }),
  ).min(3),
});

type TokenomicsDraftRow = {
  label: string;
  percentage?: number;
  tokenAmount?: number;
  cliffMonths?: number;
  vestingMonths?: number;
  unlockCadence?: string;
  notes?: string;
};

function n(value: FormDataEntryValue | null, fallback = 0) {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function s(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function d(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return new Prisma.Decimal(value);
}

async function requireUser() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  return session.user;
}

function allow(role: Role, roles: Role[]) {
  if (!roles.includes(role) && role !== "ADMIN") throw new Error("Unauthorized.");
}

async function verifyVenture(userId: string, role: Role, ventureId: string) {
  const venture = await db.venture.findFirst({
    where: role === "ADMIN" ? { id: ventureId } : { id: ventureId, ownerUserId: userId },
    select: { id: true },
  });
  if (!venture) throw new Error("Venture not found.");
}

async function recalculateRoundAggregates(roundId: string) {
  const commitments = await db.investorCommitment.findMany({
    where: { roundId },
    select: { amount: true, status: true },
  });
  let committed = 0;
  let interested = 0;
  commitments.forEach((commitment) => {
    const amount = commitment.amount ? Number(commitment.amount) : 0;
    if (commitment.status === "SOFT_COMMITTED") committed += amount;
    if (commitment.status === "INTERESTED") interested += amount;
  });
  const round = await db.raiseRound.findUnique({ where: { id: roundId }, select: { targetAmount: true } });
  if (!round) return;
  const target = Number(round.targetAmount || 0);
  const coverage = target > 0 ? ((committed + interested) / target) * 100 : null;
  await db.raiseRound.update({
    where: { id: roundId },
    data: {
      committedAmount: new Prisma.Decimal(committed),
      interestedAmount: new Prisma.Decimal(interested),
      coverageRatio: coverage === null ? null : new Prisma.Decimal(coverage),
    },
  });
}

async function createTokenomicsRevision(input: {
  scenarioId: string;
  userId: string;
  reason?: string | null;
  rows: Array<{
    label: string;
    percentage?: number;
    tokenAmount?: number;
    cliffMonths?: number;
    vestingMonths?: number;
    unlockCadence?: string;
    notes?: string;
  }>;
}) {
  const last = await db.tokenomicsScenarioRevision.findFirst({
    where: { scenarioId: input.scenarioId },
    orderBy: { revisionNumber: "desc" },
    select: { revisionNumber: true },
  });
  await db.tokenomicsScenarioRevision.create({
    data: {
      scenarioId: input.scenarioId,
      createdById: input.userId,
      reason: input.reason ?? null,
      revisionNumber: (last?.revisionNumber ?? 0) + 1,
      snapshotJson: { rows: input.rows },
    },
  });
}

function normalizeTokenomicsRows(totalSupply: number, rows: TokenomicsDraftRow[]) {
  return rows.map((row) => ({
    label: row.label.trim(),
    percentage: row.percentage ?? 0,
    tokenAmount: totalSupply > 0 && typeof row.percentage === "number" ? (totalSupply * row.percentage) / 100 : undefined,
    cliffMonths: row.cliffMonths ?? 0,
    vestingMonths: row.vestingMonths ?? 0,
    unlockCadence: row.unlockCadence ?? "Monthly",
    notes: row.notes ?? "",
  }));
}

function buildHeuristicTokenomicsDraft(input: {
  tokenSymbol: string;
  projectCategory: string;
  launchGoal: string;
  fundraisingPlan: string;
  communityPriority: string;
}) {
  const communityHeavy = input.communityPriority === "high";
  const fundraisingHeavy = input.fundraisingPlan === "institutional" || input.fundraisingPlan === "seed";
  const allocations: TokenomicsDraftRow[] = [
    { label: "Community & Ecosystem", percentage: communityHeavy ? 28 : 22, cliffMonths: 0, vestingMonths: 48, unlockCadence: "Monthly", notes: "Incentives, grants, ambassadors, and ecosystem activation." },
    { label: "Treasury", percentage: 20, cliffMonths: 0, vestingMonths: 48, unlockCadence: "Quarterly", notes: "Long-term protocol runway and strategic flexibility." },
    { label: "Core Team", percentage: fundraisingHeavy ? 18 : 20, cliffMonths: 12, vestingMonths: 36, unlockCadence: "Monthly", notes: "Aligned contributor vesting with meaningful retention." },
    { label: "Investors", percentage: fundraisingHeavy ? 18 : 12, cliffMonths: 12, vestingMonths: 24, unlockCadence: "Monthly", notes: "Private round and strategic backers." },
    { label: "Liquidity & Market Making", percentage: input.launchGoal === "tge" ? 10 : 8, cliffMonths: 0, vestingMonths: 12, unlockCadence: "Monthly", notes: "Liquidity support and exchange readiness." },
    { label: "Advisors", percentage: 4, cliffMonths: 6, vestingMonths: 24, unlockCadence: "Monthly", notes: "Targeted operator and technical support." },
  ];
  const total = allocations.reduce((sum, row) => sum + (row.percentage ?? 0), 0);
  if (total !== 100) {
    allocations[1].percentage = (allocations[1].percentage ?? 0) + (100 - total);
  }

  return {
    modelName: `${input.projectCategory} Token Model`,
    scenarioName: input.launchGoal === "tge" ? "TGE Launch Scenario" : "Foundation Scenario",
    tokenSymbol: input.tokenSymbol.toUpperCase(),
    notes: `Drafted for a ${input.projectCategory.toLowerCase()} project with a ${input.launchGoal.toLowerCase()} launch goal and ${input.fundraisingPlan.toLowerCase()} fundraising posture.`,
    allocations,
  };
}

async function generateAiTokenomicsDraft(input: {
  ventureName: string;
  tokenSymbol: string;
  totalSupply: number;
  projectCategory: string;
  launchGoal: string;
  fundraisingPlan: string;
  communityPriority: string;
}) {
  if (!env.GEMINI_API_KEY) {
    return buildHeuristicTokenomicsDraft(input);
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL ?? "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });

  const prompt = `
You are the tokenomics design copilot for Webcoin Labs.
Produce a realistic first-pass token allocation draft for an early-stage web3 startup.

Constraints:
- Return only valid JSON.
- Total allocation percentages must sum to exactly 100.
- Prefer 5 to 7 allocation buckets.
- Include conservative vesting defaults.
- Avoid exotic structures unless clearly necessary.
- Optimize for a founder who wants a professional editable starting point, not a final immutable answer.

Inputs:
- Venture: ${input.ventureName}
- Token symbol: ${input.tokenSymbol}
- Total supply: ${input.totalSupply}
- Category: ${input.projectCategory}
- Launch goal: ${input.launchGoal}
- Fundraising plan: ${input.fundraisingPlan}
- Community priority: ${input.communityPriority}

JSON schema:
{
  "modelName": string,
  "scenarioName": string,
  "tokenSymbol": string,
  "notes": string,
  "allocations": [
    {
      "label": string,
      "percentage": number,
      "cliffMonths": number,
      "vestingMonths": number,
      "unlockCadence": string,
      "notes": string
    }
  ]
}
`.trim();

  const response = await model.generateContent(prompt);
  const content = response.response.text();
  const parsed = JSON.parse(content);
  const validated = aiTokenomicsSchema.parse(parsed);
  const total = validated.allocations.reduce((sum, row) => sum + row.percentage, 0);
  if (Math.abs(total - 100) > 0.001) {
    throw new Error("AI draft percentages must sum to 100.");
  }
  return validated;
}

async function withOpenClawToken<T>(
  connection: { id: string; encryptedAccessToken: string | null; encryptedRefreshToken: string | null; status: OpenClawConnectionStatus },
  run: (token: string) => Promise<T>,
) {
  const accessToken = decryptSecret(connection.encryptedAccessToken);
  if (!accessToken) throw new Error("OpenClaw token unavailable.");
  try {
    return await run(accessToken);
  } catch (error) {
    if (!(error instanceof OpenClawApiError) || error.status !== 401 || !connection.encryptedRefreshToken) throw error;
    const refreshToken = decryptSecret(connection.encryptedRefreshToken);
    if (!refreshToken) throw error;
    const refreshed = await openClawRefreshToken(refreshToken);
    await db.openClawConnection.update({
      where: { id: connection.id },
      data: {
        encryptedAccessToken: encryptSecret(refreshed.accessToken),
        encryptedRefreshToken: refreshed.refreshToken ? encryptSecret(refreshed.refreshToken) : connection.encryptedRefreshToken,
        tokenExpiresAt: refreshed.expiresAt ? new Date(refreshed.expiresAt) : null,
        status: "CONNECTED",
      },
    });
    return run(refreshed.accessToken);
  }
}

export async function createOrUpdateActiveRound(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const ventureId = String(formData.get("ventureId") ?? "");
    await verifyVenture(user.id, user.role, ventureId);
    const status = String(formData.get("status") ?? "DRAFT") as "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
    const isActive = status === "ACTIVE";
    if (isActive) await db.raiseRound.updateMany({ where: { ventureId, isActive: true }, data: { isActive: false, status: "PAUSED" } });
    const existing = await db.raiseRound.findFirst({ where: { ventureId, isActive: true }, select: { id: true } });
    const payload = {
      roundName: String(formData.get("roundName") ?? "Current Round"),
      roundType: String(formData.get("roundType") ?? "Equity"),
      targetAmount: d(n(formData.get("targetAmount"), 0)) ?? new Prisma.Decimal(0),
      raisedAmount: d(n(formData.get("raisedAmount"), 0)) ?? new Prisma.Decimal(0),
      minTicketSize: d(n(formData.get("minTicketSize"), 0)),
      maxTicketSize: d(n(formData.get("maxTicketSize"), 0)),
      currency: String(formData.get("currency") ?? "USD"),
      runwayMonths: n(formData.get("runwayMonths"), 0) || null,
      closeDate: s(formData.get("closeDate")) ? new Date(String(formData.get("closeDate"))) : null,
      updateNotes: s(formData.get("updateNotes")),
      status,
      isActive,
    };
    let roundId: string;
    if (existing) {
      const updated = await db.raiseRound.update({ where: { id: existing.id }, data: payload });
      roundId = updated.id;
    } else {
      const created = await db.raiseRound.create({ data: { ...payload, ventureId, founderUserId: user.id } });
      roundId = created.id;
    }
    await recalculateRoundAggregates(roundId);
    await writeAuditLog({
      userId: user.id,
      action: "raise_round_upsert",
      entityType: "RaiseRound",
      entityId: roundId,
      metadata: { ventureId, status, isActive },
    });
    logEvent("raise_round_upsert", { userId: user.id, roundId, ventureId, status, isActive });
    revalidatePath("/app/founder-os");
    revalidatePath("/app/investor-os");
    return { success: true };
  } catch (e) {
    logError("raise_round_upsert_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Round save failed." };
  }
}

export async function updateRoundProgress(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const roundId = String(formData.get("roundId") ?? "");
    const result = await db.raiseRound.updateMany({
      where: user.role === "ADMIN" ? { id: roundId } : { id: roundId, founderUserId: user.id },
      data: { raisedAmount: new Prisma.Decimal(Math.max(0, n(formData.get("raisedAmount"), 0))), updateNotes: s(formData.get("updateNotes")) },
    });
    if (result.count === 0) return { success: false, error: "Round not found." };
    await recalculateRoundAggregates(roundId);
    await writeAuditLog({
      userId: user.id,
      action: "raise_round_progress_update",
      entityType: "RaiseRound",
      entityId: roundId,
      metadata: { raisedAmount: Math.max(0, n(formData.get("raisedAmount"), 0)) },
    });
    revalidatePath("/app/founder-os");
    revalidatePath("/app/investor-os");
    return { success: true };
  } catch (e) {
    logError("raise_round_progress_update_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Progress update failed." };
  }
}

export async function updateRoundStatus(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const roundId = String(formData.get("roundId") ?? "");
    const status = String(formData.get("status") ?? "DRAFT") as "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
    const round = await db.raiseRound.findFirst({
      where: user.role === "ADMIN" ? { id: roundId } : { id: roundId, founderUserId: user.id },
      select: { id: true, ventureId: true, roundName: true, isActive: true },
    });
    if (!round) return { success: false, error: "Round not found." };
    const isActive = status === "ACTIVE";
    if (isActive) {
      await db.raiseRound.updateMany({
        where: { ventureId: round.ventureId, isActive: true, id: { not: roundId } },
        data: { isActive: false, status: "PAUSED" },
      });
    }
    await db.raiseRound.update({
      where: { id: roundId },
      data: {
        status,
        isActive,
        updateNotes: s(formData.get("updateNotes")),
      },
    });
    await writeAuditLog({
      userId: user.id,
      action: "raise_round_status_update",
      entityType: "RaiseRound",
      entityId: roundId,
      metadata: { status, isActive },
    });
    await db.notification.create({
      data: {
        title: "Founder Round Update",
        message: `Round "${round.roundName}" status changed to ${status}.`,
        featureUrl: "/app/investor-os",
        targetRoles: ["INVESTOR", "ADMIN"],
        createdById: user.id,
      },
    });
    revalidatePath("/app/founder-os");
    revalidatePath("/app/investor-os");
    return { success: true };
  } catch (e) {
    logError("raise_round_status_update_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Round status update failed." };
  }
}

export async function addBuilderRaiseAsk(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const roundId = String(formData.get("roundId") ?? "");
    const round = await db.raiseRound.findFirst({ where: user.role === "ADMIN" ? { id: roundId } : { id: roundId, founderUserId: user.id } });
    if (!round) return { success: false, error: "Round not found." };
    const createdAsk = await db.builderRaiseAsk.create({
      data: {
        roundId,
        roleTitle: String(formData.get("roleTitle") ?? "Builder"),
        skillTags: String(formData.get("skillTags") ?? "").split(",").map((x) => x.trim()).filter(Boolean),
        askAmount: d(n(formData.get("askAmount"), 0)),
        useOfFunds: s(formData.get("useOfFunds")),
        urgency: s(formData.get("urgency")),
      },
    });
    await writeAuditLog({
      userId: user.id,
      action: "builder_raise_ask_create",
      entityType: "BuilderRaiseAsk",
      entityId: createdAsk.id,
      metadata: { roundId },
    });
    revalidatePath("/app/founder-os");
    revalidatePath("/app/investor-os");
    return { success: true };
  } catch (e) {
    logError("builder_raise_ask_create_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Builder ask failed." };
  }
}

export async function createInvestorCommitment(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["INVESTOR"]);
    const roundId = String(formData.get("roundId") ?? "");
    const round = await db.raiseRound.findUnique({ where: { id: roundId }, select: { isActive: true } });
    if (!round?.isActive) return { success: false, error: "Round is not active." };
    const commitment = await db.investorCommitment.upsert({
      where: { roundId_investorUserId: { roundId, investorUserId: user.id } },
      create: {
        roundId,
        investorUserId: user.id,
        amount: d(n(formData.get("amount"), 0)),
        note: s(formData.get("note")),
        status: String(formData.get("status") ?? "INTERESTED") as "INTERESTED" | "SOFT_COMMITTED" | "REVIEWING" | "PASSED",
      },
      update: {
        amount: d(n(formData.get("amount"), 0)),
        note: s(formData.get("note")),
        status: String(formData.get("status") ?? "INTERESTED") as "INTERESTED" | "SOFT_COMMITTED" | "REVIEWING" | "PASSED",
      },
    });
    await recalculateRoundAggregates(roundId);
    await writeAuditLog({
      userId: user.id,
      action: "investor_commitment_upsert",
      entityType: "InvestorCommitment",
      entityId: commitment.id,
      metadata: { roundId, status: commitment.status },
    });
    revalidatePath("/app/investor-os");
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (e) {
    logError("investor_commitment_upsert_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Commitment failed." };
  }
}

export async function updateInvestorCommitmentStatus(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["INVESTOR", "FOUNDER"]);
    const commitmentId = String(formData.get("commitmentId") ?? "");
    const status = String(formData.get("status") ?? "INTERESTED") as "INTERESTED" | "SOFT_COMMITTED" | "REVIEWING" | "PASSED";
    let updatedCount = 0;
    if (user.role === "INVESTOR") {
      const result = await db.investorCommitment.updateMany({ where: { id: commitmentId, investorUserId: user.id }, data: { status } });
      updatedCount = result.count;
    } else {
      const result = await db.investorCommitment.updateMany({ where: { id: commitmentId, round: { founderUserId: user.id } }, data: { status } });
      updatedCount = result.count;
    }
    if (updatedCount === 0) return { success: false, error: "Commitment not found." };
    const commitment = await db.investorCommitment.findUnique({ where: { id: commitmentId }, select: { roundId: true } });
    if (commitment?.roundId) await recalculateRoundAggregates(commitment.roundId);
    await writeAuditLog({
      userId: user.id,
      action: "investor_commitment_status_update",
      entityType: "InvestorCommitment",
      entityId: commitmentId,
      metadata: { status },
    });
    revalidatePath("/app/investor-os");
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (e) {
    logError("investor_commitment_status_update_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Commitment status update failed." };
  }
}

export async function connectOpenClaw(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const limiter = await rateLimitAsync(rateLimitKey(user.id, "openclaw-connect"), 8, 60_000);
    if (!limiter.ok) {
      logEvent("openclaw_connect_rate_limited", { userId: user.id });
      return { success: false, error: "Too many attempts." };
    }
    const data = await openClawConnect({
      telegramBotToken: s(formData.get("telegramBotToken")) ?? undefined,
      workspaceExternalId: s(formData.get("workspaceExternalId")) ?? undefined,
    });
    await db.openClawConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: "CONNECTED",
        encryptedAccessToken: encryptSecret(data.accessToken),
        encryptedRefreshToken: data.refreshToken ? encryptSecret(data.refreshToken) : null,
        tokenExpiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        externalWorkspaceId: data.workspaceExternalId ?? s(formData.get("workspaceExternalId")),
        baseUrl: s(formData.get("baseUrl")),
      },
      update: {
        status: "CONNECTED",
        encryptedAccessToken: encryptSecret(data.accessToken),
        encryptedRefreshToken: data.refreshToken ? encryptSecret(data.refreshToken) : null,
        tokenExpiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        externalWorkspaceId: data.workspaceExternalId ?? s(formData.get("workspaceExternalId")),
        baseUrl: s(formData.get("baseUrl")),
      },
    });
    await writeAuditLog({
      userId: user.id,
      action: "openclaw_connect",
      entityType: "OpenClawConnection",
      metadata: { workspaceExternalId: data.workspaceExternalId ?? s(formData.get("workspaceExternalId")) },
    });
    revalidatePath("/app/founder-os");
    revalidatePath("/app/founder-os/integrations");
    revalidatePath("/app/settings");
    return { success: true };
  } catch (e) {
    logError("openclaw_connect_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "OpenClaw connection failed." };
  }
}

export async function disconnectOpenClaw(): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    await db.openClawConnection.updateMany({
      where: { userId: user.id },
      data: {
        status: "DISCONNECTED",
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        tokenExpiresAt: null,
        externalWorkspaceId: null,
        lastSyncedAt: null,
      },
    });
    await writeAuditLog({
      userId: user.id,
      action: "openclaw_disconnect",
      entityType: "OpenClawConnection",
    });
    revalidatePath("/app/founder-os");
    revalidatePath("/app/settings");
    return { success: true };
  } catch (e) {
    logError("openclaw_disconnect_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "OpenClaw disconnect failed." };
  }
}

export async function syncTelegramThreads(formData?: FormData): Promise<Result> {
  let userId: string | null = null;
  try {
    const user = await requireUser();
    userId = user.id;
    allow(user.role, ["FOUNDER"]);
    const limiter = await rateLimitAsync(rateLimitKey(user.id, "openclaw-sync"), 20, 60_000);
    if (!limiter.ok) {
      logEvent("openclaw_sync_rate_limited", { userId: user.id });
      return { success: false, error: "Sync limit reached." };
    }
    const connection = await db.openClawConnection.findUnique({ where: { userId: user.id } });
    if (!connection) return { success: false, error: "OpenClaw not connected." };
    const ws = await withOpenClawToken(connection, async (token) => openClawListWorkspaces(token));
    for (const w of ws) {
      await db.telegramWorkspace.upsert({
        where: { connectionId_externalId: { connectionId: connection.id, externalId: w.id } },
        create: { connectionId: connection.id, externalId: w.id, workspaceType: w.type ?? "GROUP", title: w.title ?? null, username: w.username ?? null },
        update: { workspaceType: w.type ?? "GROUP", title: w.title ?? null, username: w.username ?? null, lastSyncedAt: new Date() },
      });
    }
    const workspaceId = s(formData?.get("workspaceId") ?? null);
    const selected = workspaceId
      ? await db.telegramWorkspace.findFirst({ where: { id: workspaceId, connectionId: connection.id } })
      : await db.telegramWorkspace.findFirst({ where: { connectionId: connection.id } });
    if (!selected) return { success: false, error: "No Telegram workspace available." };
    const sync = await withOpenClawToken(connection, async (token) => openClawSyncThreads(token, selected.externalId));
    for (const t of sync.threads) {
      const thread = await db.telegramThread.upsert({
        where: { workspaceId_externalThreadId: { workspaceId: selected.id, externalThreadId: t.id } },
        create: { workspaceId: selected.id, externalThreadId: t.id, title: t.title ?? null, lastMessageAt: t.lastMessageAt ? new Date(t.lastMessageAt) : null },
        update: { title: t.title ?? null, lastMessageAt: t.lastMessageAt ? new Date(t.lastMessageAt) : null },
      });
      const dedupedMessages = (t.messages ?? []).map((m, idx) => ({
        externalMessageId: m.id ?? `${t.id}-${m.sentAt ?? "na"}-${idx}`,
        direction: m.direction ?? "INBOUND",
        text: m.text ?? "",
        sentAt: m.sentAt ? new Date(m.sentAt) : null,
      }));
      if (dedupedMessages.length > 0) {
        await db.telegramMessage.createMany({
          data: dedupedMessages.map((m) => ({
            threadId: thread.id,
            externalMessageId: m.externalMessageId,
            direction: m.direction,
            text: m.text,
            sentAt: m.sentAt,
            recipientUserId: user.id,
          })),
          skipDuplicates: true,
        });
      }
      await db.telegramMessageSyncState.upsert({
        where: { threadId: thread.id },
        create: { threadId: thread.id, syncCursor: sync.cursor ?? null, lastSyncedAt: new Date() },
        update: { syncCursor: sync.cursor ?? null, lastSyncedAt: new Date() },
      });
    }
    await db.openClawConnection.update({ where: { id: connection.id }, data: { lastSyncedAt: new Date(), status: "CONNECTED" } });
    await writeAuditLog({
      userId: user.id,
      action: "openclaw_sync_threads",
      entityType: "OpenClawConnection",
      entityId: connection.id,
      metadata: { workspaceId: selected.id, syncedThreadCount: sync.threads.length },
    });
    revalidatePath("/app/founder-os");
    revalidatePath("/app/founder-os/integrations");
    revalidatePath("/app/settings");
    return { success: true };
  } catch (e) {
    if (userId && e instanceof OpenClawApiError && (e.status === 401 || e.status === 403)) {
      await db.openClawConnection.updateMany({
        where: { userId },
        data: { status: "ERROR" },
      });
    }
    logError("openclaw_sync_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Telegram sync failed." };
  }
}

export async function sendTelegramReply(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const limiter = await rateLimitAsync(rateLimitKey(user.id, "openclaw-send"), 25, 60_000);
    if (!limiter.ok) {
      logEvent("openclaw_send_rate_limited", { userId: user.id });
      return { success: false, error: "Message limit reached." };
    }
    const threadId = String(formData.get("threadId") ?? "");
    const text = String(formData.get("text") ?? "").trim();
    if (!text) return { success: false, error: "Message is required." };
    const thread = await db.telegramThread.findUnique({ where: { id: threadId }, include: { workspace: { include: { connection: true } } } });
    if (!thread || thread.workspace.connection.userId !== user.id) return { success: false, error: "Thread not found." };
    const sent = await withOpenClawToken(thread.workspace.connection, async (token) =>
      openClawSendReply(token, { workspaceExternalId: thread.workspace.externalId, threadExternalId: thread.externalThreadId, text }),
    );
    await db.telegramMessage.createMany({
      data: [
        {
          threadId: thread.id,
          externalMessageId: sent.messageId,
          direction: "OUTBOUND",
          text,
          sentAt: sent.sentAt ? new Date(sent.sentAt) : new Date(),
          senderUserId: user.id,
        },
      ],
      skipDuplicates: true,
    });
    await writeAuditLog({
      userId: user.id,
      action: "openclaw_send_reply",
      entityType: "TelegramThread",
      entityId: thread.id,
    });
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (e) {
    logError("openclaw_send_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Telegram send failed." };
  }
}

export async function createTokenomicsScenario(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const ventureId = String(formData.get("ventureId") ?? "");
    await verifyVenture(user.id, user.role, ventureId);
    const model = await db.tokenomicsModel.create({
      data: {
        ventureId,
        createdById: user.id,
        name: String(formData.get("name") ?? "Token Model"),
        totalSupply: new Prisma.Decimal(Math.max(0, n(formData.get("totalSupply"), 0))),
        tokenSymbol: s(formData.get("tokenSymbol")),
        notes: s(formData.get("notes")),
      },
    });
    const scenario = await db.tokenomicsScenario.create({
      data: {
        modelId: model.id,
        name: String(formData.get("scenarioName") ?? "Base Scenario"),
        fdvAssumption: d(n(formData.get("fdvAssumption"), 0)),
        circulatingSupply: d(n(formData.get("circulatingSupply"), 0)),
        tgeDate: s(formData.get("tgeDate")) ? new Date(String(formData.get("tgeDate"))) : null,
      },
    });
    await writeAuditLog({
      userId: user.id,
      action: "tokenomics_scenario_create",
      entityType: "TokenomicsScenario",
      entityId: scenario.id,
      metadata: { modelId: model.id, ventureId },
    });
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (e) {
    logError("tokenomics_scenario_create_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Tokenomics scenario failed." };
  }
}

export async function generateAiTokenomicsScenario(formData: FormData) {
  const user = await requireUser();
  allow(user.role, ["FOUNDER"]);
  const ventureId = String(formData.get("ventureId") ?? "");
  await verifyVenture(user.id, user.role, ventureId);

  const venture = await db.venture.findUnique({
    where: { id: ventureId },
    select: { id: true, name: true },
  });
  if (!venture) {
    throw new Error("Venture not found.");
  }

  const tokenSymbol = String(formData.get("tokenSymbol") ?? "TOKEN").trim().toUpperCase();
  const totalSupply = Math.max(0, n(formData.get("totalSupply"), 0));
  const projectCategory = String(formData.get("projectCategory") ?? "Protocol").trim() || "Protocol";
  const launchGoal = String(formData.get("launchGoal") ?? "TGE").trim() || "TGE";
  const fundraisingPlan = String(formData.get("fundraisingPlan") ?? "Seed").trim() || "Seed";
  const communityPriority = String(formData.get("communityPriority") ?? "Medium").trim().toLowerCase() || "medium";
  if (!tokenSymbol) throw new Error("Token symbol is required.");
  if (!totalSupply) throw new Error("Total supply is required.");

  const aiDraft = await generateAiTokenomicsDraft({
    ventureName: venture.name,
    tokenSymbol,
    totalSupply,
    projectCategory,
    launchGoal,
    fundraisingPlan,
    communityPriority,
  });

  const normalizedRows = normalizeTokenomicsRows(totalSupply, aiDraft.allocations);
  const validation = validateTokenomicsRows(normalizedRows);
  if (!validation.valid) {
    throw new Error(validation.issues[0] ?? "Generated tokenomics draft is invalid.");
  }

  const created = await db.$transaction(async (tx) => {
    const tokenModel = await tx.tokenomicsModel.create({
      data: {
        ventureId,
        createdById: user.id,
        name: aiDraft.modelName,
        totalSupply: new Prisma.Decimal(totalSupply),
        tokenSymbol: aiDraft.tokenSymbol,
        notes: aiDraft.notes,
      },
    });

    const scenario = await tx.tokenomicsScenario.create({
      data: {
        modelId: tokenModel.id,
        name: aiDraft.scenarioName,
        circulatingSupply: new Prisma.Decimal(
          normalizedRows
            .filter((row) => (row.cliffMonths ?? 0) === 0)
            .reduce((sum, row) => sum + (row.tokenAmount ?? 0), 0),
        ),
      },
    });

    await Promise.all(
      normalizedRows.map((row, index) =>
        tx.tokenomicsAllocationRow.create({
          data: {
            scenarioId: scenario.id,
            label: row.label,
            percentage: d(row.percentage),
            tokenAmount: d(row.tokenAmount),
            cliffMonths: row.cliffMonths ?? null,
            vestingMonths: row.vestingMonths ?? null,
            unlockCadence: row.unlockCadence ?? null,
            notes: row.notes ?? null,
            rowOrder: index,
          },
        }),
      ),
    );

    await createTokenomicsRevision({
      scenarioId: scenario.id,
      userId: user.id,
      reason: "ai_generated_initial_draft",
      rows: normalizedRows,
    });

    return {
      modelId: tokenModel.id,
      modelName: tokenModel.name,
      tokenSymbol: tokenModel.tokenSymbol ?? tokenSymbol,
      totalSupply,
      notes: tokenModel.notes ?? aiDraft.notes,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      ventureName: venture.name,
      rows: normalizedRows,
    };
  });

  await writeAuditLog({
    userId: user.id,
    action: "tokenomics_ai_generate",
    entityType: "TokenomicsScenario",
    entityId: created.scenarioId,
    metadata: {
      ventureId,
      modelId: created.modelId,
      projectCategory,
      launchGoal,
      fundraisingPlan,
      communityPriority,
    },
  });

  revalidatePath("/app/founder-os");

  return created;
}

export async function upsertAllocationRows(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const scenarioId = String(formData.get("scenarioId") ?? "");
    const rowsJson = String(formData.get("rowsJson") ?? "[]").trim();
    const scenario = await db.tokenomicsScenario.findUnique({ where: { id: scenarioId }, include: { model: true } });
    if (!scenario) return { success: false, error: "Scenario not found." };
    await verifyVenture(user.id, user.role, scenario.model.ventureId);
    let rows = [] as Array<{ label: string; percentage?: number; tokenAmount?: number; cliffMonths?: number; vestingMonths?: number; unlockCadence?: string; notes?: string }>;
    if (rowsJson && rowsJson !== "[]") {
      rows = JSON.parse(rowsJson) as Array<{ label: string; percentage?: number; tokenAmount?: number; cliffMonths?: number; vestingMonths?: number; unlockCadence?: string; notes?: string }>;
    } else {
      const labels = formData.getAll("rowLabel").map((v) => String(v ?? ""));
      const percentages = formData.getAll("rowPercentage").map((v) => String(v ?? ""));
      const tokenAmounts = formData.getAll("rowTokenAmount").map((v) => String(v ?? ""));
      const cliffs = formData.getAll("rowCliffMonths").map((v) => String(v ?? ""));
      const vestings = formData.getAll("rowVestingMonths").map((v) => String(v ?? ""));
      const cadences = formData.getAll("rowUnlockCadence").map((v) => String(v ?? ""));
      const notes = formData.getAll("rowNotes").map((v) => String(v ?? ""));
      rows = labels.map((label, idx) => ({
        label,
        percentage: percentages[idx] ? Number(percentages[idx]) : undefined,
        tokenAmount: tokenAmounts[idx] ? Number(tokenAmounts[idx]) : undefined,
        cliffMonths: cliffs[idx] ? Number(cliffs[idx]) : undefined,
        vestingMonths: vestings[idx] ? Number(vestings[idx]) : undefined,
        unlockCadence: cadences[idx] || undefined,
        notes: notes[idx] || undefined,
      }));
    }
    const valid = rows.filter((r) => r.label?.trim().length > 0);
    const validation = validateTokenomicsRows(valid);
    if (!validation.valid) return { success: false, error: validation.issues[0] ?? "Invalid allocation rows." };
    await db.$transaction([
      db.tokenomicsAllocationRow.deleteMany({ where: { scenarioId } }),
      ...valid.map((row, index) =>
        db.tokenomicsAllocationRow.create({
          data: {
            scenarioId,
            label: row.label.trim(),
            percentage: d(row.percentage),
            tokenAmount: d(row.tokenAmount),
            cliffMonths: row.cliffMonths ?? null,
            vestingMonths: row.vestingMonths ?? null,
            unlockCadence: row.unlockCadence ?? null,
            notes: row.notes ?? null,
            rowOrder: index,
          },
        }),
      ),
    ]);
    await createTokenomicsRevision({
      scenarioId,
      userId: user.id,
      reason: s(formData.get("revisionReason")) ?? "manual_update",
      rows: valid,
    });
    await writeAuditLog({
      userId: user.id,
      action: "tokenomics_rows_upsert",
      entityType: "TokenomicsScenario",
      entityId: scenarioId,
      metadata: { rowCount: valid.length, totalPercentage: validation.totalPercentage },
    });
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (e) {
    logError("tokenomics_rows_upsert_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Allocation update failed." };
  }
}

export async function importTokenomicsSheet(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const scenarioId = String(formData.get("scenarioId") ?? "");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { success: false, error: "Upload CSV/XLSX file." };
    await runUploadSafetyChecks(file);
    const scenario = await db.tokenomicsScenario.findUnique({ where: { id: scenarioId }, include: { model: true } });
    if (!scenario) return { success: false, error: "Scenario not found." };
    await verifyVenture(user.id, user.role, scenario.model.ventureId);
    const parsed = await parseTokenomicsWorkbook(Buffer.from(await file.arrayBuffer()), file.name);
    const validation = validateTokenomicsRows(parsed.rows);
    if (!validation.valid) return { success: false, error: validation.issues[0] ?? "Invalid tokenomics sheet." };
    if (file.size > 2 * 1024 * 1024) {
      await db.tokenomicsUpload.create({
        data: {
          modelId: scenario.modelId,
          uploadedById: user.id,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          status: "QUEUED",
          payloadJson: { scenarioId, rows: parsed.rows },
        },
      });
      await writeAuditLog({
        userId: user.id,
        action: "tokenomics_import_queued",
        entityType: "TokenomicsScenario",
        entityId: scenarioId,
        metadata: { fileName: file.name, rowCount: parsed.rows.length },
      });
      return { success: true, message: "Large sheet queued for background parsing." };
    }
    await db.tokenomicsUpload.create({ data: { modelId: scenario.modelId, uploadedById: user.id, fileName: file.name, fileType: file.type || "application/octet-stream", status: "COMPLETED", payloadJson: { rows: parsed.rows } } });
    await db.$transaction([
      db.tokenomicsAllocationRow.deleteMany({ where: { scenarioId } }),
      ...parsed.rows.map((row, index) =>
        db.tokenomicsAllocationRow.create({
          data: {
            scenarioId,
            label: row.label,
            percentage: d(row.percentage),
            tokenAmount: d(row.tokenAmount),
            cliffMonths: row.cliffMonths ?? null,
            vestingMonths: row.vestingMonths ?? null,
            unlockCadence: row.unlockCadence ?? null,
            notes: row.notes ?? null,
            rowOrder: index,
          },
        }),
      ),
    ]);
    await createTokenomicsRevision({
      scenarioId,
      userId: user.id,
      reason: "import_sheet",
      rows: parsed.rows,
    });
    await writeAuditLog({
      userId: user.id,
      action: "tokenomics_import",
      entityType: "TokenomicsScenario",
      entityId: scenarioId,
      metadata: { fileName: file.name, rowCount: parsed.rows.length },
    });
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (e) {
    logError("tokenomics_import_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Tokenomics import failed." };
  }
}

export async function exportTokenomicsSheet(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER", "INVESTOR"]);
    const scenarioId = String(formData.get("scenarioId") ?? "");
    const format = String(formData.get("format") ?? "xlsx") === "csv" ? "csv" : "xlsx";
    const scenario = await db.tokenomicsScenario.findUnique({
      where: { id: scenarioId },
      include: { model: { select: { ventureId: true } }, allocations: { orderBy: { rowOrder: "asc" } } },
    });
    if (!scenario) return { success: false, error: "Scenario not found." };
    if (user.role === "FOUNDER") await verifyVenture(user.id, user.role, scenario.model.ventureId);
    const wb = await buildTokenomicsWorkbook(
      scenario.allocations.map((row) => ({
        label: row.label,
        percentage: row.percentage ? Number(row.percentage) : undefined,
        tokenAmount: row.tokenAmount ? Number(row.tokenAmount) : undefined,
        cliffMonths: row.cliffMonths ?? undefined,
        vestingMonths: row.vestingMonths ?? undefined,
        unlockCadence: row.unlockCadence ?? undefined,
        notes: row.notes ?? undefined,
      })),
      format,
    );
    return { success: true, message: `data:${wb.mime};base64,${wb.buffer.toString("base64")}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Tokenomics export failed." };
  }
}

export async function rollbackTokenomicsScenarioRevision(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    allow(user.role, ["FOUNDER"]);
    const revisionId = String(formData.get("revisionId") ?? "");
    const revision = await db.tokenomicsScenarioRevision.findUnique({
      where: { id: revisionId },
      include: { scenario: { include: { model: true } } },
    });
    if (!revision) return { success: false, error: "Revision not found." };
    await verifyVenture(user.id, user.role, revision.scenario.model.ventureId);
    const snapshot = revision.snapshotJson as { rows?: Array<{ label: string; percentage?: number; tokenAmount?: number; cliffMonths?: number; vestingMonths?: number; unlockCadence?: string; notes?: string }> } | null;
    const rows = snapshot?.rows ?? [];
    const validation = validateTokenomicsRows(rows);
    if (!validation.valid) return { success: false, error: validation.issues[0] ?? "Invalid revision snapshot." };

    await db.$transaction([
      db.tokenomicsAllocationRow.deleteMany({ where: { scenarioId: revision.scenarioId } }),
      ...rows.map((row, index) =>
        db.tokenomicsAllocationRow.create({
          data: {
            scenarioId: revision.scenarioId,
            label: row.label,
            percentage: d(row.percentage),
            tokenAmount: d(row.tokenAmount),
            cliffMonths: row.cliffMonths ?? null,
            vestingMonths: row.vestingMonths ?? null,
            unlockCadence: row.unlockCadence ?? null,
            notes: row.notes ?? null,
            rowOrder: index,
          },
        }),
      ),
    ]);
    await createTokenomicsRevision({
      scenarioId: revision.scenarioId,
      userId: user.id,
      reason: `rollback_to_revision_${revision.revisionNumber}`,
      rows,
    });
    await writeAuditLog({
      userId: user.id,
      action: "tokenomics_revision_rollback",
      entityType: "TokenomicsScenario",
      entityId: revision.scenarioId,
      metadata: { revisionId, revisionNumber: revision.revisionNumber },
    });
    revalidatePath("/app/founder-os");
    return { success: true };
  } catch (e) {
    logError("tokenomics_revision_rollback_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Rollback failed." };
  }
}

export async function setContactVisibility(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    const settings = await db.publicProfileSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        showTelegramToInvestors: String(formData.get("showTelegramToInvestors") ?? "false") === "true",
        showLinkedinToInvestors: String(formData.get("showLinkedinToInvestors") ?? "false") === "true",
        showEmailToInvestors: String(formData.get("showEmailToInvestors") ?? "false") === "true",
      },
      update: {
        showTelegramToInvestors: String(formData.get("showTelegramToInvestors") ?? "false") === "true",
        showLinkedinToInvestors: String(formData.get("showLinkedinToInvestors") ?? "false") === "true",
        showEmailToInvestors: String(formData.get("showEmailToInvestors") ?? "false") === "true",
      },
    });
    await writeAuditLog({
      userId: user.id,
      action: "contact_visibility_update",
      entityType: "PublicProfileSettings",
      entityId: settings.id,
      metadata: {
        showTelegramToInvestors: settings.showTelegramToInvestors,
        showLinkedinToInvestors: settings.showLinkedinToInvestors,
        showEmailToInvestors: settings.showEmailToInvestors,
      },
    });
    revalidatePath("/app/profile");
    revalidatePath("/founder");
    revalidatePath("/builder");
    return { success: true };
  } catch (e) {
    logError("contact_visibility_update_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Contact visibility update failed." };
  }
}

export async function linkFounderBuilderIdentity(formData: FormData): Promise<Result> {
  try {
    const user = await requireUser();
    const toUsername = String(formData.get("toUsername") ?? "").toLowerCase().trim();
    if (!toUsername) return { success: false, error: "Username is required." };
    const target = await db.user.findFirst({
      where: { username: toUsername },
      select: { id: true, builderProfile: { select: { id: true } }, founderProfile: { select: { id: true } } },
    });
    if (!target) return { success: false, error: "Target profile not found." };
    if (target.id === user.id) return { success: false, error: "Profile already linked by shared identity." };
    const source = await db.user.findUnique({
      where: { id: user.id },
      select: { builderProfile: { select: { id: true } }, founderProfile: { select: { id: true } } },
    });
    const compatible = (Boolean(source?.builderProfile) && Boolean(target.founderProfile)) || (Boolean(source?.founderProfile) && Boolean(target.builderProfile));
    if (!compatible) return { success: false, error: "Requires founder and builder profiles across the two users." };
    await db.profileLink.upsert({
      where: { fromUserId_toUserId: { fromUserId: user.id, toUserId: target.id } },
      create: { fromUserId: user.id, toUserId: target.id, label: "Linked identity" },
      update: { label: "Linked identity" },
    });
    await writeAuditLog({
      userId: user.id,
      action: "profile_identity_link",
      entityType: "ProfileLink",
      metadata: { fromUserId: user.id, toUserId: target.id },
    });
    revalidatePath("/app/profile");
    revalidatePath("/founder");
    revalidatePath("/builder");
    return { success: true };
  } catch (e) {
    logError("profile_identity_link_failed", { message: e instanceof Error ? e.message : "Unknown error" });
    return { success: false, error: e instanceof Error ? e.message : "Profile link failed." };
  }
}

