import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  Blocks,
  CalendarClock,
  CircleOff,
  FolderKanban,
  Github,
  Mail,
  MessageSquareShare,
  NotepadText,
  Orbit,
  Radio,
  ShieldCheck,
  Wallet,
  Workflow,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { SettingsForm } from "@/components/app/SettingsForm";
import { WalletConnectionCard } from "@/components/app/WalletConnectionCard";
import { db } from "@/server/db/client";

type ConnectorCard = {
  name: string;
  detail: string;
  state: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
};

function statusTone(state: string) {
  if (state === "CONNECTED") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (state === "ERROR") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return "border-border/60 bg-background text-muted-foreground";
}

function trimAddress(address: string) {
  if (address.length <= 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export const metadata = { title: "Settings - Webcoin Labs" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;

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
  ] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { username: true } }),
    db.founderProfile.findUnique({ where: { userId: user.id }, select: { id: true } }),
    db.userWorkspace.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    db.walletConnection.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    db.integrationConnection.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    db.githubConnection.findUnique({ where: { userId: user.id } }),
    db.openClawConnection.findUnique({ where: { userId: user.id } }),
    db.meetingLink.findUnique({ where: { userId: user.id } }),
    db.telegramWorkspace.count({ where: { connection: { userId: user.id } } }),
  ]);

  const integrationByProvider = new Map(integrations.map((item) => [item.provider, item]));
  const connectorCards: ConnectorCard[] = [
    {
      name: "GitHub",
      detail: githubConnection ? `Connected as ${githubConnection.username}` : "Repository-backed proof and activity sync.",
      state: githubConnection ? "CONNECTED" : integrationByProvider.get("GITHUB")?.status ?? "DISCONNECTED",
      href: "/app/builder-os/github",
      icon: Github,
      accent: "from-slate-500/20 to-slate-500/5",
    },
    {
      name: "Notion",
      detail: integrationByProvider.get("NOTION")?.externalEmail ?? "Knowledge sync for memos, docs, and operating context.",
      state: integrationByProvider.get("NOTION")?.status ?? "DISCONNECTED",
      href: "/app/founder-os/integrations",
      icon: NotepadText,
      accent: "from-neutral-500/20 to-neutral-500/5",
    },
    {
      name: "Gmail",
      detail: integrationByProvider.get("GMAIL")?.externalEmail ?? "Email thread context and outreach continuity.",
      state: integrationByProvider.get("GMAIL")?.status ?? "DISCONNECTED",
      href: "/app/investor-os/integrations",
      icon: Mail,
      accent: "from-rose-500/20 to-rose-500/5",
    },
    {
      name: "Google Calendar",
      detail: integrationByProvider.get("GOOGLE_CALENDAR")?.externalEmail ?? "Meeting context, scheduling, and workflow follow-through.",
      state: integrationByProvider.get("GOOGLE_CALENDAR")?.status ?? "DISCONNECTED",
      href: "/app/founder-os/meetings",
      icon: CalendarClock,
      accent: "from-blue-500/20 to-blue-500/5",
    },
    {
      name: "Calendly",
      detail: meetingLink?.calendlyUrl ?? "Scheduling link used by founder and investor meeting flows.",
      state: meetingLink?.calendlyUrl ? "CONNECTED" : integrationByProvider.get("CALENDLY")?.status ?? "DISCONNECTED",
      href: "/app/founder-os/meetings",
      icon: Workflow,
      accent: "from-cyan-500/20 to-cyan-500/5",
    },
    {
      name: "Cal.com",
      detail: integrationByProvider.get("CAL_DOT_COM")?.externalEmail ?? "Alternative calendar provider for meeting automation.",
      state: integrationByProvider.get("CAL_DOT_COM")?.status ?? "DISCONNECTED",
      href: "/app/investor-os/integrations",
      icon: CalendarClock,
      accent: "from-sky-500/20 to-sky-500/5",
    },
    {
      name: "OpenClaw",
      detail: openClawConnection?.baseUrl ?? "Telegram operator bridge and synced communications backend.",
      state: openClawConnection?.status ?? "DISCONNECTED",
      href: "/app/founder-os/communications",
      icon: MessageSquareShare,
      accent: "from-orange-500/20 to-orange-500/5",
    },
    {
      name: "Telegram",
      detail: telegramWorkspaceCount > 0 ? `${telegramWorkspaceCount} synced workspace(s)` : "Workspace and thread sync for founder communications.",
      state: telegramWorkspaceCount > 0 ? "CONNECTED" : openClawConnection?.status ?? "DISCONNECTED",
      href: "/app/founder-os/communications",
      icon: Radio,
      accent: "from-indigo-500/20 to-indigo-500/5",
    },
    {
      name: "Farcaster",
      detail: integrationByProvider.get("FARCASTER")?.externalUserId ?? "Identity and public signal context.",
      state: integrationByProvider.get("FARCASTER")?.status ?? "DISCONNECTED",
      href: "/app/founder-os/integrations",
      icon: Orbit,
      accent: "from-violet-500/20 to-violet-500/5",
    },
    {
      name: "Wallet",
      detail: wallets.length > 0 ? `${wallets.length} wallet(s) linked` : "Trust, identity, and ecosystem presence.",
      state: wallets.length > 0 ? "CONNECTED" : "DISCONNECTED",
      href: "/app/settings",
      icon: Wallet,
      accent: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      name: "Jira",
      detail: integrationByProvider.get("JIRA")?.externalEmail ?? "Project and issue context for operator-heavy workflows.",
      state: integrationByProvider.get("JIRA")?.status ?? "DISCONNECTED",
      href: "/app/founder-os/integrations",
      icon: Blocks,
      accent: "from-yellow-500/20 to-yellow-500/5",
    },
  ];

  return (
    <div className="space-y-8 py-8">
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
            <p className="font-semibold text-foreground">{connectorCards.filter((card) => card.state === "CONNECTED").length}</p>
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
            <h2 className="text-lg font-semibold">Connector Center</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every connector the product currently depends on. Connect each one to unlock full automation.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            {connectorCards.filter((card) => card.state === "CONNECTED").length}/{connectorCards.length} active
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {connectorCards.map((card) => {
            const Icon = card.icon;
            const isConnected = card.state === "CONNECTED";
            return (
              <div
                key={card.name}
                className="flex flex-col rounded-[28px] border border-border/60 bg-background/50 p-5 transition hover:border-border/90"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br ${card.accent}`}>
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-medium"
                    style={{
                      backgroundColor: isConnected ? "rgba(16,185,129,0.1)" : "rgba(113,113,122,0.1)",
                      color: isConnected ? "#6ee7b7" : "#71717a",
                      border: `0.5px solid ${isConnected ? "rgba(16,185,129,0.3)" : "#27272a"}`,
                    }}
                  >
                    {isConnected ? "● Connected" : "○ Disconnected"}
                  </span>
                </div>

                {/* Name + detail */}
                <p className="mt-4 text-base font-semibold text-foreground">{card.name}</p>
                <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">{card.detail}</p>

                {/* Connect / Manage action */}
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={card.href}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: isConnected ? "rgba(39,39,42,0.6)" : "rgba(109,40,217,0.15)",
                      border: `0.5px solid ${isConnected ? "#27272a" : "#4c1d95"}`,
                      color: isConnected ? "#a1a1aa" : "#a78bfa",
                    }}
                  >
                    {isConnected ? "Manage" : "Connect →"}
                  </Link>
                  {isConnected && (
                    <span className="text-[11px]" style={{ color: "#34d399" }}>
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
          <Link href="/app/founder-os/communications" className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-sm text-muted-foreground hover:border-cyan-500/30 hover:text-foreground">
            OpenClaw and Telegram
          </Link>
        </div>
      </section>
    </div>
  );
}
