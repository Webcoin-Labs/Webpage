"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download } from "lucide-react";
import { checkInAttendee } from "@/app/actions/events";

type Rsvp = {
  id: string;
  status: string;
  checkedInAt: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
};

export function AdminEventAttendees({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/events/${eventId}/rsvps`)
      .then((r) => r.json())
      .then((data) => {
        setRsvps(data.rsvps ?? []);
      })
      .catch(() => setRsvps([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleCheckIn(rsvpId: string) {
    await checkInAttendee(rsvpId);
    router.refresh();
    setRsvps((prev) =>
      prev.map((r) =>
        r.id === rsvpId
          ? { ...r, checkedInAt: new Date().toISOString() }
          : r
      )
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading attendees...</p>;
  }
  if (rsvps.length === 0) {
    return (
      <div className="py-8 rounded-xl border border-dashed border-border/50 text-center text-sm text-muted-foreground">
        No RSVPs yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <span className="text-sm font-medium">RSVP list</span>
        <a
          href={`/api/admin/events/${eventId}/export-rsvps`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </a>
      </div>
      <ul className="divide-y divide-border/50">
        {rsvps.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between p-3 hover:bg-muted/20"
          >
            <div>
              <p className="text-sm font-medium">
                {r.user.name || r.user.email || "—"}
              </p>
              <p className="text-xs text-muted-foreground">{r.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {r.checkedInAt ? (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Checked in
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCheckIn(r.id)}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Check in
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
