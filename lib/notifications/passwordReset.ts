import "server-only";

import { logger } from "@/lib/logger";

type PasswordResetPayload = {
  toEmail: string;
  resetLink: string;
};

type DeliveryResult = {
  delivered: boolean;
  provider: "resend" | "webhook" | "console";
  error?: string;
};

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function buildHtml(resetLink: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin-bottom:8px;">Reset your Webcoin Labs password</h2>
      <p style="margin:0 0 16px;">Use the button below to set a new password. This link expires in 1 hour.</p>
      <p style="margin:0 0 18px;">
        <a href="${resetLink}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;">
          Reset password
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">If the button does not work, copy and paste this URL:</p>
      <p style="font-size:12px;word-break:break-all;color:#6b7280;margin:0;">${resetLink}</p>
      <p style="font-size:12px;color:#6b7280;margin-top:18px;">If you did not request this, you can ignore this email.</p>
    </div>
  `;
}

async function sendViaResend(payload: PasswordResetPayload): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.PASSWORD_RESET_FROM_EMAIL;
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
        subject: "Reset your Webcoin Labs password",
        html: buildHtml(payload.resetLink),
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

async function sendViaWebhook(payload: PasswordResetPayload): Promise<DeliveryResult> {
  const webhookUrl = process.env.PASSWORD_RESET_WEBHOOK_URL;
  if (!webhookUrl) {
    return { delivered: false, provider: "webhook", error: "Password reset webhook is not configured." };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.PASSWORD_RESET_WEBHOOK_TOKEN
          ? { authorization: `Bearer ${process.env.PASSWORD_RESET_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        toEmail: payload.toEmail,
        resetLink: payload.resetLink,
        appUrl: getBaseUrl(),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        delivered: false,
        provider: "webhook",
        error: `Webhook responded ${response.status}: ${body.slice(0, 250)}`,
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

export async function dispatchPasswordResetEmail(payload: PasswordResetPayload): Promise<DeliveryResult> {
  const resendResult = await sendViaResend(payload);
  if (resendResult.delivered) return resendResult;

  const webhookResult = await sendViaWebhook(payload);
  if (webhookResult.delivered) return webhookResult;

  if (process.env.NODE_ENV === "production") {
    logger.error({
      scope: "notifications.passwordReset",
      message: "Password reset delivery failed in production.",
      data: {
        toEmail: payload.toEmail,
        resendError: resendResult.error,
        webhookError: webhookResult.error,
      },
    });
    return {
      delivered: false,
      provider: "webhook",
      error: "Password reset delivery failed.",
    };
  }

  logger.info({
    scope: "notifications.passwordReset",
    message: "Password reset delivery fallback to console output.",
    data: {
      toEmail: payload.toEmail,
      resetLink: payload.resetLink,
      resendError: resendResult.error,
      webhookError: webhookResult.error,
    },
  });

  return {
    delivered: true,
    provider: "console",
  };
}
