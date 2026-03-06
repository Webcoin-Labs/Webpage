"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatEventDateShort } from "@/lib/events";
import { EVENT_TYPE_LABELS } from "@/lib/events";
import type { EventType } from "@prisma/client";

type CalEvent = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  type: EventType;
  slug: string;
};

export function EventsCalendarClient({
  events: rawEvents,
}: {
  events: { id: string; title: string; startAt: Date; endAt: Date; type: EventType; slug: string }[];
}) {
  const events: CalEvent[] = rawEvents.map((e) => ({
    ...e,
    startAt: new Date(e.startAt),
    endAt: new Date(e.endAt),
  }));

  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { days, startDay } = useMemo(() => {
    const y = viewMonth.year;
    const m = viewMonth.month;
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startDay = first.getDay();
    const numDays = last.getDate();
    const days: { date: Date; day: number; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < startDay; i++) {
      const d = new Date(y, m, -startDay + i + 1);
      days.push({ date: d, day: d.getDate(), isCurrentMonth: false });
    }
    for (let i = 1; i <= numDays; i++) {
      const d = new Date(y, m, i);
      days.push({ date: d, day: i, isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(y, m + 1, i);
      days.push({ date: d, day: i, isCurrentMonth: false });
    }
    return { days, startDay };
  }, [viewMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    events.forEach((e) => {
      const key = e.startAt.toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleString(
    "default",
    { month: "long", year: "numeric" }
  );

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <button
          type="button"
          onClick={() =>
            setViewMonth((prev) =>
              prev.month === 0
                ? { year: prev.year - 1, month: 11 }
                : { year: prev.year, month: prev.month - 1 }
            )
          }
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">{monthLabel}</span>
        <button
          type="button"
          onClick={() =>
            setViewMonth((prev) =>
              prev.month === 11
                ? { year: prev.year + 1, month: 0 }
                : { year: prev.year, month: prev.month + 1 }
            )
          }
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-xs font-medium text-muted-foreground border-b border-border/50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="p-2 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr min-h-[400px]">
        {days.map((cell, i) => {
          const key = cell.date.toISOString().slice(0, 10);
          const dayEvents = eventsByDay[key] ?? [];
          return (
            <div
              key={i}
              className={`min-h-[80px] p-2 border-b border-r border-border/30 ${
                !cell.isCurrentMonth ? "bg-muted/30 text-muted-foreground" : ""
              }`}
            >
              <div className="text-sm font-medium mb-1">{cell.day}</div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <Link
                    key={e.id}
                    href={`/app/events/${e.id}`}
                    className="block text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 truncate hover:bg-cyan-500/25"
                  >
                    {e.title}
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          {events.length} event(s) this month. Click a day or event to open.
        </p>
      </div>
    </div>
  );
}
