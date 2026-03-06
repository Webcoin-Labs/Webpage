/**
 * Generate iCal (.ics) content for an event (add to calendar).
 */
export function generateIcs(params: {
  title: string;
  description?: string | null;
  startAt: Date;
  endAt: Date;
  location?: string | null;
  url?: string | null;
}) {
  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "");
  const escape = (s: string) => s.replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const uid = `webcoinlabs-${params.startAt.getTime()}@webcoinlabs.com`;
  const now = formatDate(new Date());
  const start = formatDate(params.startAt);
  const end = formatDate(params.endAt);
  const title = escape(params.title);
  const desc = params.description ? escape(params.description.slice(0, 500)) : "";
  const loc = params.location ? escape(params.location) : "";
  const url = params.url || "";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Webcoin Labs//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    desc ? `DESCRIPTION:${desc}` : "",
    loc ? `LOCATION:${loc}` : "",
    url ? `URL:${url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
