import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Prisma, type Role } from "@prisma/client";
import { db } from "@/server/db/client";
import { founderModules, osRouteMeta } from "@/lib/os/modules";
import { OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import {
  createMeetingRecord,
  generateFounderMarketInsight,
  requestInvestorIntro,
  saveMarketSignal,
  upsertCalendlyLink,
  upsertCofounderPreferences,
  upsertStartup,
} from "@/app/actions/founder-os";
import { connectAdvisorToProject } from "@/app/actions/advisor";
import { listPitchDeckWorkspaceData } from "@/app/actions/pitchdeck";
import {
  addBuilderRaiseAsk,
  connectOpenClaw,
  createOrUpdateActiveRound,
  sendTelegramReply,
  syncTelegramThreads,
  updateRoundProgress,
  updateRoundStatus,
} from "@/app/actions/founder-os-expansion";
import { calculateCofounderMatchScore } from "@/lib/founder-os";
import { recomputeMyScoresAction } from "@/app/actions/canonical-graph";
import { PitchDeckWorkspace, type DeckRecord as WorkspaceDeckRecord } from "@/components/pitchdeck/PitchDeckWorkspace";
import { EcosystemFeedPanel } from "@/components/ecosystem/EcosystemFeedPanel";
import { TokenomicsStudioClient } from "@/components/tokenomics/TokenomicsStudioClient";
import { FounderOsAccessWarning } from "@/components/os/FounderOsAccessWarning";
import { IntegrationStatusCard, type IntegrationCardModel } from "@/components/integrations/IntegrationStatusCard";

export const metadata = {
  title: "Founder Workspace - Webcoin Labs",
};

function canUseFounderOs(role: Role) {
  return ["FOUNDER", "ADMIN"].includes(role);
}

function isMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function toCardStatus(value: string | null | undefined): IntegrationCardModel["status"] {
  if (value === "CONNECTED" || value === "SYNCING" || value === "ERROR") return value;
  return "DISCONNECTED";
}

type AdvisorDirectoryRow = {
  id: string;
  headline: string | null;
  expertise: string[];
  hourlyRateUsd: number | null;
  user: { name: string | null; username: string | null };
};

type ProjectAdvisorConnectionRow = {
  id: string;
  project: { id: string; name: string };
  advisorProfile: { user: { name: string | null; username: string | null } };
};

export default async function FounderOsAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ app: string }>;
  searchParams?: Promise<{ search?: string; scope?: string }>;
}) {
  const { app } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const deprecatedRouteMap: Record<string, string> = {
    "command-center": "/app/founder-os",
    "launch-readiness": "/app/founder-os/ventures",
    "advisor-connect": "/app/founder-os/investor-connect",
    "data-room": "/app/founder-os/ventures",
    "raise-round": "/app/founder-os/investor-connect",
    meetings: "/app/founder-os/investor-connect",
    "market-intelligence": "/app/founder-os/ecosystem-feed",
    communications: "/app/founder-os/integrations",
  };
  const redirectedRoute = deprecatedRouteMap[app];
  if (redirectedRoute) {
    redirect(redirectedRoute);
  }
  const moduleMeta = founderModules.find((module) => module.slug === app);
  if (!moduleMeta) notFound();

  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!canUseFounderOs(session.user.role)) {
    return <FounderOsAccessWarning reason="Founder OS modules stay locked until you have a founder/company setup." />;
  }

  const [founderProfileGate, ventureCountGate, startupCountGate] = await Promise.all([
    db.founderProfile.findUnique({ where: { userId: session.user.id }, select: { id: true, companyName: true, roleTitle: true } }),
    db.venture.count({ where: { ownerUserId: session.user.id } }),
    db.startup.count({ where: { founderId: session.user.id } }),
  ]);
  const hasFounderClaim = Boolean(founderProfileGate?.companyName?.trim() || founderProfileGate?.roleTitle?.trim() || ventureCountGate > 0 || startupCountGate > 0);
  if (!hasFounderClaim) {
    return <FounderOsAccessWarning reason="Founder modules require either a created company page or a declared founder role tied to your profile." />;
  }

  const [integrationConnections, githubConnection, meetingLink, openClawConnection] = await Promise.all([
    db.integrationConnection.findMany({ where: { userId: session.user.id, status: "CONNECTED" } }),
    db.githubConnection.findUnique({ where: { userId: session.user.id }, select: { id: true, username: true, updatedAt: true } }),
    db.meetingLink.findUnique({ where: { userId: session.user.id }, select: { id: true, calendlyUrl: true, updatedAt: true } }),
    db.openClawConnection.findUnique({ where: { userId: session.user.id }, select: { id: true, createdAt: true } }),
  ]);

  const sharedShell = (
    content: React.ReactNode,
    rightPanel?: React.ReactNode,
  ) => (
    <OsWorkspaceShell
      title={osRouteMeta.FOUNDER.title}
      subtitle={osRouteMeta.FOUNDER.subtitle}
      rootHref={osRouteMeta.FOUNDER.root}
      modules={osRouteMeta.FOUNDER.modules}
      activeSlug={app}
      integrationConnectedCount={integrationConnections.length + (githubConnection ? 1 : 0) + (meetingLink ? 1 : 0)}
      integrationTotalCount={5}
      rightPanel={rightPanel}
    >
      {content}
    </OsWorkspaceShell>
  );

  if (app === "integrations") {
    const [wallets, connections] = await Promise.all([
      db.walletConnection.count({ where: { userId: session.user.id } }),
      db.integrationConnection.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, take: 20 }),
    ]);
    const integrationByProvider = new Map(connections.map((connection) => [connection.provider, connection]));

    const cards: IntegrationCardModel[] = [
      {
        id: "github",
        name: "GitHub",
        detail: githubConnection ? `Connected as ${githubConnection.username}` : "Repository-backed proof and activity sync.",
        status: githubConnection ? "CONNECTED" : toCardStatus(integrationByProvider.get("GITHUB")?.status),
        href: "/app/founder-os/builder-discovery",
        providerKey: "GITHUB",
        lastSyncedAt: githubConnection?.updatedAt ?? integrationByProvider.get("GITHUB")?.updatedAt ?? null,
      },
      {
        id: "calendar",
        name: "Google Calendar / Cal.com",
        detail:
          meetingLink?.calendlyUrl ??
          integrationByProvider.get("GOOGLE_CALENDAR")?.externalEmail ??
          integrationByProvider.get("CAL_DOT_COM")?.externalEmail ??
          "Calendar connector not configured.",
        status:
          meetingLink?.calendlyUrl
            ? "CONNECTED"
            : toCardStatus(integrationByProvider.get("GOOGLE_CALENDAR")?.status ?? integrationByProvider.get("CAL_DOT_COM")?.status),
        href: "/app/founder-os/investor-connect",
        providerKey: "GOOGLE_CALENDAR",
        lastSyncedAt:
          meetingLink?.updatedAt ?? integrationByProvider.get("GOOGLE_CALENDAR")?.updatedAt ?? integrationByProvider.get("CAL_DOT_COM")?.updatedAt ?? null,
      },
      {
        id: "openclaw",
        name: "Telegram Ops",
        detail: openClawConnection ? "OpenClaw connected and ready." : "OpenClaw not connected yet.",
        status: openClawConnection ? "CONNECTED" : "DISCONNECTED",
        href: "/app/founder-os/integrations",
        providerKey: "OPENCLAW",
        lastSyncedAt: openClawConnection?.createdAt ?? null,
      },
      {
        id: "notion",
        name: "Notion",
        detail: integrationByProvider.get("NOTION")?.externalEmail ?? "Docs and operating context sync.",
        status: toCardStatus(integrationByProvider.get("NOTION")?.status),
        href: "/app/founder-os/integrations",
        providerKey: "NOTION",
        lastSyncedAt: integrationByProvider.get("NOTION")?.updatedAt ?? null,
      },
      {
        id: "gmail",
        name: "Gmail",
        detail: integrationByProvider.get("GMAIL")?.externalEmail ?? "Inbox sync for investor and team workflows.",
        status: toCardStatus(integrationByProvider.get("GMAIL")?.status),
        href: "/app/founder-os/integrations",
        providerKey: "GMAIL",
        lastSyncedAt: integrationByProvider.get("GMAIL")?.updatedAt ?? null,
      },
      {
        id: "jira",
        name: "Jira",
        detail: integrationByProvider.get("JIRA")?.externalEmail ?? "Issue and delivery context sync.",
        status: toCardStatus(integrationByProvider.get("JIRA")?.status),
        href: "/app/founder-os/integrations",
        providerKey: "JIRA",
        lastSyncedAt: integrationByProvider.get("JIRA")?.updatedAt ?? null,
      },
      {
        id: "wallet",
        name: "Wallet Identity",
        detail: wallets > 0 ? `${wallets} wallet(s) linked` : "No wallet linked yet.",
        status: wallets > 0 ? "CONNECTED" : "DISCONNECTED",
        href: "/app/settings",
        providerKey: "WALLET",
      },
    ];
    const connectedCardCount = cards.filter((card) => card.status === "CONNECTED").length;

    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Integration Center</p>
          <p className="mt-1 text-xs text-muted-foreground">Connector-first automation setup. Manual fallback fields are hidden from OS dashboards.</p>
          <p className="mt-2 text-xs text-cyan-300">
            {connectedCardCount}/{cards.length} core connectors active
          </p>
        </article>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <IntegrationStatusCard key={card.id} card={card} />
          ))}
        </div>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Connected providers</p>
          {connections.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No providers connected yet. Start with GitHub or Calendar.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {connections.map((connection) => (
                <p key={connection.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {connection.provider} - {connection.status} - Last updated {new Date(connection.updatedAt).toLocaleString()}
                </p>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "ecosystem-feed") {
    return sharedShell(
      <EcosystemFeedPanel
        basePath="/app/founder-os/ecosystem-feed"
        defaultScope="FOUNDER"
        search={resolvedSearch.search}
        scope={resolvedSearch.scope}
        viewerRole={session.user.role}
      />,
    );
  }

  if (app === "meetings") {
    const [networkUsers, startups, meetings] = await Promise.all([
      db.user.findMany({
        where: { id: { not: session.user.id } },
        select: { id: true, name: true, role: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      db.startup.findMany({
        where: { founderId: session.user.id },
        select: { id: true, name: true },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
      db.meetingRecord.findMany({
        where: { hostUserId: session.user.id },
        include: { attendee: { select: { name: true } }, startup: { select: { name: true } } },
        orderBy: { scheduledAt: "asc" },
        take: 15,
      }),
    ]);

    const saveCalendlyAction = async (formData: FormData) => {
      "use server";
      await upsertCalendlyLink(formData);
    };
    const createMeetingAction = async (formData: FormData) => {
      "use server";
      await createMeetingRecord(formData);
    };

    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Calendar sync</p>
          <p className="mt-1 text-xs text-muted-foreground">Meetings are connector-driven. Configure scheduler first, then create contextual meetings.</p>
          <form action={saveCalendlyAction} className="mt-3 flex gap-2">
            <input name="calendlyUrl" defaultValue={meetingLink?.calendlyUrl ?? ""} placeholder="https://calendly.com/your-handle" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">Save</button>
          </form>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Create meeting</p>
          <form action={createMeetingAction} className="mt-2 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input name="title" placeholder="Meeting title" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              <input name="scheduledAt" type="datetime-local" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select name="attendeeUserId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                {networkUsers.map((networkUser) => (
                  <option key={networkUser.id} value={networkUser.id}>
                    {networkUser.name ?? "User"} ({networkUser.role})
                  </option>
                ))}
              </select>
              <select name="startupId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue="">
                <option value="">No startup context</option>
                {startups.map((startup) => (
                  <option key={startup.id} value={startup.id}>{startup.name}</option>
                ))}
              </select>
            </div>
            <textarea name="notes" rows={2} placeholder="Notes" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              Add meeting
            </button>
          </form>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Upcoming meetings</p>
          {meetings.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No meetings scheduled yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {meetings.map((meeting) => (
                <p key={meeting.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {meeting.title} - {new Date(meeting.scheduledAt).toLocaleString()} - {meeting.attendee.name ?? "Attendee"} {meeting.startup ? `-- ${meeting.startup.name}` : ""}
                </p>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "tokenomics") {
    const [ventures, tokenomicsModels] = await Promise.all([
      db.venture.findMany({
        where: { ownerUserId: session.user.id },
        select: { id: true, name: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.tokenomicsModel.findMany({
        where: { createdById: session.user.id },
        include: {
          scenarios: {
            include: {
              allocations: { orderBy: { rowOrder: "asc" } },
              revisions: { orderBy: { revisionNumber: "desc" }, take: 5 },
            },
          },
          venture: { select: { name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

    return sharedShell(
      ventures.length === 0 ? (
        <section className="space-y-4">
          <article className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">Tokenomics Studio</p>
            <p className="mt-1 text-xs text-muted-foreground">
              AI-assisted tokenomics works best once a venture exists, because the draft should be anchored to a real startup context.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Create a venture first to generate and edit tokenomics here.</p>
          </article>
        </section>
      ) : (
        <TokenomicsStudioClient
          ventures={ventures.map((venture) => ({ id: venture.id, name: venture.name }))}
          initialModels={tokenomicsModels.map((model) => ({
            id: model.id,
            name: model.name,
            tokenSymbol: model.tokenSymbol,
            totalSupply: Number(model.totalSupply),
            notes: model.notes,
            ventureName: model.venture.name,
            scenarios: model.scenarios.map((scenario) => ({
              id: scenario.id,
              name: scenario.name,
              revisions: scenario.revisions.map((revision) => ({
                id: revision.id,
                revisionNumber: revision.revisionNumber,
              })),
              allocations: scenario.allocations.map((row) => ({
                id: row.id,
                label: row.label,
                percentage: row.percentage ? Number(row.percentage) : null,
                tokenAmount: row.tokenAmount ? Number(row.tokenAmount) : null,
                cliffMonths: row.cliffMonths,
                vestingMonths: row.vestingMonths,
                unlockCadence: row.unlockCadence,
                notes: row.notes,
              })),
            })),
          }))}
        />
      ),
    );
  }

  if (app === "raise-round") {
    const [ventures, rounds] = await Promise.all([
      db.venture.findMany({
        where: { ownerUserId: session.user.id },
        select: { id: true, name: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.raiseRound.findMany({
        where: { founderUserId: session.user.id, isActive: true },
        include: { builderAsks: true, commitments: true, venture: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    ]);

    const createOrUpdateActiveRoundAction = async (formData: FormData) => {
      "use server";
      await createOrUpdateActiveRound(formData);
    };
    const updateRoundProgressAction = async (formData: FormData) => {
      "use server";
      await updateRoundProgress(formData);
    };
    const updateRoundStatusAction = async (formData: FormData) => {
      "use server";
      await updateRoundStatus(formData);
    };
    const addBuilderRaiseAskAction = async (formData: FormData) => {
      "use server";
      await addBuilderRaiseAsk(formData);
    };

    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Raise Round Manager</p>
          {ventures.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Create a venture first to open a round.</p>
          ) : (
            <form action={createOrUpdateActiveRoundAction} className="mt-2 space-y-2">
              <select name="ventureId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                {ventures.map((venture) => <option key={venture.id} value={venture.id}>{venture.name}</option>)}
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="roundName" placeholder="Round name" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
                <input name="roundType" placeholder="Round type" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input name="targetAmount" type="number" step="0.01" placeholder="Target amount" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
                <input name="raisedAmount" type="number" step="0.01" placeholder="Raised amount" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <input name="currency" defaultValue="USD" placeholder="Currency" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                Save round
              </button>
            </form>
          )}
        </article>
        {rounds.length === 0 ? (
          <article className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm text-muted-foreground">No active rounds yet.</p>
          </article>
        ) : (
          rounds.map((round) => (
            <article key={round.id} className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-sm font-semibold">{round.venture.name} - {round.roundName}</p>
              <p className="text-xs text-muted-foreground">{round.currency} {Number(round.raisedAmount)} / {Number(round.targetAmount)} - {round.status}</p>
              <form action={updateRoundProgressAction} className="mt-2 flex gap-2">
                <input type="hidden" name="roundId" value={round.id} />
                <input name="raisedAmount" type="number" step="0.01" placeholder="Raised amount" className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">Update</button>
              </form>
              <form action={updateRoundStatusAction} className="mt-2 flex gap-2">
                <input type="hidden" name="roundId" value={round.id} />
                <select name="status" defaultValue={round.status} className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">Set status</button>
              </form>
              <form action={addBuilderRaiseAskAction} className="mt-2 space-y-2">
                <input type="hidden" name="roundId" value={round.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="roleTitle" placeholder="Builder role ask" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                  <input name="skillTags" placeholder="Skill tags (comma separated)" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                </div>
                <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">Add builder ask</button>
              </form>
            </article>
          ))
        )}
      </section>,
    );
  }

  if (app === "market-intelligence") {
    const [startups, signals, insights] = await Promise.all([
      db.startup.findMany({ where: { founderId: session.user.id }, select: { id: true, name: true } }),
      db.marketSignal.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      db.founderMarketInsight.findMany({
        where: { founderId: session.user.id },
        include: { startup: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    const saveMarketSignalAction = async (formData: FormData) => {
      "use server";
      await saveMarketSignal(formData);
    };
    const generateMarketInsightAction = async (formData: FormData) => {
      "use server";
      await generateFounderMarketInsight(formData);
    };

    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Signal monitoring rules</p>
          <form action={saveMarketSignalAction} className="mt-2 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input name="source" placeholder="Source" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              <input name="signalType" placeholder="Signal type" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            </div>
            <input name="title" placeholder="Signal title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <textarea name="summary" rows={2} placeholder="Signal summary" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">Save signal</button>
          </form>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Generate insight digest</p>
          <form action={generateMarketInsightAction} className="mt-2 flex gap-2">
            <select name="startupId" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue="">
              <option value="">General insight</option>
              {startups.map((startup) => <option key={startup.id} value={startup.id}>{startup.name}</option>)}
            </select>
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">Generate</button>
          </form>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Latest imported signals</p>
          {signals.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No signals imported yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {signals.slice(0, 8).map((signal) => (
                <p key={signal.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {signal.source} - {signal.title}
                </p>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Insight history</p>
          {insights.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No insights generated yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {insights.map((insight) => (
                <p key={insight.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {(insight.startup?.name ?? "General")} - {insight.founderPainPoints}
                </p>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "communications") {
    const [workspaces, threads] = await Promise.all([
      db.telegramWorkspace.findMany({
        where: { connection: { userId: session.user.id } },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      db.telegramThread.findMany({
        where: { workspace: { connection: { userId: session.user.id } } },
        include: { workspace: true, messages: { take: 4, orderBy: { createdAt: "desc" } } },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

    const connectOpenClawAction = async (formData: FormData) => {
      "use server";
      await connectOpenClaw(formData);
    };
    const syncTelegramThreadsAction = async (formData: FormData) => {
      "use server";
      await syncTelegramThreads(formData);
    };
    const sendTelegramReplyAction = async (formData: FormData) => {
      "use server";
      await sendTelegramReply(formData);
    };

    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Telegram / OpenClaw setup</p>
          <form action={connectOpenClawAction} className="mt-2 space-y-2">
            <input name="telegramBotToken" placeholder="Telegram bot token / OpenClaw token" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input name="workspaceExternalId" placeholder="Workspace external id (optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              {openClawConnection ? "Reconnect" : "Connect"}
            </button>
          </form>
          <form action={syncTelegramThreadsAction} className="mt-2 flex gap-2">
            <select name="workspaceId" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue="">
              <option value="">Default workspace</option>
              {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.title ?? workspace.externalId}</option>)}
            </select>
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">Sync now</button>
          </form>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Synced threads</p>
          {threads.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No synced threads yet. Connect and run sync.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {threads.map((thread) => (
                <div key={thread.id} className="rounded-md border border-border/50 px-3 py-2">
                  <p className="text-sm">{thread.title ?? "Untitled thread"}</p>
                  <p className="text-xs text-muted-foreground">{thread.workspace.title ?? thread.workspace.externalId}</p>
                  <form action={sendTelegramReplyAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="threadId" value={thread.id} />
                    <input name="text" placeholder="Reply" className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">Send</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "pitch-deck") {
    const workspace = await listPitchDeckWorkspaceData(25);
    return sharedShell(
      <PitchDeckWorkspace
        isPremium={workspace.isPremium}
        decks={workspace.decks as unknown as WorkspaceDeckRecord[]}
        projects={workspace.projects}
      />,
    );
  }

  if (app === "builder-discovery") {
    const [cofounderPreferences, builders] = await Promise.all([
      db.cofounderPreferences.findUnique({ where: { userId: session.user.id } }),
      db.builderProfile.findMany({
        where: { publicVisible: true },
        include: { user: { select: { name: true, username: true } } },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);

    const saveCofounderPreferencesAction = async (formData: FormData) => {
      "use server";
      await upsertCofounderPreferences(formData);
    };

    const matches = builders
      .map((builder) => ({
        builder,
        match: calculateCofounderMatchScore({
          preferredRole: cofounderPreferences?.roleWanted,
          skillsNeeded: cofounderPreferences?.skillsNeeded,
          roleTitle: builder.title,
          builderSkills: builder.skills,
          builderOpenTo: builder.openTo,
          builderBio: builder.bio,
        }),
      }))
      .filter((item) => item.match.score > 0)
      .sort((a, b) => b.match.score - a.match.score);

    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Builder discovery preferences</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Define the builder profile you need once, then review ranked matches by execution signal.
          </p>
          <form action={saveCofounderPreferencesAction} className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="roleWanted"
                defaultValue={cofounderPreferences?.roleWanted ?? ""}
                placeholder="Role wanted"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <input
                name="skillsNeeded"
                defaultValue={(cofounderPreferences?.skillsNeeded ?? []).join(", ")}
                placeholder="Skills needed (comma separated)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                name="equityExpectation"
                defaultValue={cofounderPreferences?.equityExpectation ?? ""}
                placeholder="Equity expectation"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                name="timeCommitment"
                defaultValue={cofounderPreferences?.timeCommitment ?? ""}
                placeholder="Time commitment"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                name="remotePreference"
                defaultValue={cofounderPreferences?.remotePreference ?? ""}
                placeholder="Remote preference"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="workingStyle"
              rows={2}
              defaultValue={cofounderPreferences?.workingStyle ?? ""}
              placeholder="Working style preferences"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Save preferences
            </button>
          </form>
        </article>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Public builders</p>
            <p className="mt-1 text-xl font-semibold">{builders.length}</p>
          </article>
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Strong matches</p>
            <p className="mt-1 text-xl font-semibold">{matches.length}</p>
          </article>
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role target</p>
            <p className="mt-1 text-xl font-semibold">{cofounderPreferences?.roleWanted ?? "Not set"}</p>
          </article>
        </div>

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Top matches</p>
          {matches.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No strong matches yet. Refine skills and role criteria.</p>
          ) : (
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {matches.slice(0, 8).map((item) => (
                <div key={item.builder.id} className="rounded-md border border-border/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.builder.user.name ?? "Builder"}</p>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] text-cyan-200">
                      {item.match.score}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.builder.title ?? item.builder.headline ?? "Builder profile"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(item.builder.skills ?? []).slice(0, 4).join(", ") || "No skill tags"}
                  </p>
                  {item.builder.user.username ? (
                    <Link
                      href={`/builder/${item.builder.user.username}`}
                      className="mt-2 inline-flex text-xs text-cyan-300"
                    >
                      Open public profile
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "investor-connect") {
    const [startups, investors, intros] = await Promise.all([
      db.startup.findMany({
        where: { founderId: session.user.id },
        select: { id: true, name: true },
      }),
      db.investor.findMany({
        include: { user: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
      db.investorIntroRequest.findMany({
        where: { founderId: session.user.id },
        include: { startup: { select: { name: true } }, investor: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
    ]);

    const requestInvestorIntroAction = async (formData: FormData) => {
      "use server";
      await requestInvestorIntro(formData);
    };
    const introStatusCounts = intros.reduce<Record<string, number>>((acc, intro) => {
      acc[intro.status] = (acc[intro.status] ?? 0) + 1;
      return acc;
    }, {});

    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Request intro</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Send structured investor intro requests tied to a specific startup page.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              Startups ready: <span className="font-semibold text-foreground">{startups.length}</span>
            </div>
            <div className="rounded-md border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              Investors available: <span className="font-semibold text-foreground">{investors.length}</span>
            </div>
            <div className="rounded-md border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground">
              Intro requests: <span className="font-semibold text-foreground">{intros.length}</span>
            </div>
          </div>
          {startups.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Create a startup first to request intros.</p>
          ) : (
            <form action={requestInvestorIntroAction} className="mt-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <select name="startupId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                  {startups.map((startup) => <option key={startup.id} value={startup.id}>{startup.name}</option>)}
                </select>
                <select name="investorUserId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                  {investors.map((investor) => (
                    <option key={investor.userId} value={investor.userId}>
                      {(investor.user.name ?? "Investor")} - {investor.fundName}
                    </option>
                  ))}
                </select>
              </div>
              <textarea name="founderNote" rows={2} placeholder="Context for intro request" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">Request intro</button>
            </form>
          )}
        </article>
        {Object.keys(introStatusCounts).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(introStatusCounts).map(([status, count]) => (
              <article key={status} className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{status}</p>
                <p className="mt-1 text-xl font-semibold">{count}</p>
              </article>
            ))}
          </div>
        ) : null}
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Intro pipeline</p>
          {intros.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No intro requests yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {intros.map((intro) => (
                <div key={intro.id} className="rounded-md border border-border/50 px-3 py-2">
                  <p className="text-sm text-foreground">
                    {intro.startup.name} {"->"} {intro.investor.user.name ?? intro.investor.fundName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {intro.status} {" - "} {new Date(intro.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "advisor-connect") {
    const projects = await db.project.findMany({
      where: { ownerUserId: session.user.id },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    });

    let advisors: AdvisorDirectoryRow[] = [];
    let connections: ProjectAdvisorConnectionRow[] = [];
    let advisorStorageReady = true;
    try {
      [advisors, connections] = await Promise.all([
        db.advisorProfile.findMany({
          where: { publicVisible: true },
          select: {
            id: true,
            headline: true,
            expertise: true,
            hourlyRateUsd: true,
            user: { select: { name: true, username: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 60,
        }) as Promise<AdvisorDirectoryRow[]>,
        db.projectAdvisorConnection.findMany({
          where: { project: { ownerUserId: session.user.id } },
          include: {
            project: { select: { id: true, name: true } },
            advisorProfile: { include: { user: { select: { name: true, username: true } } } },
          },
          orderBy: { createdAt: "desc" },
          take: 80,
        }) as Promise<ProjectAdvisorConnectionRow[]>,
      ]);
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
      advisorStorageReady = false;
      advisors = [];
      connections = [];
    }

    const connectAdvisorAction = async (formData: FormData) => {
      "use server";
      await connectAdvisorToProject(formData);
    };

    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Connect advisor to project</p>
          {!advisorStorageReady ? (
            <p className="mt-2 text-sm text-amber-300">
              Advisor module is not initialized yet. Run Prisma migration to create advisor tables, then refresh.
            </p>
          ) : projects.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Create a project first before connecting advisors.</p>
          ) : advisors.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No advisor profiles available yet. Admin can invite advisors from /app/admin/advisors.</p>
          ) : (
            <form action={connectAdvisorAction} className="mt-2 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <select name="projectId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <select name="advisorProfileId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                  {advisors.map((advisor) => (
                    <option key={advisor.id} value={advisor.id}>
                      {(advisor.user.name ?? advisor.user.username ?? "Advisor")} {advisor.hourlyRateUsd ? `($${advisor.hourlyRateUsd}/hr)` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                Connect advisor
              </button>
            </form>
          )}
        </article>

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Advisor directory</p>
          {advisors.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No public advisors yet.</p>
          ) : (
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {advisors.slice(0, 24).map((advisor) => (
                <div key={advisor.id} className="rounded-md border border-border/50 p-3">
                  <p className="text-sm font-medium">{advisor.user.name ?? advisor.user.username ?? "Advisor"}</p>
                  <p className="text-xs text-muted-foreground">{advisor.headline ?? "Advisor profile"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(advisor.expertise ?? []).slice(0, 3).join(", ") || "No expertise tags"}
                    {advisor.hourlyRateUsd ? ` - $${advisor.hourlyRateUsd}/hr` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Current project advisors</p>
          {connections.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No advisors connected yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {connections.map((connection) => (
                <p key={connection.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {connection.project.name} - {connection.advisorProfile.user.name ?? connection.advisorProfile.user.username ?? "Advisor"}
                </p>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "ventures") {
    const [ventures, startups] = await Promise.all([
      db.venture.findMany({
        where: { ownerUserId: session.user.id },
        select: { id: true, name: true, stage: true, chainEcosystem: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      db.startup.findMany({
        where: { founderId: session.user.id },
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          stage: true,
          chainFocus: true,
          isHiring: true,
          website: true,
          githubRepo: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);
    const saveStartupAction = async (formData: FormData) => {
      "use server";
      await upsertStartup(formData);
    };
    return sharedShell(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Startup Layer</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create and maintain your startup profile with clear stage, chain, links, and fundraising context.
          </p>
          <form action={saveStartupAction} className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="name"
                placeholder="Startup name"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <input
                name="tagline"
                placeholder="One-line tagline"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <select name="stage" defaultValue="IDEA" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="IDEA">IDEA</option>
                <option value="MVP">MVP</option>
                <option value="EARLY">EARLY</option>
                <option value="GROWTH">GROWTH</option>
              </select>
              <select name="chainFocus" defaultValue="ARC" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="ARC">ARC</option>
                <option value="SOLANA">SOLANA</option>
                <option value="BASE">BASE</option>
                <option value="ETHEREUM">ETHEREUM</option>
              </select>
              <input
                name="revenue"
                placeholder="Revenue/status (optional)"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <textarea
              name="description"
              rows={2}
              placeholder="What are you building?"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="website"
                placeholder="Website URL"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                name="githubRepo"
                placeholder="GitHub repository URL"
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              Save startup
            </button>
          </form>
        </article>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Startups</p>
            <p className="mt-1 text-xl font-semibold">{startups.length}</p>
          </article>
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Venture records</p>
            <p className="mt-1 text-xl font-semibold">{ventures.length}</p>
          </article>
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hiring startups</p>
            <p className="mt-1 text-xl font-semibold">{startups.filter((startup) => startup.isHiring).length}</p>
          </article>
        </div>

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Startup pages</p>
          {startups.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No startup pages yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {startups.map((startup) => (
                <div key={startup.id} className="rounded-md border border-border/50 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{startup.name}</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {startup.stage}
                      </span>
                      <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {startup.chainFocus}
                      </span>
                    </div>
                  </div>
                  {startup.tagline ? <p className="mt-1 text-xs text-muted-foreground">{startup.tagline}</p> : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <Link
                      href={`/startups/${startup.slug ?? startup.id}`}
                      className="text-cyan-300 hover:text-cyan-200"
                    >
                      Open public page
                    </Link>
                    {startup.website ? (
                      <a href={startup.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        Website
                      </a>
                    ) : null}
                    {startup.githubRepo ? (
                      <a href={startup.githubRepo} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        Repo
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Linked venture records</p>
          {ventures.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No venture records yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {ventures.map((venture) => (
                <Link
                  key={venture.id}
                  href={`/app/founder-os/ventures/${venture.id}`}
                  className="block rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {venture.name} - {venture.stage ?? "Stage"} - {venture.chainEcosystem ?? "Chain"} - Updated{" "}
                  {new Date(venture.updatedAt).toLocaleDateString()}
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "launch-readiness") {
    const latestFounderSnapshot = await db.scoreSnapshot.findFirst({
      where: { kind: "FOUNDER_LAUNCH_READINESS", scoredUserId: session.user.id },
      orderBy: { computedAt: "desc" },
    });
    const recomputeFounderScoreAction = async (formData: FormData) => {
      "use server";
      await recomputeMyScoresAction(formData);
    };
    return sharedShell(
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Launch readiness snapshot</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {latestFounderSnapshot
            ? `Latest: ${latestFounderSnapshot.score} (${latestFounderSnapshot.label ?? "n/a"}) at ${new Date(latestFounderSnapshot.computedAt).toLocaleString()}`
            : "No snapshot found yet."}
        </p>
        <form action={recomputeFounderScoreAction} className="mt-3">
          <input type="hidden" name="scope" value="founder" />
          <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
            Recompute readiness
          </button>
        </form>
      </section>,
    );
  }

  return sharedShell(
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">{moduleMeta.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{moduleMeta.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        This module was simplified into focused founder workflows. Use one of the primary surfaces below.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Link href="/app/founder-os/ventures" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Startup Layer
        </Link>
        <Link href="/app/founder-os/pitch-deck" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Pitch Deck Analysis
        </Link>
        <Link href="/app/founder-os/tokenomics" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Tokenomics Studio
        </Link>
        <Link href="/app/founder-os/investor-connect" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Investor Discovery
        </Link>
      </div>
    </section>,
  );
}


