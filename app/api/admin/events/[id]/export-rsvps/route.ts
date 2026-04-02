import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    select: { title: true, slug: true },
  });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const rsvps = await db.eventRsvp.findMany({
    where: { eventId: id },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const header = "Name,Email,Status,Checked In At,Created At\n";
  const rows = rsvps.map(
    (r) =>
      `"${(r.user.name ?? "").replace(/"/g, '""')}","${(r.user.email ?? "").replace(/"/g, '""')}",${r.status},${r.checkedInAt ? r.checkedInAt.toISOString() : ""},${r.createdAt.toISOString()}`
  );
  const csv = header + rows.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-attendees.csv"`,
    },
  });
}
