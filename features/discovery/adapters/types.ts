/**
 * CanonicalMatch — the unified read-model for discovery results.
 *
 * Both `findBuilderMatches` (founder → builder) and `findVentureMatches`
 * (investor → venture) return heterogeneous shapes from the underlying
 * discovery service. This adapter normalises them for UI consumers.
 */

export type CanonicalMatchKind = "builder" | "venture";

export interface CanonicalMatch {
  /** The kind determines which profile page to link to */
  kind: CanonicalMatchKind;

  /**
   * For kind === "builder": the matched builder's userId
   * For kind === "venture": the matched ventureId
   */
  resourceId: string;

  /** 0–100 relevance score from the discovery service */
  score: number;

  /**
   * Human-readable reasons explaining the match score.
   * Displayed as highlight chips in the discovery UI.
   */
  reasons: string[];

  /**
   * Optional: label derived from the resource (populated by the adapter
   * after a follow-up lookup). Null when using a lightweight match result.
   */
  label: string | null;
}
