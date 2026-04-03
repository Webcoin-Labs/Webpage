"use server";

import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EventType, EventTrack, EventFormat, MeetingProvider, EventVisibility, RsvpStatus } from "@prisma/client";
import { rateLimitAsync, rateLimitKey } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { dispatchEventReminder } from "@/lib/notifications/eventReminders";

const eventSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["OFFICE_HOURS", "WORKSHOP", "FOUNDER_TALK", "DEMO_DAY", "COMMUNITY_MEETUP", "AMA", "PARTNER_SESSION"]),
  track: z.enum(["STABLECOINS", "FINTECH", "INFRA", "GTM_DISTRIBUTION", "SECURITY", "LEGAL_COMPLIANCE"]).optional().nullable(),
  format: z.enum(["ONLINE", "IN_PERSON", "HYBRID"]),
  visibility: z.enum(["PUBLIC", "MEMBERS", "INVITE_ONLY"]).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  timezone: z.string().optional(),
  locationText: z.string().optional().nullable(),
  meetingUrl: z.string().url().optional().nullable().or(z.literal("")),
  meetingProvider: z.enum(["CALENDLY", "GOOGLE_MEET", "ZOOM", "OTHER"]).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal("")),
  capacity: z.coerce.number().int().min(0).optional().nullable(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  requiresApplication: z.boolean().optional(),
  recordingUrl: z.string().url().optional().nullable().or(z.literal("")),
  notesUrl: z.string().url().optional().nullable().or(z.literal("")),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "event";
}

export async function createEvent(formData: FormData) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "admin-event-create"), 30, 60_000);
  if (!rl.ok) throw new Error("Too many event changes. Please wait a minute and try again.");

  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse({
    ...raw,
    startAt: raw.startAt,
    endAt: raw.endAt,
    isPublished: raw.isPublished === "on" || raw.isPublished === "true",
    isFeatured: raw.isFeatured === "on" || raw.isFeatured === "true",
    requiresApplication: raw.requiresApplication === "on" || raw.requiresApplication === "true",
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");

  const data = parsed.data;
  let slug = slugify(data.title);
  let n = 0;
  while (await db.event.findUnique({ where: { slug } })) {
    slug = `${slugify(data.title)}-${++n}`;
  }

  await db.event.create({
    data: {
      slug,
      title: data.title,
      summary: data.summary ?? null,
      description: data.description ?? null,
      type: data.type as EventType,
      track: (data.track as EventTrack) ?? null,
      format: data.format as EventFormat,
      visibility: (data.visibility as EventVisibility) ?? "PUBLIC",
      startAt: data.startAt,
      endAt: data.endAt,
      timezone: data.timezone ?? "UTC",
      locationText: data.locationText ?? null,
      meetingUrl: data.meetingUrl || null,
      meetingProvider: (data.meetingProvider as MeetingProvider) ?? null,
      coverImageUrl: data.coverImageUrl || null,
      capacity: data.capacity ?? null,
      isPublished: data.isPublished ?? false,
      isFeatured: data.isFeatured ?? false,
      requiresApplication: data.requiresApplication ?? false,
      recordingUrl: data.recordingUrl || null,
      notesUrl: data.notesUrl || null,
    },
  });
  revalidatePath("/app/events");
  revalidatePath("/app/admin/events");
}

export async function updateEvent(id: string, formData: FormData) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "admin-event-update"), 60, 60_000);
  if (!rl.ok) throw new Error("Too many event changes. Please wait a minute and try again.");

  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse({
    ...raw,
    startAt: raw.startAt,
    endAt: raw.endAt,
    isPublished: raw.isPublished === "on" || raw.isPublished === "true",
    isFeatured: raw.isFeatured === "on" || raw.isFeatured === "true",
    requiresApplication: raw.requiresApplication === "on" || raw.requiresApplication === "true",
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");

  const data = parsed.data;
  await db.event.update({
    where: { id },
    data: {
      title: data.title,
      summary: data.summary ?? null,
      description: data.description ?? null,
      type: data.type as EventType,
      track: (data.track as EventTrack) ?? null,
      format: data.format as EventFormat,
      visibility: (data.visibility as EventVisibility) ?? "PUBLIC",
      startAt: data.startAt,
      endAt: data.endAt,
      timezone: data.timezone ?? "UTC",
      locationText: data.locationText ?? null,
      meetingUrl: data.meetingUrl || null,
      meetingProvider: (data.meetingProvider as MeetingProvider) ?? null,
      coverImageUrl: data.coverImageUrl || null,
      capacity: data.capacity ?? null,
      isPublished: data.isPublished ?? false,
      isFeatured: data.isFeatured ?? false,
      requiresApplication: data.requiresApplication ?? false,
      recordingUrl: data.recordingUrl || null,
      notesUrl: data.notesUrl || null,
    },
  });
  revalidatePath("/app/events");
  revalidatePath("/app/events/" + id);
  revalidatePath("/app/admin/events");
}

export async function deleteEvent(id: string) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "admin-event-delete"), 20, 60_000);
  if (!rl.ok) throw new Error("Too many event changes. Please wait a minute and try again.");
  await db.event.delete({ where: { id } });
  revalidatePath("/app/events");
  revalidatePath("/app/admin/events");
}

