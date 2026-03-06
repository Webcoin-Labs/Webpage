import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateIcs } from "@/lib/ical";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const event = await prisma.event.findFirst({
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
