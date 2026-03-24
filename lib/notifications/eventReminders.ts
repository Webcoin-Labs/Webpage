import "server-only";
import { logger } from "@/lib/logger";

type ReminderPayload = {
  reminderId: string;
  toEmail: string;
  toName?: string | null;
  eventId: string;
  eventTitle: string;
  eventStartAtIso: string;
  eventUrl: string;
};

type ReminderDispatchResult = {
  delivered: boolean;
  provider: "webhook" | "console";
  error?: string;
};

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

async function sendToWebhook(payload: ReminderPayload): Promise<ReminderDispatchResult> {
  const webhookUrl = process.env.EVENT_REMINDER_WEBHOOK_URL;
  if (!webhookUrl) {
    return { delivered: false, provider: "console", error: "EVENT_REMINDER_WEBHOOK_URL not configured." };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.EVENT_REMINDER_WEBHOOK_TOKEN
          ? { authorization: `Bearer ${process.env.EVENT_REMINDER_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        delivered: false,
        provider: "webhook",
        error: `Webhook responded ${response.status}: ${body.slice(0, 300)}`,
      };
    }
    return { delivered: true, provider: "webhook" };
  } catch (error) {
    return {
      delivered: false,
      provider: "webhook",
      error: error instanceof Error ? error.message : "Webhook delivery failed.",
    };
  }
}

export async function dispatchEventReminder(input: {
  reminderId: string;
  toEmail: string;
  toName?: string | null;
  eventId: string;
  eventTitle: string;
  eventStartAt: Date;
}): Promise<ReminderDispatchResult> {
  const payload: ReminderPayload = {
    reminderId: input.reminderId,
    toEmail: input.toEmail,
    toName: input.toName,
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    eventStartAtIso: input.eventStartAt.toISOString(),
    eventUrl: `${getBaseUrl()}/app/events/${input.eventId}`,
  };

  const result = await sendToWebhook(payload);
  if (result.delivered) return result;

  if (process.env.NODE_ENV === "production") {
    logger.error({
      scope: "notifications.eventReminder",
      message: "Event reminder delivery failed in production.",
      data: payload,
      error: result.error,
    });
    return {
      delivered: false,
      provider: "webhook",
      error: result.error ?? "Reminder delivery failed.",
    };
  }

  logger.info({
    scope: "notifications.eventReminder",
    message: "Reminder fallback to console output.",
    data: payload,
  });
  return {
    delivered: true,
    provider: "console",
  };
}
