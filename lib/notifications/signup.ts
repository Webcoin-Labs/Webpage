import "server-only";

import { logger } from "@/lib/logger";

type SignupEmailPayload = {
  toEmail: string;
  name?: string | null;
};

type DeliveryResult = {
  delivered: boolean;
  provider: "resend" | "console";
  error?: string;
};

function buildHtml(name?: string | null) {
  const displayName = name?.trim() || "there";
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin-bottom:8px;">Welcome to Webcoin Labs</h2>
      <p style="margin:0 0 12px;">Hi ${displayName}, your account is ready.</p>
      <p style="margin:0 0 12px;">You can now access your dashboard and start using Founder OS, Builder OS, and Investor OS workflows.</p>
      <p style="margin:0;color:#6b7280;font-size:12px;">If you did not create this account, contact support immediately.</p>
    </div>
  `;
}

async function sendViaResend(payload: SignupEmailPayload): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.SIGNUP_FROM_EMAIL || process.env.PASSWORD_RESET_FROM_EMAIL;
  if (!apiKey || !from) {
    return { delivered: false, provider: "resend", error: "Resend signup email is not configured." };
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
        subject: "Welcome to Webcoin Labs",
        html: buildHtml(payload.name),
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

export async function dispatchSignupWelcomeEmail(payload: SignupEmailPayload): Promise<DeliveryResult> {
  const result = await sendViaResend(payload);
  if (result.delivered) return result;

  if (process.env.NODE_ENV !== "production") {
    logger.info({
      scope: "notifications.signup",
      message: "Signup email fallback to console in non-production.",
      data: {
        toEmail: payload.toEmail,
        name: payload.name,
        resendError: result.error,
      },
    });
    return { delivered: true, provider: "console" };
  }

  logger.error({
    scope: "notifications.signup",
    message: "Signup email delivery failed in production.",
    data: {
      toEmail: payload.toEmail,
      name: payload.name,
      resendError: result.error,
    },
  });
  return result;
}
