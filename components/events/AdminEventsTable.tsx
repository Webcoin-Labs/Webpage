"use client";

import Link from "next/link";
import { Pencil, Copy, Trash2, Users, Download } from "lucide-react";
import { EVENT_TYPE_LABELS } from "@/lib/events";
import { formatEventDateShort } from "@/lib/events";
import type { Event, EventType } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEvent, deleteEvent } from "@/app/actions/events";

type EventWithCount = Event & { _count: { rsvps: number } };

export function AdminEventsTable({
  events,
}: {
  events: EventWithCount[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDuplicate(event: EventWithCount) {
    // Navigate to new form with query params or use a duplicate action
    router.push(
      `/app/admin/events/new?duplicate=${event.id}`
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    setDeletingId(id);
    try {
      await deleteEvent(id);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (events.length === 0) {
    return (
      <div className="py-12 rounded-xl border border-dashed border-border/50 text-center text-muted-foreground">
        No events yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Start</th>
              <th className="text-left p-3 font-medium">Published</th>
              <th className="text-left p-3 font-medium">Featured</th>
              <th className="text-left p-3 font-medium">RSVPs</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-b border-border/30 hover:bg-muted/20"
              >
                <td className="p-3">
                  <Link
                    href={`/app/admin/events/${event.id}`}
                    className="font-medium hover:text-cyan-400"
                  >
                    {event.title}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">
                  {EVENT_TYPE_LABELS[event.type as EventType]}
                </td>
                <td className="p-3 text-muted-foreground">
                  {formatEventDateShort(new Date(event.startAt))}
                </td>
                <td className="p-3">
                  {event.isPublished ? (
                    <span className="text-green-500">Yes</span>
                  ) : (
                    <span className="text-amber-500">Draft</span>
                  )}
                </td>
                <td className="p-3">
                  {event.isFeatured ? (
                    <span className="text-cyan-400">Yes</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">{event._count.rsvps}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/app/admin/events/${event.id}`}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(event)}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/app/admin/events/${event.id}#attendees`}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Attendees"
                    >
                      <Users className="w-4 h-4" />
                    </Link>
                    <a
                      href={`/api/admin/events/${event.id}/export-rsvps`}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      title="Export CSV"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
