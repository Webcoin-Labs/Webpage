import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventsCalendarClient } from "@/components/events/EventsCalendarClient";

export const metadata = {
  title: "Calendar — Events | Webcoin Labs",
  description: "Events calendar view.",
};

export default async function EventsCalendarPage() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sign in to view the calendar.</p>
      </div>
    );
  }

  const events = await db.event.findMany({
    where: {
      isPublished: true,
      OR: [
        { visibility: "PUBLIC" },
        { visibility: "MEMBERS" },
        {
          visibility: "INVITE_ONLY",
          rsvps: { some: { userId: session.user.id } },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true,
      type: true,
      slug: true,
    },
    orderBy: { startAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/app/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
      <EventsCalendarClient events={events} />
    </div>
  );
}

