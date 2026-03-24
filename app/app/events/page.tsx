import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarClock, Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";

export const metadata = {
  title: "Events - Webcoin Labs",
  description: "Role-aware events and scheduling workspace",
};

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [upcomingEvents, myRsvps] = await Promise.all([
    db.event.findMany({
      where: {
        startAt: { gte: new Date() },
        isPublished: true,
      },
      orderBy: { startAt: "asc" },
      take: 20,
      include: {
        _count: { select: { rsvps: true } },
      },
    }),
    db.eventRsvp.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        event: { select: { id: true, title: true, startAt: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6 py-8">
      <section className="rounded-2xl border border-border/60 bg-card p-6">
        <h1 className="text-2xl font-semibold">Events</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upcoming network events, role-specific sessions, and your RSVP timeline.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-cyan-300" />
            Upcoming Events
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming published events right now.</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="rounded-md border border-border/60 p-3">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startAt).toLocaleString()} | {event.format} | {event.visibility}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {event._count.rsvps} RSVP
                  </p>
                  <div className="mt-2">
                    <Link href={`/app/events/${event.id}`} className="text-xs text-cyan-300 hover:text-cyan-200">
                      Open event
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-cyan-300" />
            My RSVPs
          </div>
          {myRsvps.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not RSVP’d to any events yet.</p>
          ) : (
            <div className="space-y-2">
              {myRsvps.map((rsvp) => (
                <div key={rsvp.id} className="rounded-md border border-border/60 p-2 text-xs text-muted-foreground">
                  {rsvp.event.title} | {rsvp.status} | {new Date(rsvp.event.startAt).toLocaleString()}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

