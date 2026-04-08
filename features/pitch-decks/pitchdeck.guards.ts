import "server-only";

import { db } from "@/server/db/client";
import { SubscriptionTier } from "@prisma/client";

/**
 * pitchdeck.guards.ts
 * -------------------
 * All auth, role, and ownership guard functions extracted from
 * `app/actions/pitchdeck.ts` into a pure, testable domain module.
 *
 * These are NOT Server Actions — they are plain async functions called by
 * the Server Actions in `app/actions/pitchdeck.ts` (which remain
 * as the public entry-point for the Next.js `"use server"` boundary).
 */

export type PitchActor = {
  id: string;
  role: string;
};

/**
 * hasPremiumPitchDeckAccess
 * -------------------------
 * Checks whether a user has an ACTIVE PREMIUM subscription.
 * ADMINs bypass the check and are always granted access.
 */
export async function hasPremiumPitchDeckAccess(
  userId: string,
  role: string
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const subscription = await db.premiumSubscription.findUnique({
    where: { userId },
    select: { tier: true, status: true },
  });
  return (
    subscription?.tier === SubscriptionTier.PREMIUM &&
    subscription.status === "ACTIVE"
  );
}
