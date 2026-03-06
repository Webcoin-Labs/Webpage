"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ChevronRight } from "lucide-react";
import { EventCard } from "./EventCard";
import {
  EVENT_TYPE_LABELS,
  EVENT_TRACK_LABELS,
  EVENT_FORMAT_LABELS,
  formatEventDate,
} from "@/lib/events";
import type { EventType, EventTrack, EventFormat } from "@prisma/client";
import type { Event } from "@prisma/client";

type EventWithMeta = Event & {
  _count?: { rsvps: number };
  rsvps?: { id: string }[];
};

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[];
const TRACKS = Object.keys(EVENT_TRACK_LABELS) as EventTrack[];
const FORMATS = Object.keys(EVENT_FORMAT_LABELS) as EventFormat[];

export function EventsHubClient({
  thisWeek,
  featured,
  upcoming,
  past,
  userRsvpEventIds,
}: {
  thisWeek: EventWithMeta[];
  featured: EventWithMeta | null;
  upcoming: EventWithMeta[];
  past: EventWithMeta[];
  userRsvpEventIds: string[];
}) {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [trackFilter, setTrackFilter] = useState<string>("");
  const [formatFilter, setFormatFilter] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<string>("");

  const filteredUpcoming = useMemo(() => {
    return upcoming.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false;
      if (trackFilter && e.track !== trackFilter) return false;
      if (formatFilter && e.format !== formatFilter) return false;
      if (timeFilter) {
        const now = new Date();
        const start = new Date(e.startAt);
        if (timeFilter === "today") {
          if (start.toDateString() !== now.toDateString()) return false;
        } else if (timeFilter === "week") {
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() + 7);
          if (start < now || start > weekEnd) return false;
        } else if (timeFilter === "month") {
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          if (start > monthEnd) return false;
        }
      }
      return true;
    });
  }, [upcoming, typeFilter, trackFilter, formatFilter, timeFilter]);

  const filteredPast = useMemo(() => {
    return past.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false;
      if (trackFilter && e.track !== trackFilter) return false;
      return true;
    });
  }, [past, typeFilter, trackFilter]);

  return (
    <div className="space-y-10">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-wrap gap-2 items-center"
      >
        <span className="text-xs font-medium text-muted-foreground mr-2">
          Type:
        </span>
        {EVENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              typeFilter === t
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {EVENT_TYPE_LABELS[t]}
          </button>
        ))}
        <span className="text-xs font-medium text-muted-foreground ml-4 mr-2">
          Track:
        </span>
        {TRACKS.map((t) => (
          <button
            key={t}
            onClick={() => setTrackFilter(trackFilter === t ? "" : t)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              trackFilter === t
                ? "bg-violet-500/20 text-violet-400 border-violet-500/40"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {EVENT_TRACK_LABELS[t]}
          </button>
        ))}
        <span className="text-xs font-medium text-muted-foreground ml-4 mr-2">
          Format:
        </span>
        {FORMATS.map((f) => (
          <button
            key={f}
            onClick={() => setFormatFilter(formatFilter === f ? "" : f)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              formatFilter === f
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {EVENT_FORMAT_LABELS[f]}
          </button>
        ))}
        <span className="text-xs font-medium text-muted-foreground ml-4 mr-2">
          Time:
        </span>
        {["today", "week", "month"].map((t) => (
          <button
            key={t}
            onClick={() => setTimeFilter(timeFilter === t ? "" : t)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              timeFilter === t
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "today" ? "Today" : t === "week" ? "This week" : "This month"}
          </button>
        ))}
      </motion.div>

      {/* This Week - horizontal scroll */}
      {thisWeek.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">This week</h2>
          <div className="overflow-x-auto pb-2 -mx-1">
            <div className="flex gap-4 min-w-max">
              {thisWeek.map((event) => (
                <div key={event.id} className="w-72 flex-shrink-0">
                  <EventCard
                    event={event}
                    variant="default"
                    hasRsvp={userRsvpEventIds.includes(event.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Featured</h2>
          <div className="max-w-2xl">
            <EventCard
              event={featured}
              variant="featured"
              hasRsvp={userRsvpEventIds.includes(featured.id)}
            />
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming</h2>
          <Link
            href="/app/events/calendar"
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" /> Calendar
          </Link>
        </div>
        {filteredUpcoming.length === 0 ? (
          <div className="py-12 rounded-xl border border-dashed border-border/50 text-center text-sm text-muted-foreground">
            No upcoming events match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUpcoming.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                hasRsvp={userRsvpEventIds.includes(event.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Calendar preview - mini month */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Calendar preview
          </h2>
          <Link
            href="/app/events/calendar"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View full calendar <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4 flex flex-wrap gap-2">
          {upcoming.slice(0, 5).map((e) => (
            <Link
              key={e.id}
              href={`/app/events/${e.id}`}
              className="text-xs px-2 py-1 rounded-lg bg-muted/80 hover:bg-cyan-500/10 text-foreground hover:text-cyan-400 transition-colors"
            >
              {formatEventDate(new Date(e.startAt))} — {e.title}
            </Link>
          ))}
          {upcoming.length === 0 && (
            <p className="text-xs text-muted-foreground">No upcoming events.</p>
          )}
        </div>
      </section>

      {/* Past & Replays */}
      {filteredPast.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Past &amp; replays</h2>
          <div className="space-y-3">
            {filteredPast.slice(0, 10).map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Link
                  href={`/app/events/${event.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl border border-border/50 bg-card/50 hover:border-cyan-500/20 hover:bg-card transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(new Date(event.endAt))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(event.recordingUrl || event.notesUrl) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">
                        Replay
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Mine link */}
      <div className="pt-4">
        <Link
          href="/app/events/mine"
          className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
        >
          View my RSVPs →
        </Link>
      </div>
    </div>
  );
}
