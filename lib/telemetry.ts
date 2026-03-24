import "server-only";

export function logEvent(event: string, payload: Record<string, unknown>) {
  // Structured log for ingestion by platform log routers.
  console.info(
    JSON.stringify({
      source: "webcoinlabs",
      event,
      payload,
      ts: new Date().toISOString(),
    }),
  );
}

export function logError(event: string, payload: Record<string, unknown>) {
  console.error(
    JSON.stringify({
      source: "webcoinlabs",
      event,
      payload,
      ts: new Date().toISOString(),
    }),
  );
}
