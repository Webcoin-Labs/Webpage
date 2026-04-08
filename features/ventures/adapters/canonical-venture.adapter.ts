import "server-only";

import { prisma } from "@/lib/prisma";
import type { CanonicalVenture } from "./types";

/**
 * fromVenture
 * -----------
 * Maps a Prisma `Venture` record to the CanonicalVenture read-model.
 */
type PrismaVenture = {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  website: string | null;
  githubUrl: string | null;
  twitter: string | null;
  linkedin: string | null;
  chainEcosystem: string | null;
  stage: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function fromVenture(v: PrismaVenture): CanonicalVenture {
  return {
    id: v.id,
    source: "venture",
    ventureId: v.id,
    name: v.name,
    tagline: v.tagline,
    description: v.description,
    slug: v.slug,
    stage: v.stage,
    chainEcosystem: v.chainEcosystem,
    website: v.website,
    githubUrl: v.githubUrl,
    twitter: v.twitter,
    linkedin: v.linkedin,
    isPublic: v.isPublic,
    ownerUserId: v.ownerUserId,
    pitchDeckProjectId: null,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

/**
 * fromProject
 * -----------
 * Maps a Prisma `Project` (legacy "startup") record to CanonicalVenture.
 * If the project has a canonicalVentureId, that ID is surfaced via `ventureId`
 * so callers can upgrade to the full Venture if needed.
 */
type PrismaProject = {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  chainFocus: string | null;
  stage: string;
  publicVisible: boolean;
  canonicalVentureId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function fromProject(p: PrismaProject): CanonicalVenture {
  return {
    id: p.canonicalVentureId ?? p.id,
    source: "project",
    ventureId: p.canonicalVentureId,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    slug: p.slug,
    stage: p.stage,
    chainEcosystem: p.chainFocus,
    website: p.websiteUrl,
    githubUrl: p.githubUrl,
    twitter: p.twitterUrl,
    linkedin: null,
    isPublic: p.publicVisible,
    ownerUserId: p.ownerUserId,
    pitchDeckProjectId: p.id,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// Convenience query helpers — used by the feed, discovery, and investor OS
// ---------------------------------------------------------------------------

const VENTURE_SELECT = {
  id: true,
  ownerUserId: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  website: true,
  githubUrl: true,
  twitter: true,
  linkedin: true,
  chainEcosystem: true,
  stage: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const;

const PROJECT_SELECT = {
  id: true,
  ownerUserId: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  websiteUrl: true,
  githubUrl: true,
  twitterUrl: true,
  chainFocus: true,
  stage: true,
  publicVisible: true,
  canonicalVentureId: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * getCanonicalVenturesForOwner
 * ----------------------------
 * Returns a merged, de-duplicated list of CanonicalVenture records for a
 * founder user. Ventures take precedence over Projects that share a
 * canonicalVentureId.
 */
export async function getCanonicalVenturesForOwner(
  ownerUserId: string
): Promise<CanonicalVenture[]> {
  const [ventures, projects] = await Promise.all([
    prisma.venture.findMany({
      where: { ownerUserId },
      select: VENTURE_SELECT,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { ownerUserId },
      select: PROJECT_SELECT,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const ventureIds = new Set(ventures.map((v) => v.id));
  const canonical: CanonicalVenture[] = ventures.map(fromVenture);

  // Only include Projects that have NOT already been promoted to a Venture
  for (const p of projects) {
    if (p.canonicalVentureId && ventureIds.has(p.canonicalVentureId)) continue;
    canonical.push(fromProject(p));
  }

  return canonical;
}

/**
 * getPublicCanonicalVentures
 * --------------------------
 * Returns all public Venture records suitable for the ecosystem feed and
 * discovery surfaces. Projects are excluded here — they remain legacy.
 */
export async function getPublicCanonicalVentures(opts?: {
  take?: number;
  chainEcosystem?: string;
  stage?: string;
}): Promise<CanonicalVenture[]> {
  const ventures = await prisma.venture.findMany({
    where: {
      isPublic: true,
      ...(opts?.chainEcosystem ? { chainEcosystem: opts.chainEcosystem } : {}),
      ...(opts?.stage ? { stage: opts.stage } : {}),
    },
    select: VENTURE_SELECT,
    orderBy: { updatedAt: "desc" },
    take: opts?.take ?? 50,
  });

  return ventures.map(fromVenture);
}

/**
 * getCanonicalVentureById
 * -----------------------
 * Resolves a single canonical venture by either its Venture.id or Project.id.
 * Returns null when not found or not accessible.
 */
export async function getCanonicalVentureById(
  id: string,
  opts?: { requirePublic?: boolean }
): Promise<CanonicalVenture | null> {
  // Try Venture first (the canonical source)
  const venture = await prisma.venture.findUnique({
    where: { id },
    select: VENTURE_SELECT,
  });

  if (venture) {
    if (opts?.requirePublic && !venture.isPublic) return null;
    return fromVenture(venture);
  }

  // Fallback: try Project (legacy)
  const project = await prisma.project.findUnique({
    where: { id },
    select: PROJECT_SELECT,
  });

  if (!project) return null;
  if (opts?.requirePublic && !project.publicVisible) return null;
  return fromProject(project);
}
