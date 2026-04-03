import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import {
  createSignedIntegrationState,
  ensureOAuthConfigured,
  getIntegrationCallbackUrl,
  type OAuthIntegrationSlug,
} from "@/lib/integrations/oauth";

const ALLOWED_PROVIDERS = new Set<OAuthIntegrationSlug>(["github", "google", "notion", "jira", "calendly"]);

function toProviderSlug(value: string): OAuthIntegrationSlug | null {
  const normalized = value.toLowerCase();
  if (!ALLOWED_PROVIDERS.has(normalized as OAuthIntegrationSlug)) return null;
  return normalized as OAuthIntegrationSlug;
}

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/app/settings";
  return value;
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

  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login?callbackUrl=%2Fapp%2Fsettings", request.url));
  }

  try {
    const config = ensureOAuthConfigured(providerSlug);
    const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
    const redirectUri = getIntegrationCallbackUrl(providerSlug);
    const state = createSignedIntegrationState({
      userId: session.user.id,
      integration: providerSlug,
      next: nextPath,
    });

    const authorizeUrl = new URL(config.authorizeUrl);
    authorizeUrl.searchParams.set("client_id", String(config.clientId));
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);

    switch (providerSlug) {
      case "github":
        authorizeUrl.searchParams.set("scope", (config.scopes ?? []).join(" "));
        break;
      case "google":
        authorizeUrl.searchParams.set("response_type", "code");
        authorizeUrl.searchParams.set("access_type", "offline");
        authorizeUrl.searchParams.set("prompt", "consent");
        authorizeUrl.searchParams.set("scope", (config.scopes ?? []).join(" "));
        break;
      case "notion":
        authorizeUrl.searchParams.set("owner", "user");
        break;
      case "jira":
        authorizeUrl.searchParams.set("audience", "api.atlassian.com");
        authorizeUrl.searchParams.set("response_type", "code");
        authorizeUrl.searchParams.set("prompt", "consent");
        authorizeUrl.searchParams.set("scope", (config.scopes ?? []).join(" "));
        break;
      case "calendly":
        authorizeUrl.searchParams.set("response_type", "code");
        authorizeUrl.searchParams.set("scope", (config.scopes ?? []).join(" "));
        break;
    }

    return NextResponse.redirect(authorizeUrl.toString());
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "integration_connect_failed");
    return NextResponse.redirect(new URL(`/app/settings?integration_error=${message}`, request.url));
  }
}
