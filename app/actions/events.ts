"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EventType, EventTrack, EventFormat, MeetingProvider, EventVisibility, RsvpStatus } from "@prisma/client";
import { rateLimit, rateLimitKey } from "@/lib/rateLimit";

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
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = rateLimit(rateLimitKey(session.user.id, "admin-event-create"), 30, 60_000);
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
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${slugify(data.title)}-${++n}`;
  }

  await prisma.event.create({
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
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = rateLimit(rateLimitKey(session.user.id, "admin-event-update"), 60, 60_000);
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
  await prisma.event.update({
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
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = rateLimit(rateLimitKey(session.user.id, "admin-event-delete"), 20, 60_000);
  if (!rl.ok) throw new Error("Too many event changes. Please wait a minute and try again.");
  await prisma.event.delete({ where: { id } });
  revalidatePath("/app/events");
  revalidatePath("/app/admin/events");
}

export async function rsvpEvent(eventId: string, status: RsvpStatus) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Sign in to RSVP");
  const rl = rateLimit(rateLimitKey(session.user.id, "event-rsvp"), 10, 60_000);
  if (!rl.ok) throw new Error("Too many RSVP attempts. Please wait a minute and try again.");

  await prisma.eventRsvp.upsert({
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  const rl = rateLimit(rateLimitKey(session.user.id, "event-cancel-rsvp"), 20, 60_000);
  if (!rl.ok) throw new Error("Too many requests. Please wait a minute and try again.");
  await prisma.eventRsvp.deleteMany({
    where: { eventId, userId: session.user.id },
  });
  revalidatePath("/app/events");
  revalidatePath("/app/events/" + eventId);
  revalidatePath("/app/events/mine");
}

export async function checkInAttendee(rsvpId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = rateLimit(rateLimitKey(session.user.id, "admin-event-checkin"), 120, 60_000);
  if (!rl.ok) throw new Error("Too many requests. Please wait a minute and try again.");
  await prisma.eventRsvp.update({
    where: { id: rsvpId },
    data: { checkedInAt: new Date() },
  });
  revalidatePath("/app/admin/events");
}

export async function setEventReminder(eventId: string, remindAt: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  const rl = rateLimit(rateLimitKey(session.user.id, "event-reminder"), 10, 60_000);
  if (!rl.ok) throw new Error("Too many reminder changes. Please wait a minute and try again.");
  await prisma.eventReminder.upsert({
    where: { eventId_userId: { eventId, userId: session.user.id } },
    create: { eventId, userId: session.user.id, remindAt },
    update: { remindAt },
  });
  revalidatePath("/app/events/" + eventId);
}

// Stub: send reminders (TODO: cron or queue)
export async function sendRemindersForEvent(_eventId: string) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  const rl = rateLimit(rateLimitKey(session.user.id, "admin-event-reminders"), 30, 60_000);
  if (!rl.ok) throw new Error("Too many requests. Please wait a minute and try again.");
  // TODO: enqueue emails for T-24h and T-1h
  revalidatePath("/app/admin/events");
}
