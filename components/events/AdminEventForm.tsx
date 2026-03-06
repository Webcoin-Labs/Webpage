"use client";

import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/app/actions/events";
import {
  EVENT_TYPE_LABELS,
  EVENT_TRACK_LABELS,
  EVENT_FORMAT_LABELS,
} from "@/lib/events";
import type { EventType, EventTrack, EventFormat } from "@prisma/client";
import type { Event } from "@prisma/client";

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[];
const TRACKS = Object.keys(EVENT_TRACK_LABELS) as EventTrack[];
const FORMATS = Object.keys(EVENT_FORMAT_LABELS) as EventFormat[];

export function AdminEventForm({ event }: { event?: Event | null }) {
  const router = useRouter();
  const isEdit = !!event;

  const defaultStart = event
    ? new Date(event.startAt).toISOString().slice(0, 16)
    : "";
  const defaultEnd = event
    ? new Date(event.endAt).toISOString().slice(0, 16)
    : "";

  async function handleSubmit(formData: FormData) {
    if (isEdit && event) {
      await updateEvent(event.id, formData);
      router.refresh();
    } else {
      await createEvent(formData);
      router.push("/app/admin/events");
      router.refresh();
    }
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          name="title"
          defaultValue={event?.title}
          required
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Summary</label>
        <textarea
          name="summary"
          defaultValue={event?.summary ?? ""}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description (agenda, markdown)</label>
        <textarea
          name="description"
          defaultValue={event?.description ?? ""}
          rows={6}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type *</label>
          <select
            name="type"
            defaultValue={event?.type}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Track</label>
          <select
            name="track"
            defaultValue={event?.track ?? ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="">—</option>
            {TRACKS.map((t) => (
              <option key={t} value={t}>
                {EVENT_TRACK_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Format *</label>
        <select
          name="format"
          defaultValue={event?.format ?? "ONLINE"}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {EVENT_FORMAT_LABELS[f]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Visibility</label>
        <select
          name="visibility"
          defaultValue={event?.visibility ?? "PUBLIC"}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="PUBLIC">Public</option>
          <option value="MEMBERS">Members</option>
          <option value="INVITE_ONLY">Invite only</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Start *</label>
          <input
            type="datetime-local"
            name="startAt"
            defaultValue={defaultStart}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End *</label>
          <input
            type="datetime-local"
            name="endAt"
            defaultValue={defaultEnd}
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Timezone</label>
        <input
          name="timezone"
          defaultValue={event?.timezone ?? "UTC"}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Location / Meeting URL</label>
        <input
          name="locationText"
          defaultValue={event?.locationText ?? ""}
          placeholder="Address or meeting link"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Meeting URL</label>
        <input
          name="meetingUrl"
          type="url"
          defaultValue={event?.meetingUrl ?? ""}
          placeholder="https://..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Meeting provider</label>
        <select
          name="meetingProvider"
          defaultValue={event?.meetingProvider ?? ""}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        >
          <option value="">—</option>
          <option value="CALENDLY">Calendly</option>
          <option value="GOOGLE_MEET">Google Meet</option>
          <option value="ZOOM">Zoom</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Cover image URL</label>
        <input
          name="coverImageUrl"
          type="url"
          defaultValue={event?.coverImageUrl ?? ""}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Capacity</label>
        <input
          name="capacity"
          type="number"
          min={0}
          defaultValue={event?.capacity ?? ""}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={event?.isPublished ?? false}
            className="rounded"
          />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={event?.isFeatured ?? false}
            className="rounded"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="requiresApplication"
            defaultChecked={event?.requiresApplication ?? false}
            className="rounded"
          />
          Requires application
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recording URL</label>
          <input
            name="recordingUrl"
            type="url"
            defaultValue={event?.recordingUrl ?? ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes URL</label>
          <input
            name="notesUrl"
            type="url"
            defaultValue={event?.notesUrl ?? ""}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 font-medium text-sm border border-cyan-500/30 hover:bg-cyan-500/30"
        >
          {isEdit ? "Update" : "Create"}
        </button>
        {isEdit && (
          <a
            href={`/app/events/${event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent"
          >
            View event
          </a>
        )}
      </div>
    </form>
  );
}
