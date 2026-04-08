import "server-only";

import { db } from "@/server/db/client";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import type { PitchActor } from "./pitchdeck.guards";

/**
 * pitchdeck.queries.ts
 * --------------------
 * All read-side database queries for pitch deck data, extracted from
 * `app/actions/pitchdeck.ts`.
 *
 * These are pure async functions (no "use server" directive) so they can
 * be called from Server Components, Route Handlers, and Server Actions alike.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type DeckWithWorkspace = Prisma.PitchDeckGetPayload<{
  include: {
    reports: { orderBy: { createdAt: "desc" }; take: 1 };
    sections: { orderBy: { sectionOrder: "asc" } };
    versions: { orderBy: { createdAt: "desc" }; take: 20 };
  };
}>;

function isMissingWorkspaceTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("does not exist in the current database") &&
    (msg.includes("pitchdecksection") || msg.includes("pitchdeckversion"))
  );
}

// ---------------------------------------------------------------------------
// Ownership resolver
// ---------------------------------------------------------------------------

/**
 * ensureDeckOwnership
 * -------------------
 * Fetches a PitchDeck with its workspace relations and asserts that the
 * actor either owns it or is an ADMIN. Throws on violation.
 *
 * Gracefully degrades to a lightweight query when workspace tables are absent
 * (migration guard).
 */
export async function ensureDeckOwnership(
  deckId: string,
  actor: PitchActor
): Promise<DeckWithWorkspace> {
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
    if (!isMissingWorkspaceTableError(error)) throw error;
    const fallback = await db.pitchDeck.findUnique({
      where: { id: deckId },
      include: { reports: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (fallback) {
      deck = { ...fallback, sections: [], versions: [] } as DeckWithWorkspace;
    }
  }

  if (!deck) throw new Error("Pitch deck not found.");
  if (actor.role !== "ADMIN" && deck.userId !== actor.id) {
    throw new Error("Unauthorized for this pitch deck.");
  }
  return deck;
}

// ---------------------------------------------------------------------------
// Startup/Venture context builder
// ---------------------------------------------------------------------------

/**
 * buildDeckStartupContext
 * -----------------------
 * Builds a JSON string carrying the founder's profile + startup/venture
 * context for AI prompts. Queries `Startup`, `Venture`, `RaiseRound`, and
 * `FounderProfileExtended` in parallel.
 *
 * Extracted verbatim from `app/actions/pitchdeck.ts` — no logic changes.
 */
export async function buildDeckStartupContext(
  deckId: string,
  userId: string
): Promise<string> {
  const [deck, founderProfile, startups, ventures, raiseRounds] =
    await Promise.all([
      db.pitchDeck.findUnique({
        where: { id: deckId },
        select: { projectId: true, founderProfileId: true },
      }),
      db.founderProfileExtended.findUnique({ where: { userId } }),
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

  const currentProject = deck?.projectId
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
    2
  );
}

// ---------------------------------------------------------------------------
// Workspace data loader
// ---------------------------------------------------------------------------

const WORKSPACE_TAKE_MAX = 40;
const WORKSPACE_TAKE_DEFAULT = 20;

/**
 * loadPitchDeckWorkspaceData
 * --------------------------
 * Returns decks (with workspace relations), projects, and ventures for the
 * Pitch Deck workspace UI. Degrades gracefully when workspace tables are absent.
 */
export async function loadPitchDeckWorkspaceData(
  userId: string,
  isPremium: boolean,
  limit = WORKSPACE_TAKE_DEFAULT
) {
  const take = Math.min(Math.max(limit, 1), WORKSPACE_TAKE_MAX);

  const [projects, ventures] = await Promise.all([
    db.project.findMany({
      where: { ownerUserId: userId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.venture.findMany({
      where: { ownerUserId: userId },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  let decks: Array<Record<string, unknown>> = [];
  try {
    decks = await db.pitchDeck.findMany({
      where: { userId },
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
        sections: { orderBy: { sectionOrder: "asc" } },
        versions: { orderBy: { createdAt: "desc" }, take: 25 },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  } catch (error) {
    if (!isMissingWorkspaceTableError(error)) throw error;
    logger.warn({
      scope: "pitchdeck.workspace.load",
      message: "Workspace tables missing — falling back to report-only query.",
      data: { userId },
    });
    const fallback = await db.pitchDeck.findMany({
      where: { userId },
      include: {
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
    decks = fallback.map((d) => ({ ...d, sections: [], versions: [] }));
  }

  return { isPremium, decks, projects, ventures, now: new Date().toISOString() };
}

// ---------------------------------------------------------------------------
// Simple single-record helpers
// ---------------------------------------------------------------------------

/**
 * findLatestDeckForUser
 * ---------------------
 * Returns the most recent PitchDeck record (with its latest report) owned by userId.
 */
export async function findLatestDeckForUser(userId: string) {
  return db.pitchDeck.findFirst({
    where: { userId },
    include: { reports: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * listDecksForFounder
 * -------------------
 * Returns up to `limit` decks (clamped to 50) for the given userId.
 */
export async function listDecksForFounder(userId: string, limit = 12) {
  return db.pitchDeck.findMany({
    where: { userId },
    include: {
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
      project: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
  });
}
