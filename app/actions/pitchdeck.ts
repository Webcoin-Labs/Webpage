"use server";

import path from "path";
import { getServerSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, SubscriptionTier } from "@prisma/client";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { getFileStorage } from "@/lib/storage";
import { extractDeckText, type DeckFileKind } from "@/lib/extraction/deckText";
import { analyzePitchDeckText } from "@/lib/ai/pitchAnalysis";
import { generateImprovedDeck, generateMissingSection, rewritePitchDeckSection } from "@/lib/ai/pitchRewrite";
import { buildSectionReviews, detectMissingSectionKeys, keyToSectionTitle } from "@/lib/pitchdeck/workspace";
import { upsertPitchDeckUploadAsset } from "@/lib/uploads/assets";
import { logger } from "@/lib/logger";
import { measureAsync } from "@/lib/perf/measure";

const MAX_FILE_BYTES = 14 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx"]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const payloadSchema = z.object({
  projectId: z.union([z.string().cuid(), z.literal(""), z.null(), z.undefined()]),
});

export type PitchDeckActionResult =
  | { success: true; pitchDeckId: string; reportId: string }
  | { success: false; error: string };

type DeckWithWorkspace = Prisma.PitchDeckGetPayload<{
  include: {
    reports: { orderBy: { createdAt: "desc" }; take: 1 };
    sections: { orderBy: { sectionOrder: "asc" } };
    versions: { orderBy: { createdAt: "desc" }; take: 20 };
  };
}>;

function isMissingPitchWorkspaceTableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("does not exist in the current database") &&
    (message.includes("pitchdecksection") || message.includes("pitchdeckversion"))
  );
}

function isAsyncAnalysisEnabled() {
  return String(process.env.PITCH_ANALYSIS_QUEUE_MODE ?? "").toLowerCase() === "async";
}

function getDeckKind(fileName: string, mimeType: string): DeckFileKind | null {
  const ext = path.extname(fileName || "").toLowerCase();
  const cleanMime = mimeType.toLowerCase();
  if (ext === ".pdf" || cleanMime === "application/pdf") return "PDF";
  if (
    ext === ".docx" ||
    cleanMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "DOCX";
  }
  return null;
}

function detectKindFromBuffer(buffer: Buffer): DeckFileKind | null {
  if (buffer.length < 4) return null;
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "PDF";
  }
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return "DOCX";
  }
  return null;
}

function validateUploadedFile(file: File | null): { kind: DeckFileKind } | { error: string } {
  if (!file) return { error: "Please upload a PDF or DOCX file." };
  if (file.size <= 0) return { error: "Uploaded file is empty." };
  if (file.size > MAX_FILE_BYTES) return { error: "File too large. Maximum is 14MB." };

  const ext = path.extname(file.name || "").toLowerCase();
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME.has(mime)) {
    return { error: "Only PDF and DOCX files are allowed." };
  }

  const kind = getDeckKind(file.name, file.type);
  if (!kind) return { error: "Unsupported document format. Upload PDF or DOCX." };
  return { kind };
}

async function assertFounderOrAdmin() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("You must be signed in.");
  if (!["FOUNDER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Only founders can use pitch analysis.");
  }
  return session;
}

async function hasPremiumPitchDeckAccess(userId: string, role: string) {
  if (role === "ADMIN") return true;
  const subscription = await db.premiumSubscription.findUnique({
    where: { userId },
    select: { tier: true, status: true },
  });
  return subscription?.tier === SubscriptionTier.PREMIUM && subscription.status === "ACTIVE";
}

