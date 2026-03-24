import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/server/db/client";
import { validateTokenomicsRows } from "@/lib/tokenomics/validation";

function isAuthorized(request: Request) {
  const expected = process.env.INTERNAL_JOBS_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("x-webcoinlabs-job-secret");
  if (!provided) return false;
  const eb = Buffer.from(expected, "utf-8");
  const pb = Buffer.from(provided, "utf-8");
  if (eb.length !== pb.length) return false;
  try {
    return timingSafeEqual(eb, pb);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const queued = await db.tokenomicsUpload.findMany({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    take: 25,
  });
  let processed = 0;
  for (const upload of queued) {
    await db.tokenomicsUpload.update({ where: { id: upload.id }, data: { status: "PROCESSING" } });
    try {
      const payload = upload.payloadJson as { scenarioId?: string; rows?: Array<{ label: string; percentage?: number; tokenAmount?: number; cliffMonths?: number; vestingMonths?: number; unlockCadence?: string; notes?: string }> } | null;
      if (!payload?.scenarioId || !payload.rows?.length) {
        await db.tokenomicsUpload.update({ where: { id: upload.id }, data: { status: "FAILED", errorMessage: "Missing queued row payload." } });
        continue;
      }
      const validation = validateTokenomicsRows(payload.rows);
      if (!validation.valid) {
        await db.tokenomicsUpload.update({
          where: { id: upload.id },
          data: { status: "FAILED", errorMessage: validation.issues[0] ?? "Invalid tokenomics rows." },
        });
        continue;
      }
      const scenario = await db.tokenomicsScenario.findUnique({ where: { id: payload.scenarioId }, select: { id: true } });
      if (!scenario) {
        await db.tokenomicsUpload.update({ where: { id: upload.id }, data: { status: "FAILED", errorMessage: "Scenario not found." } });
        continue;
      }
      await db.$transaction([
        db.tokenomicsAllocationRow.deleteMany({ where: { scenarioId: payload.scenarioId } }),
        ...payload.rows.map((row, idx) =>
          db.tokenomicsAllocationRow.create({
            data: {
              scenarioId: payload.scenarioId as string,
              label: row.label,
              percentage: row.percentage ?? null,
              tokenAmount: row.tokenAmount ?? null,
              cliffMonths: row.cliffMonths ?? null,
              vestingMonths: row.vestingMonths ?? null,
              unlockCadence: row.unlockCadence ?? null,
              notes: row.notes ?? null,
              rowOrder: idx,
            },
          }),
        ),
      ]);
      const last = await db.tokenomicsScenarioRevision.findFirst({
        where: { scenarioId: payload.scenarioId },
        orderBy: { revisionNumber: "desc" },
        select: { revisionNumber: true },
      });
      await db.tokenomicsScenarioRevision.create({
        data: {
          scenarioId: payload.scenarioId,
          createdById: upload.uploadedById,
          revisionNumber: (last?.revisionNumber ?? 0) + 1,
          reason: "queued_import_worker",
          snapshotJson: { rows: payload.rows },
        },
      });
      await db.tokenomicsUpload.update({ where: { id: upload.id }, data: { status: "COMPLETED" } });
      processed += 1;
    } catch (error) {
      await db.tokenomicsUpload.update({
        where: { id: upload.id },
        data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Import failed." },
      });
    }
  }
  return NextResponse.json({ success: true, processed });
}