export async function rsvpEvent(eventId: string, status: RsvpStatus) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Sign in to RSVP");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "event-rsvp"), 10, 60_000);
  if (!rl.ok) throw new Error("Too many RSVP attempts. Please wait a minute and try again.");

  await db.eventRsvp.upsert({
    where: {
      eventId_userId: { eventId, userId: session.user.id },
    },
    create: { eventId, userId: session.user.id, status },
    update: { status },
  });
  revalidatePath("/app/events");
  revalidatePath("/app/events/" + eventId);
  revalidatePath("/app/events/mine");
}

export async function cancelRsvp(eventId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "event-cancel-rsvp"), 20, 60_000);
  if (!rl.ok) throw new Error("Too many requests. Please wait a minute and try again.");
  await db.eventRsvp.deleteMany({
    where: { eventId, userId: session.user.id },
  });
  revalidatePath("/app/events");
  revalidatePath("/app/events/" + eventId);
  revalidatePath("/app/events/mine");
}

export async function checkInAttendee(rsvpId: string) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "admin-event-checkin"), 120, 60_000);
  if (!rl.ok) throw new Error("Too many requests. Please wait a minute and try again.");
  await db.eventRsvp.update({
    where: { id: rsvpId },
    data: { checkedInAt: new Date() },
  });
  revalidatePath("/app/admin/events");
}

export async function setEventReminder(eventId: string, remindAt: Date) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "event-reminder"), 10, 60_000);
  if (!rl.ok) throw new Error("Too many reminder changes. Please wait a minute and try again.");
  await db.eventReminder.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    create: { eventId, userId: session.user.id, remindAt },
    update: { remindAt },
  });
  revalidatePath("/app/events/" + eventId);
}

export async function sendRemindersForEvent(eventId: string) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "admin-event-reminders"), 30, 60_000);
  if (!rl.ok) throw new Error("Too many requests. Please wait a minute and try again.");

  const reminders = await db.eventReminder.findMany({
    where: {
      eventId,
      sentAt: null,
    },
    include: {
      event: {
        select: { id: true, title: true, startAt: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { remindAt: "asc" },
    take: 200,
  });

  for (const reminder of reminders) {
    const dispatch = await dispatchEventReminder({
      reminderId: reminder.id,
      toEmail: reminder.user.email,
      toName: reminder.user.name,
      eventId: reminder.event.id,
      eventTitle: reminder.event.title,
      eventStartAt: reminder.event.startAt,
    });
    if (!dispatch.delivered) {
      logger.warn({
        scope: "events.sendRemindersForEvent",
        message: "Reminder dispatch failed.",
        data: {
          reminderId: reminder.id,
          eventId: reminder.event.id,
          userId: reminder.user.id,
          provider: dispatch.provider,
          error: dispatch.error,
        },
      });
      continue;
    }
    await db.eventReminder.update({
      where: { id: reminder.id },
      data: { sentAt: new Date() },
    });
  }

  revalidatePath("/app/admin/events");
}

export async function processDueEventReminders(limit = 200) {
  const session = await getServerSession();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = await rateLimitAsync(rateLimitKey(session.user.id, "admin-event-reminder-drain"), 20, 60_000);
  if (!rl.ok) throw new Error("Too many reminder jobs. Please retry in a minute.");
  return processDueEventRemindersBySystem(limit);
}

export async function processDueEventRemindersBySystem(limit = 200) {
  const dueReminders = await db.eventReminder.findMany({
    where: {
      sentAt: null,
      remindAt: { lte: new Date() },
    },
    include: {
      event: {
        select: { id: true, title: true, startAt: true },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { remindAt: "asc" },
    take: Math.min(Math.max(limit, 1), 500),
  });

  let delivered = 0;
  let failed = 0;
  for (const reminder of dueReminders) {
    const dispatch = await dispatchEventReminder({
      reminderId: reminder.id,
      toEmail: reminder.user.email,
      toName: reminder.user.name,
      eventId: reminder.event.id,
      eventTitle: reminder.event.title,
      eventStartAt: reminder.event.startAt,
    });
    if (!dispatch.delivered) {
      failed += 1;
      logger.warn({
        scope: "events.processDueEventReminders",
        message: "Due reminder dispatch failed.",
        data: {
          reminderId: reminder.id,
          eventId: reminder.event.id,
          userId: reminder.user.id,
          error: dispatch.error,
        },
      });
      continue;
    }
    delivered += 1;
    await db.eventReminder.update({
      where: { id: reminder.id },
      data: { sentAt: new Date() },
    });
  }

  revalidatePath("/app/admin/events");
  return { scanned: dueReminders.length, delivered, failed };
}

