"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAnyRole, requireSessionUser } from "@/server/policies/authz";
import {
  createAdminAssignment,
  createDiligenceMemo,
  overrideScoreSnapshot,
  recomputeBuilderProofSnapshot,
  recomputeFounderReadinessSnapshot,
  recomputeInvestorFitSnapshot,
  updateAdminAssignmentStatus,
} from "@/server/services/canonical-graph.service";

type ActionResult = { success: true; message?: string } | { success: false; error: string };

const assignmentSchema = z.object({
  type: z.enum(["BUILDER_TO_FOUNDER", "FOUNDER_TO_INVESTOR", "INVESTOR_TO_VENTURE_REVIEW", "PROFILE_REVIEW", "TRUST_REVIEW"]),
  founderUserId: z.string().optional().or(z.literal("")),
  builderUserId: z.string().optional().or(z.literal("")),
  investorUserId: z.string().optional().or(z.literal("")),
  ventureId: z.string().optional().or(z.literal("")),
  note: z.string().max(1500).optional().or(z.literal("")),
});

export async function createAdminAssignmentAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);
    const parsed = assignmentSchema.parse({
      type: String(formData.get("type") ?? ""),
      founderUserId: String(formData.get("founderUserId") ?? ""),
      builderUserId: String(formData.get("builderUserId") ?? ""),
      investorUserId: String(formData.get("investorUserId") ?? ""),
      ventureId: String(formData.get("ventureId") ?? ""),
      note: String(formData.get("note") ?? ""),
    });
    await createAdminAssignment({
      createdByAdminId: user.id,
      type: parsed.type,
      founderUserId: parsed.founderUserId || null,
      builderUserId: parsed.builderUserId || null,
      investorUserId: parsed.investorUserId || null,
      ventureId: parsed.ventureId || null,
      note: parsed.note || null,
    });
    revalidatePath("/app/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create assignment." };
  }
}

export async function updateAdminAssignmentStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);
    const assignmentId = String(formData.get("assignmentId") ?? "");
    const status = String(formData.get("status") ?? "") as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";
    await updateAdminAssignmentStatus({
      assignmentId,
      status,
      assigneeAdminId: user.id,
    });
    revalidatePath("/app/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update assignment." };
  }
}

export async function createDiligenceMemoAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    assertAnyRole(user, ["INVESTOR", "ADMIN"]);
    const ventureId = String(formData.get("ventureId") ?? "");
    const title = String(formData.get("title") ?? "");
    const summary = String(formData.get("summary") ?? "");
    await createDiligenceMemo({
      authorUserId: user.id,
      ventureId,
      title,
      summary: summary || null,
      sectionsJson: {
        product: String(formData.get("product") ?? ""),
        market: String(formData.get("market") ?? ""),
        team: String(formData.get("team") ?? ""),
        traction: String(formData.get("traction") ?? ""),
        risks: String(formData.get("risks") ?? ""),
      },
      riskFlagsJson: {
        legal: String(formData.get("riskLegal") ?? ""),
        security: String(formData.get("riskSecurity") ?? ""),
        governance: String(formData.get("riskGovernance") ?? ""),
      },
      isInternal: true,
    });
    revalidatePath("/app/investor-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to create diligence memo." };
  }
}

export async function overrideScoreSnapshotAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    assertAnyRole(user, ["ADMIN"]);
    const snapshotId = String(formData.get("snapshotId") ?? "");
    const status = String(formData.get("status") ?? "") as "ACTIVE" | "UNDER_REVIEW" | "OVERRIDDEN" | "ARCHIVED";
    const reason = String(formData.get("reason") ?? "");
    await overrideScoreSnapshot({
      snapshotId,
      adminUserId: user.id,
      status,
      reason: reason || null,
    });
    revalidatePath("/app/admin");
    revalidatePath("/app/founder-os");
    revalidatePath("/app/builder-os");
    revalidatePath("/app/investor-os");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to override score snapshot." };
  }
}

export async function recomputeMyScoresAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireSessionUser();
    const scope = String(formData.get("scope") ?? "auto");
    const ventureId = String(formData.get("ventureId") ?? "");

    if (scope === "founder") {
      assertAnyRole(user, ["FOUNDER", "ADMIN"]);
      await recomputeFounderReadinessSnapshot(user.id);
    } else if (scope === "builder") {
      assertAnyRole(user, ["BUILDER", "FOUNDER", "ADMIN"]);
      await recomputeBuilderProofSnapshot(user.id);
    } else {
      assertAnyRole(user, ["INVESTOR", "ADMIN"]);
      if (!ventureId) {
        return { success: false, error: "Venture is required for investor fit recompute." };
      }
      await recomputeInvestorFitSnapshot(user.id, ventureId);
    }

    revalidatePath("/app/founder-os");
    revalidatePath("/app/builder-os");
    revalidatePath("/app/investor-os");
    revalidatePath("/app/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to recompute scores." };
  }
}

