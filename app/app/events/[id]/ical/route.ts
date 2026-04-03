import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { generateIcs } from "@/lib/ical";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, isPublished: true },
  });
  if (!event) {
    return new NextResponse("Not found", { status: 404 });
  }
  const ics = generateIcs({
    title: event.title,
    description: event.description ?? event.summary,
    startAt: event.startAt,
    endAt: event.endAt,
    location: event.locationText ?? event.meetingUrl,
    url: event.meetingUrl ?? undefined,
  });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
