import "server-only";

import crypto from "crypto";
import { env } from "@/lib/env";
import { authConfig } from "@/lib/auth-config";

export type OAuthIntegrationSlug = "github" | "google" | "notion" | "jira" | "calendly";

type SignedStatePayload = {
  userId: string;
  integration: OAuthIntegrationSlug;
  next: string;
  exp: number;
};

const STATE_MAX_AGE_SECONDS = 10 * 60;

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function getSigningSecret() {
  return env.APP_ENCRYPTION_SECRET || env.NEXTAUTH_SECRET || "webcoinlabs-integration-state";
}

export function getIntegrationCallbackUrl(slug: OAuthIntegrationSlug) {
  return `${authConfig.appUrl}/api/integrations/callback/${slug}`;
}

export function createSignedIntegrationState(input: {
  userId: string;
  integration: OAuthIntegrationSlug;
  next?: string;
}) {
  const payload: SignedStatePayload = {
    userId: input.userId,
    integration: input.integration,
    next: input.next?.startsWith("/") ? input.next : "/app/settings",
    exp: Math.floor(Date.now() / 1000) + STATE_MAX_AGE_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", getSigningSecret()).update(encodedPayload).digest("hex");
  return `${encodedPayload}.${signature}`;
}

export function verifySignedIntegrationState(state: string): SignedStatePayload | null {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", getSigningSecret()).update(encodedPayload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SignedStatePayload;
    if (!payload || typeof payload !== "object") return null;
    if (!payload.userId || !payload.integration || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.next?.startsWith("/")) payload.next = "/app/settings";
    return payload;
  } catch {
    return null;
  }
}

type OAuthProviderConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
};

export function getOAuthProviderConfig(slug: OAuthIntegrationSlug): OAuthProviderConfig {
  switch (slug) {
    case "github":
      return {
        authorizeUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        scopes: ["read:user", "user:email"],
      };
    case "google":
      return {
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        scopes: [
          "openid",
          "email",
          "profile",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/calendar.readonly",
        ],
      };
    case "notion":
      return {
        authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        clientId: env.NOTION_CLIENT_ID,
        clientSecret: env.NOTION_CLIENT_SECRET,
      };
    case "jira":
      return {
        authorizeUrl: "https://auth.atlassian.com/authorize",
        tokenUrl: "https://auth.atlassian.com/oauth/token",
        clientId: env.ATLASSIAN_CLIENT_ID,
        clientSecret: env.ATLASSIAN_CLIENT_SECRET,
        scopes: ["read:me", "offline_access"],
      };
    case "calendly":
      return {
        authorizeUrl: "https://auth.calendly.com/oauth/authorize",
        tokenUrl: "https://auth.calendly.com/oauth/token",
        clientId: env.CALENDLY_CLIENT_ID,
        clientSecret: env.CALENDLY_CLIENT_SECRET,
        scopes: ["default"],
      };
  }
}

export function ensureOAuthConfigured(slug: OAuthIntegrationSlug) {
  const config = getOAuthProviderConfig(slug);
  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${slug.toUpperCase()} OAuth is not configured. Add client id/secret env values.`);
  }
  return config;
}
