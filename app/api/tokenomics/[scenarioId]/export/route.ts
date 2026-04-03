import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { buildTokenomicsWorkbook } from "@/lib/tokenomics/sheet";

export async function GET(request: NextRequest, { params }: { params: Promise<{ scenarioId: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const { scenarioId } = await params;

  const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const scenario = await db.tokenomicsScenario.findUnique({
    where: { id: scenarioId },
    include: {
      model: { select: { ventureId: true } },
      allocations: { orderBy: { rowOrder: "asc" } },
    },
  });
  if (!scenario) return NextResponse.json({ success: false, error: "Scenario not found." }, { status: 404 });

  if (session.user.role === "FOUNDER") {
    const owner = await db.venture.findFirst({
      where: { id: scenario.model.ventureId, ownerUserId: session.user.id },
      select: { id: true },
    });
    if (!owner) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const workbook = await buildTokenomicsWorkbook(
    scenario.allocations.map((row) => ({
      label: row.label,
      percentage: row.percentage ? Number(row.percentage) : undefined,
      tokenAmount: row.tokenAmount ? Number(row.tokenAmount) : undefined,
      cliffMonths: row.cliffMonths ?? undefined,
      vestingMonths: row.vestingMonths ?? undefined,
      unlockCadence: row.unlockCadence ?? undefined,
      notes: row.notes ?? undefined,
    })),
    format,
  );

  return new NextResponse(workbook.buffer, {
    headers: {
      "content-type": workbook.mime,
      "content-disposition": `attachment; filename=\"${workbook.fileName}\"`,
      "cache-control": "no-store",
    },
  });
}
