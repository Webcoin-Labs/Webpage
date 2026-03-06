import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventVisibility } from "@prisma/client";
import { EventsHubClient } from "@/components/events/EventsHubClient";
import Link from "next/link";
import { Calendar, Video } from "lucide-react";

export const metadata = {
  title: "Events — Webcoin Labs",
  description: "Office hours, workshops, founder sessions, demo days.",
};

async function getEvents(sessionUserId: string, isAdmin: boolean) {
  const now = new Date();
  const where = isAdmin
    ? {}
    : {
        isPublished: true,
        OR: [
          { visibility: EventVisibility.PUBLIC },
          { visibility: EventVisibility.MEMBERS },
          {
            visibility: EventVisibility.INVITE_ONLY,
            rsvps: { some: { userId: sessionUserId } },
          },
        ],
      };

  const events = await prisma.event.findMany({
    where,
    include: {
      _count: { select: { rsvps: true } },
      rsvps: { where: { userId: sessionUserId }, select: { id: true } },
    },
    orderBy: { startAt: "asc" },
  });

  const thisWeekEnd = new Date(now);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
  const thisWeek = events.filter(
    (e) => e.startAt >= now && e.startAt <= thisWeekEnd
  );
  const featured = events.filter((e) => e.isFeatured && e.startAt >= now);
  const upcoming = events.filter((e) => e.startAt >= now);
  const past = events.filter((e) => e.endAt < now);

  return {
    thisWeek,
    featured: featured[0] ?? null,
    upcoming,
    past,
    all: events,
  };
}

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sign in to view events.</p>
      </div>
    );
  }

  const data = await getEvents(
    session.user.id,
    session.user.role === "ADMIN"
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Office hours, workshops, founder sessions, demo days
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://calendly.com/webcoinlabs/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 text-sm font-medium border border-cyan-500/30 transition-colors"
          >
            <Calendar className="w-4 h-4" /> Request Office Hours
          </a>
          <Link
            href="/app/apply?type=demo_day"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-violet-500/40 text-sm font-medium transition-colors"
          >
            <Video className="w-4 h-4" /> Submit a Demo Day Pitch
          </Link>
        </div>
      </div>

      <EventsHubClient
        thisWeek={data.thisWeek}
        featured={data.featured}
        upcoming={data.upcoming}
        past={data.past}
        userRsvpEventIds={data.all
          .filter((e) => Array.isArray(e.rsvps) && e.rsvps.length > 0)
          .map((e) => e.id)}
      />
    </div>
  );
}
