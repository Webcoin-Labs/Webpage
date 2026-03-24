"use server";

import path from "path";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { getFileStorage } from "@/lib/storage";
import { extractDeckText, type DeckFileKind } from "@/lib/extraction/deckText";
import { analyzePitchDeckText } from "@/lib/ai/pitchAnalysis";
import { upsertPitchDeckUploadAsset } from "@/lib/uploads/assets";
import { logger } from "@/lib/logger";

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("You must be signed in.");
  if (!["FOUNDER", "ADMIN"].includes(session.user.role)) {
    throw new Error("Only founders can use pitch analysis.");
  }
  return session;
}

async function processPitchDeck(
  deckId: string,
  actor: { id: string; role: string }
): Promise<PitchDeckActionResult> {
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
    const storage = getFileStorage();
    const extension = detectedKind === "PDF" ? "pdf" : "docx";
    const storageKey = `pitch-decks/${deck.id}.${extension}`;
    const stored = await storage.store({
      fileName: safeFile.name,
      contentType:
        detectedKind === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer: fileBuffer,
      storageKey,
    });
    await db.pitchDeck.update({
      where: { id: deck.id },
      data: {
        fileUrl: stored.fileUrl,
        storageKey: stored.storageKey,
        uploadStatus: "STORED",
      },
    });
    await upsertPitchDeckUploadAsset(deck.id, {
      ownerUserId: session.user.id,
      fileUrl: stored.fileUrl,
      storageKey: stored.storageKey,
      mimeType:
        detectedKind === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: safeFile.size,
      originalName: safeFile.name,
    });
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

// Backward-compatible entry point used by existing UI.
export async function submitPitchDeck(formData: FormData): Promise<PitchDeckActionResult> {
  return uploadPitchDeck(formData);
}

export async function drainQueuedPitchDeckAnalyses(limit = 6) {
  const session = await getServerSession(authOptions);
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
