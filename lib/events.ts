import type { Event, EventType, EventTrack, EventFormat } from "@prisma/client";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  OFFICE_HOURS: "Office Hours",
  WORKSHOP: "Workshop",
  FOUNDER_TALK: "Founder Talk",
  DEMO_DAY: "Demo Day",
  COMMUNITY_MEETUP: "Community Meetup",
  AMA: "AMA",
  PARTNER_SESSION: "Partner Session",
};

export const EVENT_TRACK_LABELS: Record<EventTrack, string> = {
  STABLECOINS: "Stablecoins",
  FINTECH: "Fintech",
  INFRA: "Infrastructure",
  GTM_DISTRIBUTION: "Growth / GTM",
  SECURITY: "Security",
  LEGAL_COMPLIANCE: "Legal & Compliance",
};

export const EVENT_FORMAT_LABELS: Record<EventFormat, string> = {
  ONLINE: "Online",
  IN_PERSON: "In-person",
  HYBRID: "Hybrid",
};

export type EventWithCount = Event & {
  _count?: { rsvps: number };
  rsvps?: { id: string }[];
};

export function formatEventDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function formatEventDateShort(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}
