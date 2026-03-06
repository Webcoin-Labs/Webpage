"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Video, MapPin } from "lucide-react";
import {
  EVENT_TYPE_LABELS,
  EVENT_TRACK_LABELS,
  formatEventDateShort,
} from "@/lib/events";
import type { EventType, EventTrack, EventFormat } from "@prisma/client";
import type { Event } from "@prisma/client";

type EventWithCount = Event & {
  _count?: { rsvps: number };
  rsvps?: { id: string }[];
};

export function EventCard({
  event,
  variant = "default",
  hasRsvp,
}: {
  event: EventWithCount;
  variant?: "default" | "featured" | "compact";
  hasRsvp?: boolean;
}) {
  const typeLabel = EVENT_TYPE_LABELS[event.type as EventType];
  const trackLabel = event.track
    ? EVENT_TRACK_LABELS[event.track as EventTrack]
    : null;
  const rsvpCount = event._count?.rsvps ?? 0;

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl border border-border/50 bg-card/80 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all ${
        variant === "featured"
          ? "p-6 md:p-8"
          : variant === "compact"
            ? "p-4"
            : "p-5"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
            {typeLabel}
          </span>
          {trackLabel && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {trackLabel}
            </span>
          )}
          {hasRsvp && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
              RSVPed
            </span>
          )}
        </div>
        <h3
          className={`font-semibold text-foreground mb-1 ${
            variant === "featured" ? "text-xl" : "text-base"
          }`}
        >
          {event.title}
        </h3>
        {event.summary && variant !== "compact" && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
            {event.summary}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-auto">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatEventDateShort(new Date(event.startAt))}
          </span>
          {event.format === "IN_PERSON" && event.locationText && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.locationText}
            </span>
          )}
          {event.format !== "IN_PERSON" && event.meetingUrl && (
            <span className="flex items-center gap-1 text-cyan-400">
              <Video className="w-3.5 h-3.5" /> Online
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          {rsvpCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {rsvpCount} going
            </span>
          )}
          <span className="text-xs font-medium text-cyan-400 ml-auto">
            {hasRsvp ? "View →" : "RSVP →"}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <Link href={`/app/events/${event.id}`} className="block h-full">
      {card}
    </Link>
  );
}
