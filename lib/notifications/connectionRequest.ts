import "server-only";

import { logger } from "@/lib/logger";

type ConnectionRequestEmailPayload = {
  toEmail: string;
  toName?: string | null;
  fromName?: string | null;
  fromUsername?: string | null;
};

type DeliveryResult = {
  delivered: boolean;
  provider: "resend" | "console";
  error?: string;
};

function getBaseUrl() {
  return (process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function buildHtml(payload: ConnectionRequestEmailPayload) {
  const recipient = payload.toName?.trim() || "there";
  const sender = payload.fromName?.trim() || payload.fromUsername?.trim() || "A Webcoin Labs member";
  const profileHandle = payload.fromUsername?.trim() ? `@${payload.fromUsername.trim().replace(/^@+/, "")}` : "their profile";
  const inboxUrl = `${getBaseUrl()}/app/messages`;

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin-bottom:8px;">You received a connection request</h2>
      <p style="margin:0 0 12px;">Hi ${recipient},</p>
      <p style="margin:0 0 12px;">
        <strong>${sender}</strong> (${profileHandle}) sent you a connection request on Webcoin Labs.
      </p>
      <p style="margin:0 0 16px;">
        Open your inbox to accept or decline.
      </p>
      <p style="margin:0 0 18px;">
        <a href="${inboxUrl}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;">
          Open inbox
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280;margin:0;">If this wasn’t expected, you can ignore this email.</p>
    </div>
  `;
}

async function sendViaResend(payload: ConnectionRequestEmailPayload): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SIGNUP_FROM_EMAIL || process.env.PASSWORD_RESET_FROM_EMAIL;
  if (!apiKey || !from) {
    return { delivered: false, provider: "resend", error: "Resend is not configured." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.toEmail],
        subject: "You have a new connection request",
        html: buildHtml(payload),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        delivered: false,
        provider: "resend",
        error: `Resend responded ${response.status}: ${body.slice(0, 250)}`,
      };
    }
    return { delivered: true, provider: "resend" };
  } catch (error) {
    return {
      delivered: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Resend delivery failed.",
    };
  }
}

export async function dispatchConnectionRequestEmail(payload: ConnectionRequestEmailPayload): Promise<DeliveryResult> {
  const result = await sendViaResend(payload);
  if (result.delivered) return result;

  if (process.env.NODE_ENV !== "production") {
    logger.info({
      scope: "notifications.connectionRequest",
      message: "Connection request email fallback to console in non-production.",
      data: {
        toEmail: payload.toEmail,
        toName: payload.toName,
        fromName: payload.fromName,
        fromUsername: payload.fromUsername,
        resendError: result.error,
      },
    });
    return { delivered: true, provider: "console" };
  }

  logger.error({
    scope: "notifications.connectionRequest",
    message: "Connection request email delivery failed in production.",
    data: {
      toEmail: payload.toEmail,
      toName: payload.toName,
      fromName: payload.fromName,
      fromUsername: payload.fromUsername,
      resendError: result.error,
    },
  });
  return result;
}
