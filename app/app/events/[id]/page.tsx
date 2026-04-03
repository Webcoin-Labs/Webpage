import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Video, MapPin, Users, FileText } from "lucide-react";
import {
  EVENT_TYPE_LABELS,
  EVENT_TRACK_LABELS,
  EVENT_FORMAT_LABELS,
  formatEventDate,
} from "@/lib/events";
import type { EventType, EventTrack, EventFormat } from "@prisma/client";
import { EventDetailClient } from "@/components/events/EventDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await db.event.findUnique({
    where: { id },
    select: { title: true, summary: true },
  });
  if (!event) return { title: "Event" };
  return {
    title: `${event.title} — Events`,
    description: event.summary ?? undefined,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  const { id } = await params;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      _count: { select: { rsvps: true } },
      rsvps: session?.user?.id
        ? { where: { userId: session.user.id }, take: 1 }
        : { take: 0 },
    },
  });

  if (!event) notFound();
  if (!event.isPublished && session?.user?.role !== "ADMIN") notFound();

  const visibilityOk =
    event.visibility === "PUBLIC" ||
    (event.visibility === "MEMBERS" && session?.user?.id) ||
    (event.visibility === "INVITE_ONLY" &&
      (session?.user?.role === "ADMIN" ||
        (event.rsvps && Array.isArray(event.rsvps) && event.rsvps.length > 0)));
  if (!visibilityOk) notFound();

  const hasRsvp = Array.isArray(event.rsvps) && event.rsvps.length > 0;
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const now = new Date();
  const withinTenMin = start.getTime() - now.getTime() <= 10 * 60 * 1000 && end.getTime() > now.getTime();
  const canJoin = (withinTenMin || session?.user?.role === "ADMIN") && event.meetingUrl;

  return (
    <div className="space-y-8">
      <Link
        href="/app/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      <div className="rounded-2xl border border-border/50 bg-card/80 overflow-hidden">
        {event.coverImageUrl && (
          <div className="aspect-video bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
              {EVENT_TYPE_LABELS[event.type as EventType]}
            </span>
            {event.track && (
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                {EVENT_TRACK_LABELS[event.track as EventTrack]}
              </span>
            )}
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {EVENT_FORMAT_LABELS[event.format as EventFormat]}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatEventDate(start)} – {formatEventDate(end)}
            </span>
            {event.locationText && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.locationText}
              </span>
            )}
            {event.meetingUrl && event.format !== "IN_PERSON" && (
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Video className="w-4 h-4" /> Online
              </span>
            )}
            {event._count && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {event._count.rsvps} going
              </span>
            )}
          </div>

          <EventDetailClient
            eventId={event.id}
            hasRsvp={hasRsvp}
            canJoin={!!canJoin}
            meetingUrl={event.meetingUrl}
            icalUrl={`/app/events/${event.id}/ical`}
          />
        </div>
      </div>

      {event.summary && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6">
          <h2 className="text-sm font-semibold mb-2">Summary</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {event.summary}
          </p>
        </div>
      )}

      {event.description && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6">
          <h2 className="text-sm font-semibold mb-2">Agenda</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <pre className="whitespace-pre-wrap font-sans text-sm">
              {event.description}
            </pre>
          </div>
        </div>
      )}

      {(event.recordingUrl || event.notesUrl) && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6">
          <h2 className="text-sm font-semibold mb-3">Recording &amp; notes</h2>
          <div className="flex flex-wrap gap-3">
            {event.recordingUrl && (
              <a
                href={event.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 text-sm font-medium border border-cyan-500/30"
              >
                <Video className="w-4 h-4" /> Watch replay
              </a>
            )}
            {event.notesUrl && (
              <a
                href={event.notesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-cyan-500/30 text-sm font-medium"
              >
                <FileText className="w-4 h-4" /> Notes
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
