"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Video, Bell } from "lucide-react";
import { rsvpEvent, cancelRsvp, setEventReminder } from "@/app/actions/events";
import type { RsvpStatus } from "@prisma/client";

export function EventDetailClient({
  eventId,
  hasRsvp,
  canJoin,
  meetingUrl,
  icalUrl,
}: {
  eventId: string;
  hasRsvp: boolean;
  canJoin: boolean;
  meetingUrl: string | null;
  icalUrl: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [reminderSet, setReminderSet] = useState(false);

  async function handleRsvp(status: RsvpStatus) {
    setLoading("rsvp");
    try {
      await rsvpEvent(eventId, status);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleCancelRsvp() {
    setLoading("cancel");
    try {
      await cancelRsvp(eventId);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleReminder() {
    setLoading("reminder");
    try {
      const start = new Date(); // would come from event in real impl
      const remindAt = new Date(start);
      remindAt.setHours(remindAt.getHours() - 24);
      await setEventReminder(eventId, remindAt);
      setReminderSet(true);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {canJoin && meetingUrl && (
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-semibold text-sm border border-cyan-500/40 transition-colors"
        >
          <Video className="w-4 h-4" /> Join
        </a>
      )}
      {!hasRsvp && (
        <button
          onClick={() => handleRsvp("GOING")}
          disabled={!!loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {loading === "rsvp" ? "..." : "RSVP"}
        </button>
      )}
      {hasRsvp && (
        <button
          onClick={handleCancelRsvp}
          disabled={!!loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/40 hover:bg-amber-500/10 text-amber-400 text-sm font-medium disabled:opacity-60"
        >
          {loading === "cancel" ? "..." : "Cancel RSVP"}
        </button>
      )}
      <a
        href={icalUrl}
        download
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:border-cyan-500/40 text-sm font-medium transition-colors"
      >
        <Calendar className="w-4 h-4" /> Add to Calendar
      </a>
      {!reminderSet && (
        <button
          onClick={handleReminder}
          disabled={!!loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border hover:border-violet-500/40 text-sm font-medium disabled:opacity-60 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {loading === "reminder" ? "..." : "Remind me (24h before)"}
        </button>
      )}
    </div>
  );
}
