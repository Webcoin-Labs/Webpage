import "server-only";

import { discoveryService } from "@/server/services/discovery.service";
import type { CanonicalMatch } from "./types";

/**
 * findBuilderMatchesForFounder
 * ----------------------------
 * Wraps `discoveryService.findBuilderMatches` and returns a list of
 * `CanonicalMatch` records ready for the Founder OS discovery UI.
 *
 * The underlying service already handles scoring; this adapter only
 * normalises the shape so UI components are decoupled from the service API.
 */
export async function findBuilderMatchesForFounder(
  founderUserId: string,
  opts?: { take?: number }
): Promise<CanonicalMatch[]> {
  const raw = await discoveryService.findBuilderMatches(
    founderUserId,
    opts?.take ?? 10
  );

  return raw.map((r) => ({
    kind: "builder" as const,
    resourceId: r.userId,
    score: r.score,
    reasons: r.reasons,
    label: null,
  }));
}

/**
 * findVentureMatchesForInvestor
 * -----------------------------
 * Wraps `discoveryService.findVentureMatches` and returns a list of
 * `CanonicalMatch` records ready for the Investor OS deal-flow UI.
 */
export async function findVentureMatchesForInvestor(
  investorUserId: string,
  opts?: { take?: number }
): Promise<CanonicalMatch[]> {
  const raw = await discoveryService.findVentureMatches(
    investorUserId,
    opts?.take ?? 10
  );

  return raw.map((r) => ({
    kind: "venture" as const,
    resourceId: r.ventureId,
    score: r.score,
    reasons: r.reasons,
    label: null,
  }));
}
