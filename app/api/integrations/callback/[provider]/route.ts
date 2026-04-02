import { NextRequest, NextResponse } from "next/server";
import { IntegrationProvider } from "@prisma/client";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { encryptSecret } from "@/lib/security/crypto";
import {
  ensureOAuthConfigured,
  getIntegrationCallbackUrl,
  verifySignedIntegrationState,
  type OAuthIntegrationSlug,
} from "@/lib/integrations/oauth";

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
};

const ALLOWED_PROVIDERS = new Set<OAuthIntegrationSlug>(["github", "google", "notion", "jira", "calendly"]);

function toProviderSlug(value: string): OAuthIntegrationSlug | null {
  const normalized = value.toLowerCase();
  if (!ALLOWED_PROVIDERS.has(normalized as OAuthIntegrationSlug)) return null;
  return normalized as OAuthIntegrationSlug;
}

function getScopes(value: string | undefined) {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

async function upsertConnection(input: {
  userId: string;
  provider: IntegrationProvider;
  externalUserId?: string | null;
  externalEmail?: string | null;
  scopes?: string[];
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  await db.integrationConnection.upsert({
    where: { userId_provider: { userId: input.userId, provider: input.provider } },
    create: {
      userId: input.userId,
      provider: input.provider,
      status: "CONNECTED",
      externalUserId: input.externalUserId ?? null,
      externalEmail: input.externalEmail ?? null,
      scopes: input.scopes ?? [],
      encryptedToken: input.accessToken ? encryptSecret(input.accessToken) : null,
      refreshToken: input.refreshToken ? encryptSecret(input.refreshToken) : null,
      lastSyncedAt: new Date(),
    },
    update: {
      status: "CONNECTED",
      externalUserId: input.externalUserId ?? null,
      externalEmail: input.externalEmail ?? null,
      scopes: input.scopes ?? [],
      encryptedToken: input.accessToken ? encryptSecret(input.accessToken) : null,
      refreshToken: input.refreshToken ? encryptSecret(input.refreshToken) : null,
      lastSyncedAt: new Date(),
    },
  });
}

async function exchangeCodeForToken(
  provider: OAuthIntegrationSlug,
  code: string,
  redirectUri: string,
) {
  const config = ensureOAuthConfigured(provider);

  if (provider === "github") {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });
    const json = (await response.json()) as TokenResponse & { error?: string; error_description?: string };
    if (!response.ok || !json.access_token) {
      throw new Error(json.error_description || json.error || "GitHub token exchange failed.");
    }
    return json;
  }

  if (provider === "notion") {
    const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });
    const json = (await response.json()) as TokenResponse & {
      access_token?: string;
      workspace_id?: string;
      workspace_name?: string;
      owner?: { user?: { id?: string; person?: { email?: string } } };
    };
    if (!response.ok || !json.access_token) {
      throw new Error("Notion token exchange failed.");
    }
    return json;
  }

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("client_id", String(config.clientId));
  body.set("client_secret", String(config.clientSecret));
  body.set("redirect_uri", redirectUri);

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  const json = (await response.json()) as TokenResponse & { error?: string; error_description?: string };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || `${provider} token exchange failed.`);
  }
  return json;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const providerSlug = toProviderSlug(provider);
  if (!providerSlug) {
    return NextResponse.redirect(new URL("/app/settings?integration_error=unsupported_provider", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/app/settings?integration_error=missing_code_or_state", request.url));
  }

  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?callbackUrl=%2Fapp%2Fsettings", request.url));
  }

  const parsedState = verifySignedIntegrationState(state);
  if (!parsedState || parsedState.userId !== session.user.id || parsedState.integration !== providerSlug) {
    return NextResponse.redirect(new URL("/app/settings?integration_error=invalid_state", request.url));
  }

  const redirectUri = getIntegrationCallbackUrl(providerSlug);

  try {
    const token = await exchangeCodeForToken(providerSlug, code, redirectUri);
    const scopes = getScopes(token.scope);

    if (providerSlug === "github") {
      const profileResponse = await fetch("https://api.github.com/user", {
        headers: { authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      });
      const profile = (await profileResponse.json()) as {
        login?: string;
        id?: number;
        avatar_url?: string;
      };
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: { authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      });
      const emails = (await emailResponse.json()) as Array<{ email: string; primary?: boolean; verified?: boolean }>;
      const primaryEmail = emails.find((item) => item.primary)?.email ?? emails[0]?.email ?? session.user.email ?? null;
      const username = profile.login ?? session.user.username ?? "github-user";

      await upsertConnection({
        userId: session.user.id,
        provider: "GITHUB",
        externalUserId: username,
        externalEmail: primaryEmail,
        scopes,
        accessToken: token.access_token ?? null,
        refreshToken: token.refresh_token ?? null,
      });

      await db.githubConnection.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          username,
          profileUrl: `https://github.com/${username}`,
          accessMode: "oauth",
          lastSyncedAt: new Date(),
        },
        update: {
          username,
          profileUrl: `https://github.com/${username}`,
          accessMode: "oauth",
          lastSyncedAt: new Date(),
        },
      });
    }

    if (providerSlug === "google") {
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      });
      const userInfo = (await userInfoResponse.json()) as { sub?: string; email?: string };
      const externalUserId = userInfo.sub ?? session.user.id;
      const externalEmail = userInfo.email ?? session.user.email ?? null;

      await Promise.all([
        upsertConnection({
          userId: session.user.id,
          provider: "GMAIL",
          externalUserId,
          externalEmail,
          scopes,
          accessToken: token.access_token ?? null,
          refreshToken: token.refresh_token ?? null,
        }),
        upsertConnection({
          userId: session.user.id,
          provider: "GOOGLE_CALENDAR",
          externalUserId,
          externalEmail,
          scopes,
          accessToken: token.access_token ?? null,
          refreshToken: token.refresh_token ?? null,
        }),
      ]);
    }

    if (providerSlug === "notion") {
      const notionToken = token as TokenResponse & {
        workspace_id?: string;
        workspace_name?: string;
        owner?: { user?: { id?: string; person?: { email?: string } } };
      };
      const externalUserId = notionToken.owner?.user?.id ?? notionToken.workspace_id ?? null;
      const externalEmail = notionToken.owner?.user?.person?.email ?? null;

      await upsertConnection({
        userId: session.user.id,
        provider: "NOTION",
        externalUserId,
        externalEmail,
        scopes,
        accessToken: notionToken.access_token ?? null,
        refreshToken: notionToken.refresh_token ?? null,
      });
    }

    if (providerSlug === "jira") {
      const resourcesResponse = await fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
        headers: { authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      });
      const resources = (await resourcesResponse.json()) as Array<{ id: string; name?: string; url?: string }>;
      const primary = resources[0];

      await upsertConnection({
        userId: session.user.id,
        provider: "JIRA",
        externalUserId: primary?.id ?? session.user.id,
        externalEmail: session.user.email ?? null,
        scopes,
        accessToken: token.access_token ?? null,
        refreshToken: token.refresh_token ?? null,
      });
    }

    if (providerSlug === "calendly") {
      const meResponse = await fetch("https://api.calendly.com/users/me", {
        headers: { authorization: `Bearer ${token.access_token}` },
        cache: "no-store",
      });
      const me = (await meResponse.json()) as {
        resource?: {
          uri?: string;
          email?: string;
          scheduling_url?: string;
        };
      };

      await upsertConnection({
        userId: session.user.id,
        provider: "CALENDLY",
        externalUserId: me.resource?.uri ?? session.user.id,
        externalEmail: me.resource?.email ?? session.user.email ?? null,
        scopes,
        accessToken: token.access_token ?? null,
        refreshToken: token.refresh_token ?? null,
      });

      await db.meetingLink.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          calendlyUrl: me.resource?.scheduling_url ?? null,
        },
        update: {
          calendlyUrl: me.resource?.scheduling_url ?? null,
        },
      });
    }

    return NextResponse.redirect(
      new URL(`${parsedState.next}?integration=${providerSlug}&integration_status=connected`, request.url),
    );
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "integration_callback_failed");
    return NextResponse.redirect(new URL(`/app/settings?integration_error=${message}`, request.url));
  }
}
