import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { IntegrationProvider } from "@prisma/client";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { SettingsForm } from "@/components/app/SettingsForm";
import { WalletConnectionCard } from "@/components/app/WalletConnectionCard";
import { IntegrationStatusCard, type IntegrationCardModel } from "@/components/integrations/IntegrationStatusCard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectOpenClaw, disconnectOpenClaw, syncTelegramThreads } from "@/app/actions/founder-os-expansion";
import { upsertCalendlyLink } from "@/app/actions/founder-os";
import { getIntegrationPlugin } from "@/lib/integrations/plugins";
import { syncConnectedIntegrations } from "@/lib/integrations/sync";

export const metadata = { title: "Settings - Webcoin Labs" };

function toCardStatus(value: string | null | undefined): IntegrationCardModel["status"] {
  if (value === "CONNECTED" || value === "ERROR" || value === "SYNCING") return value;
  return "DISCONNECTED";
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getMetadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ integration_error?: string; integration?: string; integration_status?: string }>;
}) {
  const resolvedSearch = (await searchParams) ?? {};
  const session = await getServerSession();
  const user = session!.user;
  const isFounder = user.role === "FOUNDER" || user.role === "ADMIN";

  const connectProviderAction = async (formData: FormData) => {
    "use server";
    const session = await getServerSession();
    if (!session?.user?.id) return;

    const rawProvider = String(formData.get("provider") ?? "").toUpperCase();
    const provider = rawProvider as IntegrationProvider;
    const allowedProviders: IntegrationProvider[] = [
      "GMAIL",
      "GOOGLE_CALENDAR",
      "NOTION",
      "GITHUB",
      "JIRA",
      "CALENDLY",
      "CAL_DOT_COM",
      "FARCASTER",
    ];
    if (!allowedProviders.includes(provider)) return;

    const oauthRedirectMap: Partial<Record<IntegrationProvider, string>> = {
      GITHUB: "/api/integrations/connect/github?next=%2Fapp%2Fsettings",
      GMAIL: "/api/integrations/connect/google?next=%2Fapp%2Fsettings",
      GOOGLE_CALENDAR: "/api/integrations/connect/google?next=%2Fapp%2Fsettings",
      NOTION: "/api/integrations/connect/notion?next=%2Fapp%2Fsettings",
      JIRA: "/api/integrations/connect/jira?next=%2Fapp%2Fsettings",
      CALENDLY: "/api/integrations/connect/calendly?next=%2Fapp%2Fsettings",
    };

    const oauthPath = oauthRedirectMap[provider];
    if (oauthPath) {
      redirect(oauthPath);
    }

    if (provider === "GITHUB") {
      const githubUsernameSeed =
        session.user.username?.replace(/^@+/, "").trim().toLowerCase() ??
        session.user.email?.split("@")[0]?.trim().toLowerCase() ??
        "webcoin-user";

      await db.githubConnection.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          username: githubUsernameSeed,
          profileUrl: `https://github.com/${githubUsernameSeed}`,
          accessMode: "manual_sync",
          lastSyncedAt: new Date(),
        },
        update: {
          username: githubUsernameSeed,
          profileUrl: `https://github.com/${githubUsernameSeed}`,
          accessMode: "manual_sync",
          lastSyncedAt: new Date(),
        },
      });
    }

    await db.integrationConnection.upsert({
      where: { userId_provider: { userId: session.user.id, provider } },
      create: {
        userId: session.user.id,
        provider,
        status: "CONNECTED",
        externalEmail:
          provider === "GMAIL" || provider === "GOOGLE_CALENDAR" || provider === "NOTION" || provider === "JIRA"
            ? session.user.email ?? null
            : null,
        externalUserId:
          provider === "FARCASTER" || provider === "GITHUB"
            ? session.user.username?.replace(/^@+/, "").trim().toLowerCase() ?? null
            : null,
        lastSyncedAt: new Date(),
      },
      update: {
        status: "CONNECTED",
        externalEmail:
          provider === "GMAIL" || provider === "GOOGLE_CALENDAR" || provider === "NOTION" || provider === "JIRA"
            ? session.user.email ?? null
            : undefined,
        externalUserId:
          provider === "FARCASTER" || provider === "GITHUB"
            ? session.user.username?.replace(/^@+/, "").trim().toLowerCase() ?? null
            : undefined,
        lastSyncedAt: new Date(),
      },
    });

    revalidatePath("/app/settings");
    revalidatePath("/app/builder-os/integrations");
    revalidatePath("/app/founder-os/integrations");
    revalidatePath("/app/investor-os/integrations");
  };

  const disconnectProviderAction = async (formData: FormData) => {
    "use server";
    const session = await getServerSession();
    if (!session?.user?.id) return;

    const rawProvider = String(formData.get("provider") ?? "").toUpperCase();
    const provider = rawProvider as IntegrationProvider;
    const allowedProviders: IntegrationProvider[] = [
      "GMAIL",
      "GOOGLE_CALENDAR",
      "NOTION",
      "GITHUB",
      "JIRA",
      "CALENDLY",
      "CAL_DOT_COM",
      "FARCASTER",
    ];
    if (!allowedProviders.includes(provider)) return;

    if (provider === "GMAIL" || provider === "GOOGLE_CALENDAR") {
      await Promise.all(
        (["GMAIL", "GOOGLE_CALENDAR"] as const).map((googleProvider) =>
          db.integrationConnection.upsert({
            where: { userId_provider: { userId: session.user.id, provider: googleProvider } },
            create: {
              userId: session.user.id,
              provider: googleProvider,
              status: "DISCONNECTED",
            },
            update: {
              status: "DISCONNECTED",
              externalEmail: null,
              externalUserId: null,
              encryptedToken: null,
              refreshToken: null,
              lastSyncedAt: null,
            },
          }),
        ),
      );

      revalidatePath("/app/settings");
      revalidatePath("/app/builder-os/integrations");
      revalidatePath("/app/founder-os/integrations");
      revalidatePath("/app/investor-os/integrations");
      return;
    }

    if (provider === "GITHUB") {
      await db.githubConnection.deleteMany({ where: { userId: session.user.id } });
    }

    await db.integrationConnection.upsert({
      where: { userId_provider: { userId: session.user.id, provider } },
      create: {
        userId: session.user.id,
        provider,
        status: "DISCONNECTED",
      },
      update: {
        status: "DISCONNECTED",
        externalEmail: null,
        externalUserId: null,
        encryptedToken: null,
        refreshToken: null,
        lastSyncedAt: null,
      },
    });

    revalidatePath("/app/settings");
    revalidatePath("/app/builder-os/integrations");
    revalidatePath("/app/founder-os/integrations");
    revalidatePath("/app/investor-os/integrations");
  };

  const connectOpenClawAction = async (formData: FormData) => {
    "use server";
    await connectOpenClaw(formData);
  };

  const syncTelegramThreadsAction = async (formData: FormData) => {
    "use server";
    await syncTelegramThreads(formData);
  };

  const disconnectOpenClawAction = async (_formData: FormData) => {
    "use server";
    await disconnectOpenClaw();
  };

  const upsertCalendlyLinkAction = async (formData: FormData) => {
    "use server";
    await upsertCalendlyLink(formData);
  };

  const runPluginSyncAction = async (_formData: FormData) => {
    "use server";
    const session = await getServerSession();
    if (!session?.user?.id) return;
    await syncConnectedIntegrations({ userId: session.user.id, limit: 100 });
    revalidatePath("/app/settings");
    revalidatePath("/app/builder-os/integrations");
    revalidatePath("/app/founder-os/integrations");
    revalidatePath("/app/investor-os/integrations");
  };

  const [
    dbUser,
    founderProfile,
    workspaces,
    wallets,
    integrations,
    githubConnection,
    openClawConnection,
    meetingLink,
    telegramWorkspaceCount,
    integrationSyncAuditLogs,
  ] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { username: true } }),
    db.founderProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
    db.userWorkspace.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.walletConnection.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    db.integrationConnection.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    db.githubConnection.findUnique({ where: { userId: user.id }, select: { username: true, updatedAt: true } }),
    db.openClawConnection.findUnique({ where: { userId: user.id }, select: { baseUrl: true, status: true, updatedAt: true } }),
    db.meetingLink.findUnique({ where: { userId: user.id }, select: { calendlyUrl: true, updatedAt: true } }),
    db.telegramWorkspace.count({ where: { connection: { userId: user.id } } }),
    db.mutationAuditLog.findMany({
      where: {
        userId: user.id,
        action: { in: ["integration_sync_success", "integration_sync_error"] },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    }),
  ]);

  const lastSyncByProvider = new Map<string, Date>();
  const lastErrorByProvider = new Map<string, string>();
  for (const log of integrationSyncAuditLogs) {
    const provider = getMetadataString(log.metadata, "provider");
    if (!provider) continue;
    if (log.action === "integration_sync_success" && !lastSyncByProvider.has(provider)) {
      lastSyncByProvider.set(provider, log.createdAt);
    }
    if (log.action === "integration_sync_error" && !lastErrorByProvider.has(provider)) {
      const message = getMetadataString(log.metadata, "message");
      if (message) lastErrorByProvider.set(provider, message);
    }
  }

  const integrationByProvider = new Map(integrations.map((item) => [item.provider, item]));
  const connectorCards: IntegrationCardModel[] = [
    {
      id: "github",
      name: "GitHub",
      detail: githubConnection
        ? `Connected as ${githubConnection.username}`
        : `${getIntegrationPlugin("GITHUB")?.label ?? "GitHub Plugin"} - repository-backed proof and activity sync.`,
      status: githubConnection ? "CONNECTED" : toCardStatus(integrationByProvider.get("GITHUB")?.status),
      href: "/app/builder-os/github",
      providerKey: "GITHUB",
      providerValue: "GITHUB",
      connectFormAction: connectProviderAction,
      disconnectFormAction: disconnectProviderAction,
      lastSyncedAt: lastSyncByProvider.get("GITHUB") ?? githubConnection?.updatedAt ?? integrationByProvider.get("GITHUB")?.updatedAt ?? null,
      lastError: lastErrorByProvider.get("GITHUB") ?? null,
    },
    {
      id: "notion",
      name: "Notion",
      detail:
        integrationByProvider.get("NOTION")?.externalEmail ??
        `${getIntegrationPlugin("NOTION")?.label ?? "Notion Plugin"} - knowledge sync for docs and operating context.`,
      status: toCardStatus(integrationByProvider.get("NOTION")?.status),
      href: "/app/founder-os/integrations",
      providerKey: "NOTION",
      providerValue: "NOTION",
      connectFormAction: connectProviderAction,
      disconnectFormAction: disconnectProviderAction,
      lastSyncedAt: lastSyncByProvider.get("NOTION") ?? integrationByProvider.get("NOTION")?.updatedAt ?? null,
      lastError: lastErrorByProvider.get("NOTION") ?? null,
    },
    {
      id: "gmail",
      name: "Gmail",
      detail:
        integrationByProvider.get("GMAIL")?.externalEmail ??
        `${getIntegrationPlugin("GMAIL")?.label ?? "Gmail Plugin"} - email thread context and outreach continuity.`,
      status: toCardStatus(integrationByProvider.get("GMAIL")?.status),
      href: "/app/investor-os/integrations",
      providerKey: "GMAIL",
      providerValue: "GMAIL",
      connectFormAction: connectProviderAction,
      disconnectFormAction: disconnectProviderAction,
      lastSyncedAt: lastSyncByProvider.get("GMAIL") ?? integrationByProvider.get("GMAIL")?.updatedAt ?? null,
      lastError: lastErrorByProvider.get("GMAIL") ?? null,
    },
    {
      id: "google_calendar",
      name: "Google Calendar",
      detail:
        integrationByProvider.get("GOOGLE_CALENDAR")?.externalEmail ??
        `${getIntegrationPlugin("GOOGLE_CALENDAR")?.label ?? "Google Calendar Plugin"} - meeting context and scheduling automation.`,
      status: toCardStatus(integrationByProvider.get("GOOGLE_CALENDAR")?.status),
      href: "/app/founder-os/investor-connect",
      providerKey: "GOOGLE_CALENDAR",
      providerValue: "GOOGLE_CALENDAR",
      connectFormAction: connectProviderAction,
      disconnectFormAction: disconnectProviderAction,
      lastSyncedAt:
        lastSyncByProvider.get("GOOGLE_CALENDAR") ??
        integrationByProvider.get("GOOGLE_CALENDAR")?.updatedAt ??
        null,
      lastError: lastErrorByProvider.get("GOOGLE_CALENDAR") ?? null,
    },
    {
      id: "calendly",
      name: "Calendly",
      detail:
        meetingLink?.calendlyUrl ??
        `${getIntegrationPlugin("CALENDLY")?.label ?? "Calendly Plugin"} - scheduling link used by founder and investor workflows.`,
      status: meetingLink?.calendlyUrl ? "CONNECTED" : toCardStatus(integrationByProvider.get("CALENDLY")?.status),
      href: "/app/founder-os/investor-connect",
      providerKey: "CALENDLY",
      providerValue: "CALENDLY",
      connectFormAction: connectProviderAction,
      disconnectFormAction: disconnectProviderAction,
      lastSyncedAt:
        lastSyncByProvider.get("CALENDLY") ??
        meetingLink?.updatedAt ??
        integrationByProvider.get("CALENDLY")?.updatedAt ??
        null,
      lastError: lastErrorByProvider.get("CALENDLY") ?? null,
    },
    {
      id: "cal_dot_com",
      name: "Cal.com",
      detail:
        integrationByProvider.get("CAL_DOT_COM")?.externalEmail ??
        `${getIntegrationPlugin("CAL_DOT_COM")?.label ?? "Cal.com Plugin"} - alternative calendar provider for meeting automation.`,
      status: toCardStatus(integrationByProvider.get("CAL_DOT_COM")?.status),
      href: "/app/investor-os/integrations",
      providerKey: "CAL_DOT_COM",
      providerValue: "CAL_DOT_COM",
      connectFormAction: connectProviderAction,
      disconnectFormAction: disconnectProviderAction,
      lastSyncedAt: lastSyncByProvider.get("CAL_DOT_COM") ?? integrationByProvider.get("CAL_DOT_COM")?.updatedAt ?? null,
      lastError: lastErrorByProvider.get("CAL_DOT_COM") ?? null,
    },
    {
      id: "openclaw",
      name: "OpenClaw",
      detail:
        openClawConnection?.baseUrl ??
        `${getIntegrationPlugin("OPENCLAW")?.label ?? "OpenClaw Plugin"} - Telegram operator bridge and synced communication backend.`,
      status: toCardStatus(openClawConnection?.status),
      href: "/app/founder-os/integrations",
      providerKey: "OPENCLAW",
      lastSyncedAt: openClawConnection?.updatedAt ?? null,
      lastError: lastErrorByProvider.get("OPENCLAW") ?? null,
    },
    {
      id: "telegram",
      name: "Telegram",
      detail:
        telegramWorkspaceCount > 0
          ? `${telegramWorkspaceCount} synced workspace(s)`
          : `${getIntegrationPlugin("TELEGRAM")?.label ?? "Telegram Plugin"} - workspace and thread sync for founder communications.`,
      status: telegramWorkspaceCount > 0 ? "CONNECTED" : toCardStatus(openClawConnection?.status),
      href: "/app/founder-os/integrations",
      providerKey: "TELEGRAM",
      lastError: lastErrorByProvider.get("TELEGRAM") ?? null,
    },
    {
      id: "farcaster",
      name: "Farcaster",
      detail:
        integrationByProvider.get("FARCASTER")?.externalUserId ??
        `${getIntegrationPlugin("FARCASTER")?.label ?? "Farcaster Plugin"} - identity and public signal context.`,
      status: toCardStatus(integrationByProvider.get("FARCASTER")?.status),
      href: "/app/founder-os/integrations",
      providerKey: "FARCASTER",
      providerValue: "FARCASTER",
      connectFormAction: connectProviderAction,
      disconnectFormAction: disconnectProviderAction,
      lastSyncedAt: lastSyncByProvider.get("FARCASTER") ?? integrationByProvider.get("FARCASTER")?.updatedAt ?? null,
      lastError: lastErrorByProvider.get("FARCASTER") ?? null,
    },
    {
      id: "wallet",
      name: "Wallet",
      detail:
        wallets.length > 0
          ? `${wallets.length} wallet(s) linked`
          : `${getIntegrationPlugin("WALLET")?.label ?? "Wallet Plugin"} - trust, identity, and ecosystem presence.`,
      status: wallets.length > 0 ? "CONNECTED" : "DISCONNECTED",
      href: "/app/settings#wallet-connection",
      providerKey: "WALLET",
      lastError: lastErrorByProvider.get("WALLET") ?? null,
    },
    {
      id: "jira",
      name: "Jira",
      detail:
        integrationByProvider.get("JIRA")?.externalEmail ??
        `${getIntegrationPlugin("JIRA")?.label ?? "Jira Plugin"} - issue context for operator-heavy workflows.`,
      status: toCardStatus(integrationByProvider.get("JIRA")?.status),
      href: "/app/founder-os/integrations",
      providerKey: "JIRA",
      providerValue: "JIRA",
      connectFormAction: connectProviderAction,
      disconnectFormAction: disconnectProviderAction,
      lastSyncedAt: lastSyncByProvider.get("JIRA") ?? integrationByProvider.get("JIRA")?.updatedAt ?? null,
      lastError: lastErrorByProvider.get("JIRA") ?? null,
    },
  ];

  const connectedCount = connectorCards.filter((card) => card.status === "CONNECTED").length;

  return (
    <div className="space-y-8 py-8">
      {resolvedSearch.integration_error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Integration error: {safeDecode(resolvedSearch.integration_error)}
        </div>
      ) : null}
      {resolvedSearch.integration && resolvedSearch.integration_status === "connected" ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {resolvedSearch.integration} plugin connected successfully.
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Manage identity, role, workspace defaults, wallets, and every connector that powers automation across Founder OS, Builder OS, and Investor OS.
          </p>
        </div>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="font-semibold text-foreground">{workspaces.length}</p>
            <p>Enabled workspaces</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="font-semibold text-foreground">{connectedCount}</p>
            <p>Connected services</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card px-4 py-3">
            <p className="font-semibold text-foreground">{wallets.length}</p>
            <p>Linked wallets</p>
          </div>
        </div>
      </div>

      <SettingsForm
        currentRole={user.role}
        email={user.email ?? undefined}
        name={user.name ?? undefined}
        username={dbUser?.username ?? undefined}
        founderProfileLocked={Boolean(founderProfile)}
      />

      <section className="rounded-3xl border border-border/50 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Plugin Center</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Role-aware plugins for execution workflows. OAuth plugins connect to providers, native plugins power wallet and OpenClaw/Telegram sync.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form action={runPluginSyncAction}>
              <button
                type="submit"
                className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 transition hover:bg-cyan-500/20"
              >
                Sync Plugins Now
              </button>
            </form>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {connectedCount}/{connectorCards.length} active
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {connectorCards.map((card) => (
            <IntegrationStatusCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      {isFounder ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-border/50 bg-card p-6">
            <h2 className="text-base font-semibold">OpenClaw + Telegram Control</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect your OpenClaw bridge, sync Telegram workspaces, and manage founder communication automation from Settings.
            </p>

            <div className="mt-4 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-xs text-muted-foreground">
              <p>OpenClaw status: <span className="font-medium text-foreground">{openClawConnection?.status ?? "DISCONNECTED"}</span></p>
              <p className="mt-1">Synced Telegram workspaces: <span className="font-medium text-foreground">{telegramWorkspaceCount}</span></p>
            </div>

            <form action={connectOpenClawAction} className="mt-4 space-y-3">
              <input
                name="telegramBotToken"
                type="password"
                placeholder="Telegram bot token"
                className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none ring-cyan-500/50 transition focus:ring-2"
                required
              />
              <input
                name="workspaceExternalId"
                placeholder="Workspace external id (optional)"
                className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none ring-cyan-500/50 transition focus:ring-2"
              />
              <input
                name="baseUrl"
                placeholder="OpenClaw base URL (optional)"
                className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none ring-cyan-500/50 transition focus:ring-2"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
              >
                Connect OpenClaw
              </button>
            </form>

            <div className="mt-3 flex flex-wrap gap-2">
              <form action={syncTelegramThreadsAction}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-lg border border-border/60 bg-background/40 px-3 text-sm font-medium text-foreground transition hover:border-cyan-500/40 hover:text-cyan-200"
                >
                  Sync Telegram Now
                </button>
              </form>
              <form action={disconnectOpenClawAction}>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-lg border border-red-500/30 bg-red-500/5 px-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  Disconnect OpenClaw
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-3xl border border-border/50 bg-card p-6">
            <h2 className="text-base font-semibold">Calendly Link</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Save your meeting link once and keep Founder/Investor meeting flows in sync.
            </p>

            <form action={upsertCalendlyLinkAction} className="mt-4 space-y-3">
              <input
                name="calendlyUrl"
                type="url"
                placeholder="https://calendly.com/your-handle"
                defaultValue={meetingLink?.calendlyUrl ?? ""}
                className="w-full rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm outline-none ring-cyan-500/50 transition focus:ring-2"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
              >
                Save Calendly URL
              </button>
            </form>

            <p className="mt-3 text-xs text-muted-foreground">
              Current value:{" "}
              <span className="font-medium text-foreground">
                {meetingLink?.calendlyUrl ? meetingLink.calendlyUrl : "Not configured"}
              </span>
            </p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="rounded-3xl border border-border/50 bg-card p-6">
          <h2 className="text-base font-semibold">Workspace and access</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {workspaces.length === 0 ? (
              <p className="rounded-2xl border border-border/60 px-4 py-3 text-sm text-muted-foreground">No workspace enabled yet.</p>
            ) : (
              workspaces.map((workspace) => (
                <div key={workspace.id} className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{workspace.workspace}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{workspace.isDefault ? "Default workspace" : "Enabled workspace"}</p>
                </div>
              ))
            )}
          </div>
          <Link href="/app/workspaces" className="mt-4 inline-flex text-sm text-cyan-300 hover:text-cyan-200">
            Open workspace switcher
          </Link>
        </div>

        <WalletConnectionCard
          wallets={wallets.map((wallet) => ({
            id: wallet.id,
            provider: wallet.provider,
            network: wallet.network,
            address: wallet.address,
            isPrimary: wallet.isPrimary,
          }))}
        />
      </section>

      <section className="rounded-3xl border border-border/50 bg-card p-6">
        <h2 className="text-base font-semibold">Quick routes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/app/founder-os/integrations" className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground hover:border-cyan-500/30 hover:text-foreground">
            Founder OS integrations
          </Link>
          <Link href="/app/builder-os/integrations" className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground hover:border-cyan-500/30 hover:text-foreground">
            Builder OS integrations
          </Link>
          <Link href="/app/investor-os/integrations" className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground hover:border-cyan-500/30 hover:text-foreground">
            Investor OS integrations
          </Link>
          <Link href="/app/founder-os/integrations" className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground hover:border-cyan-500/30 hover:text-foreground">
            OpenClaw and Telegram
          </Link>
        </div>
      </section>
    </div>
  );
}