async function ensureDeckOwnership(deckId: string, actor: { id: string; role: string }) {
  let deck: DeckWithWorkspace | null = null;
  try {
      deck = await db.pitchDeck.findUnique({
      where: { id: deckId },
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
        sections: { orderBy: { sectionOrder: "asc" } },
        versions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
  } catch (error) {
    if (!isMissingPitchWorkspaceTableError(error)) throw error;
    const fallbackDeck = await db.pitchDeck.findUnique({
      where: { id: deckId },
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (fallbackDeck) {
      deck = { ...fallbackDeck, sections: [], versions: [] } as DeckWithWorkspace;
    }
  }
  if (!deck) throw new Error("Pitch deck not found.");
  if (actor.role !== "ADMIN" && deck.userId !== actor.id) throw new Error("Unauthorized for this pitch deck.");
  return deck;
}

async function buildDeckStartupContext(deckId: string, userId: string) {
  const [deck, founderProfile, startups, ventures, raiseRounds] = await Promise.all([
    db.pitchDeck.findUnique({
      where: { id: deckId },
      select: { projectId: true, founderProfileId: true },
    }),
    db.founderProfileExtended.findUnique({
      where: { userId },
    }),
    db.startup.findMany({
      where: { founderId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.venture.findMany({
      where: { ownerUserId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    db.raiseRound.findMany({
      where: { founderUserId: userId, isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);

  const currentProject =
    deck?.projectId
      ? await db.project.findUnique({
          where: { id: deck.projectId },
          select: { id: true, name: true },
        })
      : null;

  return JSON.stringify(
    {
      founderProfile: founderProfile ?? null,
      project: currentProject ?? null,
      startups: startups.map((s) => ({
        name: s.name,
        stage: s.stage,
        chainFocus: s.chainFocus,
        problem: s.problem,
        solution: s.solution,
        traction: s.traction,
      })),
      ventures: ventures.map((v) => ({
        name: v.name,
        stage: v.stage,
        chainEcosystem: v.chainEcosystem,
        tagline: v.tagline,
        description: v.description,
      })),
      activeRounds: raiseRounds.map((r) => ({
        roundName: r.roundName,
        roundType: r.roundType,
        targetAmount: Number(r.targetAmount),
        raisedAmount: Number(r.raisedAmount),
        currency: r.currency,
      })),
    },
    null,
    2,
  );
}

async function processPitchDeck(
  deckId: string,
  actor: { id: string; role: string }
): Promise<PitchDeckActionResult> {
  return measureAsync(
    "pitchdeck.process",
    "process",
    async () => {
  const deck = await db.pitchDeck.findUnique({
    where: { id: deckId },
    include: {
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!deck) return { success: false, error: "Pitch deck not found." };
  if (actor.role !== "ADMIN" && deck.userId !== actor.id) {
    return { success: false, error: "Unauthorized for this pitch deck." };
  }

  const report = deck.reports[0];
  if (!report) return { success: false, error: "Report record missing." };

  try {
    await db.pitchDeck.update({
      where: { id: deck.id },
      data: { processingStatus: "EXTRACTING" },
    });
    await db.aIReport.update({
      where: { id: report.id },
      data: { status: "PROCESSING", errorMessage: null },
    });

    if (!deck.storageKey) {
      throw new Error("Missing storage key for extraction.");
    }
    const storage = getFileStorage();
    const buffer = await storage.getBuffer(deck.storageKey);

    const kind = getDeckKind(deck.originalFileName, deck.fileType);
    if (!kind) throw new Error("Could not infer deck file type.");
    const extractedText = await extractDeckText(buffer, kind);

    await db.pitchDeck.update({
      where: { id: deck.id },
      data: {
        extractedText,
        extractionError: null,
        uploadStatus: "STORED",
        processingStatus: "ANALYZING",
      },
    });

    const analysis = await analyzePitchDeckText(extractedText, deck.originalFileName);

    await db.aIReport.update({
      where: { id: report.id },
      data: {
        status: "COMPLETED",
        modelName: analysis.modelName,
        deckType: analysis.output.deckType,
        clarityScore: analysis.output.clarityScore,
        completenessScore: analysis.output.completenessScore,
        investorReadinessScore: analysis.output.investorReadinessScore,
        marketPositioningSummary: analysis.output.marketPositioningSummary,
        productThesis: analysis.output.productThesis,
        businessModelSummary: analysis.output.businessModelSummary,
        problemSummary: analysis.output.problemSummary,
        solutionSummary: analysis.output.solutionSummary,
        targetCustomerSummary: analysis.output.targetCustomerSummary,
        tractionSummary: analysis.output.tractionSummary,
        tokenModelSummary: analysis.output.tokenModelSummary,
        goToMarketSummary: analysis.output.goToMarketSummary,
        fundingReadinessNotes: analysis.output.fundingReadinessNotes,
        strengths: analysis.output.strengths,
        gtmGaps: analysis.output.gtmGaps,
        risks: analysis.output.risks,
        nextSteps: analysis.output.nextSteps,
        missingInformation: analysis.output.missingInformation,
        confidenceNotes: analysis.output.confidenceNotes,
        rawJson: analysis.raw as object,
        errorMessage: null,
      },
    });

    const sectionReviews = buildSectionReviews(extractedText);
    const missingSectionKeys = detectMissingSectionKeys(sectionReviews, analysis.output.deckType);
    const missingLabels = missingSectionKeys.map((key) => keyToSectionTitle(key));
    try {
      await db.pitchDeckSection.deleteMany({ where: { pitchDeckId: deck.id } });
      if (sectionReviews.length > 0) {
        await db.pitchDeckSection.createMany({
          data: sectionReviews.map((section) => ({
            pitchDeckId: deck.id,
            reportId: report.id,
            sectionKey: section.key,
            sectionTitle: section.title,
            sectionOrder: section.order,
            extractedText: section.extractedText,
            qualityLabel: section.qualityLabel,
            goodPoints: section.goodPoints,
            unclearPoints: section.unclearPoints,
            missingPoints: section.missingPoints,
            fixSummary: section.fixSummary,
          })),
        });
      }
      await db.pitchDeckVersion.create({
        data: {
          pitchDeckId: deck.id,
          userId: deck.userId,
          reportId: report.id,
          name: `Original analysis ${new Date().toLocaleDateString()}`,
          versionType: "ORIGINAL",
          contentJson: {
            generatedFrom: "analysis",
            missingSections: missingLabels,
            reportSnapshot: {
              deckType: analysis.output.deckType,
              clarityScore: analysis.output.clarityScore,
              completenessScore: analysis.output.completenessScore,
              investorReadinessScore: analysis.output.investorReadinessScore,
              strengths: analysis.output.strengths,
              gtmGaps: analysis.output.gtmGaps,
              risks: analysis.output.risks,
              nextSteps: analysis.output.nextSteps,
              missingInformation: analysis.output.missingInformation,
            },
            sections: sectionReviews,
          } as object,
        },
      });
    } catch (error) {
      if (!isMissingPitchWorkspaceTableError(error)) throw error;
      logger.warn({
        scope: "pitchdeck.process.workspaceTables",
        message: "Pitch deck workspace tables missing. Continuing with core report only.",
        data: { pitchDeckId: deck.id },
      });
    }

    await db.pitchDeck.update({
      where: { id: deck.id },
      data: {
        processingStatus: "COMPLETED",
        analysisProvider: "GEMINI",
        uploadStatus: "STORED",
      },
    });
    await db.uploadAsset.updateMany({
      where: { pitchDeckId: deck.id },
      data: {
        status: "ACTIVE",
        moderationReason: null,
      },
    });

    revalidatePath("/pitchdeck");
    revalidatePath("/app");
    revalidatePath("/app/admin");
    revalidatePath("/app/admin/pitch-decks");
    return { success: true, pitchDeckId: deck.id, reportId: report.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pitch analysis failed.";
    logger.error({
      scope: "pitchdeck.process",
      message: "Pitch deck processing failed.",
      error,
      data: { pitchDeckId: deck.id, userId: actor.id },
    });
    const shouldFailAsset =
      !deck.storageKey || /extract|storage key|file type|document format|signature/i.test(message);
    await db.pitchDeck.update({
      where: { id: deck.id },
      data: {
        processingStatus: "FAILED",
        uploadStatus: "FAILED",
        extractionError: message,
      },
    });
    if (shouldFailAsset) {
      await db.uploadAsset.updateMany({
        where: { pitchDeckId: deck.id },
        data: {
          status: "FAILED",
          moderationReason: message.slice(0, 220),
          moderatedAt: new Date(),
        },
      });
    }
    await db.aIReport.update({
      where: { id: report.id },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });
    revalidatePath("/pitchdeck");
    revalidatePath("/app");
    revalidatePath("/app/admin/pitch-decks");
    return { success: false, error: message };
  }
    },
    { deckId, actorId: actor.id, actorRole: actor.role }
  );
}

export async function uploadPitchDeck(formData: FormData): Promise<PitchDeckActionResult> {
  const session = await assertFounderOrAdmin();
  const limiter = await rateLimitAsync(rateLimitKey(session.user.id, "pitchdeck-upload"), 5, 60_000);
  if (!limiter.ok) return { success: false, error: "Too many uploads. Please try again shortly." };

  const parsed = payloadSchema.safeParse({ projectId: formData.get("projectId") });
  if (!parsed.success) return { success: false, error: "Invalid payload." };

  const file = formData.get("file");
  const uploaded = file instanceof File ? file : null;
  const validated = validateUploadedFile(uploaded);
  if ("error" in validated) return { success: false, error: validated.error };
  const safeFile = uploaded as File;
  const fileBuffer = Buffer.from(await safeFile.arrayBuffer());
  const detectedKind = detectKindFromBuffer(fileBuffer);
  if (!detectedKind) return { success: false, error: "Uploaded file signature is invalid." };
  if (detectedKind !== validated.kind) {
    return { success: false, error: "File content does not match declared format." };
  }

  const projectId = parsed.data.projectId || null;
  if (projectId) {
    const project = await db.project.findFirst({
      where: session.user.role === "ADMIN" ? { id: projectId } : { id: projectId, ownerUserId: session.user.id },
      select: { id: true },
    });
    if (!project) return { success: false, error: "Project not found for this account." };
  }

  const founderProfile = await db.founderProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const deck = await db.pitchDeck.create({
    data: {
      userId: session.user.id,
      founderProfileId: founderProfile?.id ?? null,
      projectId,
      originalFileName: safeFile.name,
      fileType: detectedKind === "PDF" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: safeFile.size,
      fileUrl: "",
      storageKey: null,
      uploadStatus: "RECEIVED",
      processingStatus: "QUEUED",
      analysisProvider: "GEMINI",
    },
  });

  const report = await db.aIReport.create({
    data: {
      pitchDeckId: deck.id,
      status: "QUEUED",
    },
  });

  try {
    await measureAsync("pitchdeck.upload", "store-source-file", async () => {
    const storage = getFileStorage();
    const extension = detectedKind === "PDF" ? "pdf" : "docx";
    const storageKey = `private/pitch-decks/${deck.id}.${extension}`;
    const privateProxyUrl = `/api/uploads/private/pitch-deck/${deck.id}`;
    const stored = await storage.store({
      fileName: safeFile.name,
      contentType:
        detectedKind === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: fileBuffer,
      storageKey,
      visibility: "private",
      pathPrefix: "private/pitch-decks",
    });
    await db.pitchDeck.update({
      where: { id: deck.id },
      data: {
        fileUrl: privateProxyUrl,
        storageKey: stored.storageKey,
        uploadStatus: "STORED",
      },
    });
    await upsertPitchDeckUploadAsset(deck.id, {
      ownerUserId: session.user.id,
      fileUrl: privateProxyUrl,
      storageKey: stored.storageKey,
      mimeType:
        detectedKind === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: safeFile.size,
      originalName: safeFile.name,
    });
    }, { userId: session.user.id, deckId: deck.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "File upload failed.";
    logger.error({
      scope: "pitchdeck.upload",
      message: "Pitch deck upload failed before processing.",
      error,
      data: { pitchDeckId: deck.id, userId: session.user.id },
    });
    await db.pitchDeck.update({
      where: { id: deck.id },
      data: { uploadStatus: "FAILED", processingStatus: "FAILED", extractionError: message },
    });
    await db.aIReport.update({
      where: { id: report.id },
      data: { status: "FAILED", errorMessage: message },
    });
    return { success: false, error: message };
  }

  if (isAsyncAnalysisEnabled()) {
    revalidatePath("/pitchdeck");
    revalidatePath("/app");
    revalidatePath("/app/admin/pitch-decks");
    return { success: true, pitchDeckId: deck.id, reportId: report.id };
  }

  return processPitchDeck(deck.id, { id: session.user.id, role: session.user.role });
}

export async function extractPitchDeckText(pitchDeckId: string): Promise<PitchDeckActionResult> {
  const session = await assertFounderOrAdmin();
  return processPitchDeck(pitchDeckId, { id: session.user.id, role: session.user.role });
}

export async function analyzePitchDeck(pitchDeckId: string): Promise<PitchDeckActionResult> {
  const session = await assertFounderOrAdmin();
  return processPitchDeck(pitchDeckId, { id: session.user.id, role: session.user.role });
}

export async function retryPitchDeckAnalysis(pitchDeckId: string): Promise<PitchDeckActionResult> {
  const session = await assertFounderOrAdmin();
  const limiter = await rateLimitAsync(rateLimitKey(session.user.id, "pitchdeck-retry"), 10, 60_000);
  if (!limiter.ok) return { success: false, error: "Too many retries. Please try again later." };
  if (isAsyncAnalysisEnabled()) {
    const latestReport = await db.aIReport.findFirst({
      where: { pitchDeckId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    await db.pitchDeck.update({
      where: { id: pitchDeckId },
      data: { processingStatus: "QUEUED", extractionError: null },
    });
    if (latestReport?.id) {
      await db.aIReport.update({
        where: { id: latestReport.id },
        data: { status: "QUEUED", errorMessage: null },
      });
    }
    revalidatePath("/pitchdeck");
    revalidatePath("/app");
    revalidatePath("/app/admin/pitch-decks");
    return { success: true, pitchDeckId, reportId: latestReport?.id ?? "queued" };
  }

  return processPitchDeck(pitchDeckId, { id: session.user.id, role: session.user.role });
}

export async function getLatestPitchDeckReport() {
  const session = await assertFounderOrAdmin();
  return db.pitchDeck.findFirst({
    where: { userId: session.user.id },
    include: { reports: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPitchDecksForFounder(limit = 12) {
  const session = await assertFounderOrAdmin();
  return db.pitchDeck.findMany({
    where: { userId: session.user.id },
    include: { reports: { orderBy: { createdAt: "desc" }, take: 1 }, project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
  });
}

export async function listPitchDeckWorkspaceData(limit = 20) {
  const session = await assertFounderOrAdmin();
  const [isPremium, projects, ventures] = await Promise.all([
    hasPremiumPitchDeckAccess(session.user.id, session.user.role),
    db.project.findMany({
      where: { ownerUserId: session.user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.venture.findMany({
      where: { ownerUserId: session.user.id },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);
  const takeLimit = Math.min(Math.max(limit, 1), 40);
  let decks: Array<Record<string, unknown>> = [];
  try {
    decks = await db.pitchDeck.findMany({
      where: { userId: session.user.id },
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
        sections: { orderBy: { sectionOrder: "asc" } },
        versions: { orderBy: { createdAt: "desc" }, take: 25 },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: takeLimit,
    });
  } catch (error) {
    if (!isMissingPitchWorkspaceTableError(error)) throw error;
    const fallbackDecks = await db.pitchDeck.findMany({
      where: { userId: session.user.id },
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: takeLimit,
    });
    decks = fallbackDecks.map((deck) => ({
      ...deck,
      sections: [],
      versions: [],
    }));
  }

  return {
    isPremium,
    decks,
    projects,
    ventures,
    now: new Date().toISOString(),
  };
}

export async function rewritePitchDeckSectionAction(formData: FormData): Promise<PitchDeckActionResult> {
  const session = await assertFounderOrAdmin();
  const pitchDeckId = String(formData.get("pitchDeckId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "");
  const tone = String(formData.get("tone") ?? "sharper investor language");
  if (!pitchDeckId || !sectionId) return { success: false, error: "Missing section context." };

  const isPremium = await hasPremiumPitchDeckAccess(session.user.id, session.user.role);
  if (!isPremium) {
    return { success: false, error: "Premium required to rewrite sections." };
  }

  const deck = await ensureDeckOwnership(pitchDeckId, { id: session.user.id, role: session.user.role });
  const section = deck.sections.find((item) => item.id === sectionId);
  if (!section) return { success: false, error: "Section not found." };

  const startupContext = await buildDeckStartupContext(deck.id, session.user.id);
  const rewritten = await rewritePitchDeckSection({
    sectionTitle: section.sectionTitle,
    sectionText: section.extractedText,
    fullDeckText: deck.extractedText ?? "",
    tone,
    startupContext,
  });

  const version = await db.pitchDeckVersion.create({
    data: {
      pitchDeckId: deck.id,
      userId: session.user.id,
      reportId: deck.reports[0]?.id ?? null,
      name: `Section rewrite - ${section.sectionTitle}`,
      versionType: "AI_IMPROVED",
      contentJson: {
        action: "rewrite-section",
        sourceSectionId: section.id,
        sourceSectionTitle: section.sectionTitle,
        rewritten,
        provenance: {
          generator: "ai-rewrite",
          generatedAt: new Date().toISOString(),
          truthfulness: "assistant_output_based_on_uploaded_deck_and_saved_profile_context",
        },
      } as object,
    },
  });

  revalidatePath("/app/founder-os/pitch-deck");
  revalidatePath("/pitchdeck");
  return { success: true, pitchDeckId: deck.id, reportId: version.id };
}

export async function generateMissingPitchSectionAction(formData: FormData): Promise<PitchDeckActionResult> {
  const session = await assertFounderOrAdmin();
  const pitchDeckId = String(formData.get("pitchDeckId") ?? "");
  const sectionKey = String(formData.get("sectionKey") ?? "");
  if (!pitchDeckId || !sectionKey) return { success: false, error: "Missing generation context." };

  const isPremium = await hasPremiumPitchDeckAccess(session.user.id, session.user.role);
  if (!isPremium) {
    return { success: false, error: "Premium required to generate missing sections." };
  }

  const deck = await ensureDeckOwnership(pitchDeckId, { id: session.user.id, role: session.user.role });
  const startupContext = await buildDeckStartupContext(deck.id, session.user.id);
  const generated = await generateMissingSection({
    sectionTitle: keyToSectionTitle(sectionKey),
    fullDeckText: deck.extractedText ?? "",
    startupContext,
  });

  const version = await db.pitchDeckVersion.create({
    data: {
      pitchDeckId: deck.id,
      userId: session.user.id,
      reportId: deck.reports[0]?.id ?? null,
      name: `Generated missing section - ${generated.sectionTitle}`,
      versionType: "AI_IMPROVED",
      contentJson: {
        action: "generate-missing-section",
        sectionKey,
        generated,
        provenance: {
          generator: "ai-missing-section",
          generatedAt: new Date().toISOString(),
          truthfulness: "assistant_output_based_on_uploaded_deck_and_saved_profile_context",
        },
      } as object,
    },
  });
  revalidatePath("/app/founder-os/pitch-deck");
  return { success: true, pitchDeckId: deck.id, reportId: version.id };
}

export async function generateImprovedPitchDeckVersionAction(formData: FormData): Promise<PitchDeckActionResult> {
  const session = await assertFounderOrAdmin();
  const pitchDeckId = String(formData.get("pitchDeckId") ?? "");
  if (!pitchDeckId) return { success: false, error: "Missing deck context." };

  const isPremium = await hasPremiumPitchDeckAccess(session.user.id, session.user.role);
  if (!isPremium) return { success: false, error: "Premium required to generate improved deck versions." };

  const deck = await ensureDeckOwnership(pitchDeckId, { id: session.user.id, role: session.user.role });
  const startupContext = await buildDeckStartupContext(deck.id, session.user.id);
  const improved = await generateImprovedDeck({
    deckText: deck.extractedText ?? "",
    startupContext,
  });
  const version = await db.pitchDeckVersion.create({
    data: {
      pitchDeckId: deck.id,
      userId: session.user.id,
      reportId: deck.reports[0]?.id ?? null,
      name: `AI improved deck ${new Date().toLocaleDateString()}`,
      versionType: "AI_IMPROVED",
      contentJson: {
        action: "generate-improved-deck",
        generated: improved,
        provenance: {
          generator: "ai-improved-deck",
          generatedAt: new Date().toISOString(),
          truthfulness: "assistant_output_based_on_uploaded_deck_and_saved_profile_context",
        },
      } as object,
    },
  });
  revalidatePath("/app/founder-os/pitch-deck");
  return { success: true, pitchDeckId: deck.id, reportId: version.id };
}

export async function generateStartupDraftPitchDeckAction(formData: FormData): Promise<PitchDeckActionResult> {
  const session = await assertFounderOrAdmin();
  const pitchDeckId = String(formData.get("pitchDeckId") ?? "");
  if (!pitchDeckId) return { success: false, error: "Missing deck context." };

  const isPremium = await hasPremiumPitchDeckAccess(session.user.id, session.user.role);
  if (!isPremium) return { success: false, error: "Premium required to generate startup-based draft decks." };

  const deck = await ensureDeckOwnership(pitchDeckId, { id: session.user.id, role: session.user.role });
  const startupContext = await buildDeckStartupContext(deck.id, session.user.id);
  const startupDraft = await generateImprovedDeck({
    deckText: deck.extractedText ?? "No deck text available yet. Use startup context only.",
    startupContext,
  });
  const version = await db.pitchDeckVersion.create({
    data: {
      pitchDeckId: deck.id,
      userId: session.user.id,
      reportId: deck.reports[0]?.id ?? null,
      name: `Startup-based draft ${new Date().toLocaleDateString()}`,
      versionType: "STARTUP_DRAFT",
      contentJson: {
        action: "startup-context-draft",
        generated: startupDraft,
        provenance: {
          generator: "ai-startup-draft",
          generatedAt: new Date().toISOString(),
          truthfulness: "assistant_output_based_on_uploaded_deck_and_saved_profile_context",
        },
      } as object,
    },
  });
  revalidatePath("/app/founder-os/pitch-deck");
  return { success: true, pitchDeckId: deck.id, reportId: version.id };
}

// Backward-compatible entry point used by existing UI.
export async function submitPitchDeck(formData: FormData): Promise<PitchDeckActionResult> {
  return uploadPitchDeck(formData);
}

export async function drainQueuedPitchDeckAnalyses(limit = 6) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" as const };
  }
  return drainQueuedPitchDeckAnalysesBySystem(limit);
}

export async function drainQueuedPitchDeckAnalysesBySystem(limit = 6) {
  const decks = await db.pitchDeck.findMany({
    where: {
      uploadStatus: "STORED",
      processingStatus: { in: ["QUEUED", "FAILED"] },
    },
    orderBy: { updatedAt: "asc" },
    take: Math.min(Math.max(limit, 1), 25),
    select: { id: true },
  });

  let processed = 0;
  const failed: Array<{ pitchDeckId: string; error: string }> = [];
  for (const deck of decks) {
    const result = await processPitchDeck(deck.id, { id: "system", role: "ADMIN" });
    if (!result.success) {
      failed.push({ pitchDeckId: deck.id, error: result.error });
      continue;
    }
    processed += 1;
  }

  return { success: true as const, scanned: decks.length, processed, failed };
}

