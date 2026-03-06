import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { formatEventDate } from "@/lib/events";

export const metadata = {
  title: "My RSVPs — Events | Webcoin Labs",
  description: "Events you've RSVPed to.",
};

export default async function MyEventsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sign in to view your events.</p>
      </div>
    );
  }

  const rsvps = await prisma.eventRsvp.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["GOING", "INTERESTED"] },
    },
    include: {
      event: {
        include: {
          _count: { select: { rsvps: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const upcoming = rsvps.filter((r) => new Date(r.event.startAt) >= now);
  const past = rsvps.filter((r) => new Date(r.event.endAt) < now);

  return (
    <div className="space-y-8">
      <Link
        href="/app/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">My RSVPs</h1>

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Upcoming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((r) => (
              <EventCard
                key={r.id}
                event={{
                  ...r.event,
                  _count: r.event._count,
                  rsvps: [{ id: r.id }],
                }}
                hasRsvp
              />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Past</h2>
          <ul className="space-y-2">
            {past.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/app/events/${r.event.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/50 hover:border-cyan-500/20 transition-colors"
                >
                  <span className="font-medium text-sm">{r.event.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatEventDate(new Date(r.event.endAt))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rsvps.length === 0 && (
        <div className="py-16 rounded-xl border border-dashed border-border/50 text-center text-muted-foreground">
          <p className="mb-4">You haven&apos;t RSVPed to any events yet.</p>
          <Link
            href="/app/events"
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            Browse events →
          </Link>
        </div>
      )}
    </div>
  );
}
