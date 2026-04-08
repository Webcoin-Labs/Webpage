/**
 * CanonicalVenture — the unified read-model returned by the adapter layer.
 *
 * Consumers (ecosystem feed, discovery, public profiles, investor OS) should
 * always work with this shape regardless of whether the underlying record is
 * a `Venture` or a legacy `Project` (which carries a `canonicalVentureId` FK).
 *
 * NO schema changes. NO Prisma migrations. Adapter only.
 */
export type CanonicalVentureSource = "venture" | "project";

export type CanonicalVentureStage =
  | "IDEA"
  | "MVP"
  | "EARLY"
  | "GROWTH"
  | "LIVE"
  | string; // allow pass-through for future stages

export interface CanonicalVenture {
  /** Always the Venture.id if a Venture record exists; Project.id otherwise. */
  id: string;

  /** The source table this record was hydrated from. */
  source: CanonicalVentureSource;

  /**
   * If source === "project" and canonicalVentureId is set, this is populated.
   * Consumers can use this to upgrade to the full Venture record if needed.
   */
  ventureId: string | null;

  name: string;
  tagline: string | null;
  description: string | null;

  /** Slug for URL construction. May be null for older records. */
  slug: string | null;

  stage: CanonicalVentureStage | null;
  chainEcosystem: string | null;

  website: string | null;
  githubUrl: string | null;
  twitter: string | null;
  linkedin: string | null;

  /** Whether this venture is public / visible to authenticated users */
  isPublic: boolean;

  /** The user who owns this venture/project */
  ownerUserId: string;

  /** Linked pitch deck id, if any (only populated from Project) */
  pitchDeckProjectId: string | null;

  createdAt: Date;
  updatedAt: Date;
}
