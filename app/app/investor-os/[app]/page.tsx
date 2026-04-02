import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { investorModules, osRouteMeta } from "@/lib/os/modules";
import { OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import { createDiligenceMemoAction } from "@/app/actions/canonical-graph";
import { EcosystemFeedPanel } from "@/components/ecosystem/EcosystemFeedPanel";
import { listStartupHubCards } from "@/lib/startup-hub";
import { IntegrationStatusCard, type IntegrationCardModel } from "@/components/integrations/IntegrationStatusCard";

export const metadata = { title: "Investor Workspace - Webcoin Labs" };

function toCardStatus(value: string | null | undefined): IntegrationCardModel["status"] {
  if (value === "CONNECTED" || value === "SYNCING" || value === "ERROR") return value;
  return "DISCONNECTED";
}

export default async function InvestorOsAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ app: string }>;
  searchParams?: Promise<{ search?: string; scope?: string }>;
}) {
  const { app } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const deprecatedRouteMap: Record<string, string> = {
    memos: "/app/investor-os/diligence",
    watchlist: "/app/investor-os/deal-flow",
    "portfolio-support": "/app/investor-os/diligence",
    "thesis-settings": "/app/investor-os/diligence",
    meetings: "/app/investor-os/integrations",
  };
  const redirectedRoute = deprecatedRouteMap[app];
  if (redirectedRoute) {
    redirect(redirectedRoute);
  }
  const moduleMeta = investorModules.find((module) => module.slug === app);
  if (!moduleMeta) notFound();

  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!["INVESTOR", "ADMIN"].includes(session.user.role)) redirect("/app");

  const integrationConnections = await db.integrationConnection.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  const connectedIntegrationsCount = integrationConnections.filter((item) => item.status === "CONNECTED").length;

  const wrap = (content: React.ReactNode) => (
    <OsWorkspaceShell
      title={osRouteMeta.INVESTOR.title}
      subtitle={osRouteMeta.INVESTOR.subtitle}
      rootHref={osRouteMeta.INVESTOR.root}
      modules={osRouteMeta.INVESTOR.modules}
      activeSlug={app}
      integrationConnectedCount={connectedIntegrationsCount}
      integrationTotalCount={4}
    >
      {content}
    </OsWorkspaceShell>
  );

  if (app === "deal-flow") {
    const applications = await db.investorApplication.findMany({
      where: session.user.role === "ADMIN" ? undefined : { investorUserId: session.user.id },
      include: { venture: { select: { id: true, name: true } }, founder: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    const statusCounts = applications.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    const statusSummary = Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Deal flow inbox</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Review founder applications with score context, then move high-signal ventures into diligence.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
              {applications.length} total applications
            </span>
            <Link
              href="/app/investor-os/ventures"
              className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open startup discovery
            </Link>
            <Link
              href="/app/investor-os/diligence"
              className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Open diligence
            </Link>
          </div>
        </article>

        {statusSummary.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statusSummary.map(([status, count]) => (
              <article key={status} className="rounded-xl border border-border/60 bg-card p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{status}</p>
                <p className="mt-1 text-xl font-semibold">{count}</p>
              </article>
            ))}
          </div>
        ) : null}

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Recent applications</p>
          {applications.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No deal-flow items yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {applications.map((item) => (
                <div key={item.id} className="rounded-md border border-border/50 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.venture.name}</p>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Founder: {item.founder.name ?? "Founder"}
                    {" - "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  {(item.readinessScore !== null || item.investorFitScore !== null) ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Readiness: {item.readinessScore ?? "N/A"}
                      {" - "}
                      Fit: {item.investorFitScore ?? "N/A"}
                    </p>
                  ) : null}
                  <div className="mt-2">
                    <Link
                      href={`/app/investor-os/ventures/${item.venture.id}`}
                      className="text-xs text-cyan-300 hover:text-cyan-200"
                    >
                      Open venture review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "ecosystem-feed") {
    return wrap(
      <EcosystemFeedPanel
        basePath="/app/investor-os/ecosystem-feed"
        defaultScope="INVESTOR"
        search={resolvedSearch.search}
        scope={resolvedSearch.scope}
        viewerRole={session.user.role}
      />,
    );
  }

  if (app === "ventures") {
    const startups = await listStartupHubCards({ take: 30 });
    const withDeck = startups.filter((startup) => Boolean(startup.githubRepo)).length;
    const hiringCount = startups.filter((startup) => startup.isHiring).length;
    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Startup discovery</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover active ventures, inspect founder and builder signal, then move high-fit teams to diligence.
          </p>
        </article>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Public startups</p>
            <p className="mt-1 text-xl font-semibold">{startups.length}</p>
          </article>
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hiring now</p>
            <p className="mt-1 text-xl font-semibold">{hiringCount}</p>
          </article>
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Repo-linked</p>
            <p className="mt-1 text-xl font-semibold">{withDeck}</p>
          </article>
          <article className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ready for review</p>
            <p className="mt-1 text-xl font-semibold">
              {startups.filter((startup) => startup.ratingCount > 0 || Boolean(startup.githubRepo)).length}
            </p>
          </article>
        </div>

        {startups.length === 0 ? (
          <article className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm text-muted-foreground">No public startups available.</p>
          </article>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {startups.map((startup) => (
              <article key={startup.startupId} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{startup.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {startup.founderName}
                      {startup.founderCompanyName ? ` - ${startup.founderCompanyName}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {startup.stage ?? "Stage"}
                    </span>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {startup.chain ?? "Chain"}
                    </span>
                    {startup.isHiring ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">
                        Hiring
                      </span>
                    ) : null}
                  </div>
                </div>
                {startup.tagline ? <p className="mt-2 text-sm text-muted-foreground">{startup.tagline}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={startup.ventureId ? `/app/investor-os/ventures/${startup.ventureId}` : `/startups/${startup.slugOrId}`}
                    className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200"
                  >
                    Open review
                  </Link>
                  {startup.website ? (
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Website
                    </a>
                  ) : null}
                  {startup.githubRepo ? (
                    <a
                      href={startup.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Repo
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>,
    );
  }

  if (app === "diligence" || app === "memos") {
    const ventures = await db.venture.findMany({
      where: { isPublic: true },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    const memos = await db.diligenceMemo.findMany({
      where: { authorUserId: session.user.id },
      include: { venture: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    const createDiligenceMemoFormAction = async (formData: FormData) => {
      "use server";
      await createDiligenceMemoAction(formData);
    };

    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Create diligence memo</p>
          {ventures.length === 0 ? (
            <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
              No public ventures available yet. Open startup discovery first.
              <div className="mt-2">
                <Link
                  href="/app/investor-os/ventures"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs"
                >
                  Open startup discovery
                </Link>
              </div>
            </div>
          ) : (
            <form action={createDiligenceMemoFormAction} className="mt-3 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  name="ventureId"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {ventures.map((venture) => (
                    <option key={venture.id} value={venture.id}>
                      {venture.name}
                    </option>
                  ))}
                </select>
                <input
                  name="title"
                  placeholder="Memo title"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>

              <textarea
                name="summary"
                rows={2}
                placeholder="Executive summary"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <textarea
                  name="product"
                  rows={3}
                  placeholder="Product assessment"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <textarea
                  name="market"
                  rows={3}
                  placeholder="Market assessment"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <textarea
                  name="team"
                  rows={3}
                  placeholder="Team assessment"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <textarea
                  name="traction"
                  rows={3}
                  placeholder="Traction signals"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <textarea
                name="risks"
                rows={2}
                placeholder="Core risks and open questions"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />

              <div className="grid gap-3 md:grid-cols-3">
                <input
                  name="riskLegal"
                  placeholder="Legal risk note"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  name="riskSecurity"
                  placeholder="Security risk note"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <input
                  name="riskGovernance"
                  placeholder="Governance risk note"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>

              <button
                type="submit"
                className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
              >
                Save diligence memo
              </button>
            </form>
          )}
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Memo history</p>
          {memos.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No memos yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {memos.map((memo) => (
                <div key={memo.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{memo.title}</p>
                    <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] uppercase tracking-wide">
                      {memo.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs">
                    {memo.venture.name}{" "}
                    {" - "}
                    {new Date(memo.updatedAt).toLocaleDateString()}
                  </p>
                  {memo.summary ? <p className="mt-1 text-xs">{memo.summary}</p> : null}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "meetings") {
    const meetings = await db.workspaceMeeting.findMany({
      where: { hostUserId: session.user.id },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    });
    return wrap(
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Meetings workspace</p>
        {meetings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No meetings scheduled yet.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {meetings.map((meeting) => (
              <p key={meeting.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                {meeting.title} - {new Date(meeting.scheduledAt).toLocaleString()}
              </p>
            ))}
          </div>
        )}
      </section>,
    );
  }

  if (app === "integrations") {
    const [wallets, meetingLink] = await Promise.all([
      db.walletConnection.count({ where: { userId: session.user.id } }),
      db.meetingLink.findUnique({ where: { userId: session.user.id }, select: { calendlyUrl: true, updatedAt: true } }),
    ]);
    const integrationByProvider = new Map(integrationConnections.map((connection) => [connection.provider, connection]));
    const cards: IntegrationCardModel[] = [
      {
        id: "gmail",
        name: "Gmail",
        detail: integrationByProvider.get("GMAIL")?.externalEmail ?? "Mail sync for outreach and investor communication.",
        status: toCardStatus(integrationByProvider.get("GMAIL")?.status),
        href: "/app/settings",
        providerKey: "GMAIL",
        lastSyncedAt: integrationByProvider.get("GMAIL")?.updatedAt ?? null,
      },
      {
        id: "google_calendar",
        name: "Google Calendar",
        detail: integrationByProvider.get("GOOGLE_CALENDAR")?.externalEmail ?? "Calendar data for diligence and meeting context.",
        status: toCardStatus(integrationByProvider.get("GOOGLE_CALENDAR")?.status),
        href: "/app/settings",
        providerKey: "GOOGLE_CALENDAR",
        lastSyncedAt: integrationByProvider.get("GOOGLE_CALENDAR")?.updatedAt ?? null,
      },
      {
        id: "calendly",
        name: "Calendly",
        detail: meetingLink?.calendlyUrl ?? "Scheduling link for founder and investor intros.",
        status: meetingLink?.calendlyUrl ? "CONNECTED" : toCardStatus(integrationByProvider.get("CALENDLY")?.status),
        href: "/app/settings",
        providerKey: "CALENDLY",
        lastSyncedAt: meetingLink?.updatedAt ?? integrationByProvider.get("CALENDLY")?.updatedAt ?? null,
      },
      {
        id: "cal_dot_com",
        name: "Cal.com",
        detail: integrationByProvider.get("CAL_DOT_COM")?.externalEmail ?? "Alternative calendar provider for scheduling.",
        status: toCardStatus(integrationByProvider.get("CAL_DOT_COM")?.status),
        href: "/app/settings",
        providerKey: "CAL_DOT_COM",
        lastSyncedAt: integrationByProvider.get("CAL_DOT_COM")?.updatedAt ?? null,
      },
      {
        id: "notion",
        name: "Notion",
        detail: integrationByProvider.get("NOTION")?.externalEmail ?? "Sync diligence notes and references from Notion.",
        status: toCardStatus(integrationByProvider.get("NOTION")?.status),
        href: "/app/settings",
        providerKey: "NOTION",
        lastSyncedAt: integrationByProvider.get("NOTION")?.updatedAt ?? null,
      },
      {
        id: "wallet",
        name: "Wallet",
        detail: wallets > 0 ? `${wallets} wallet(s) linked` : "No wallet linked yet.",
        status: wallets > 0 ? "CONNECTED" : "DISCONNECTED",
        href: "/app/settings",
        providerKey: "WALLET",
      },
    ];
    const connectedCardCount = cards.filter((card) => card.status === "CONNECTED").length;
    const latestConnections = integrationConnections.slice(0, 12);

    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Integration Center</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lightweight investor workflows rely on connector health, not manual data entry.
          </p>
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
          <p className="text-sm font-semibold">Provider status</p>
          {latestConnections.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No provider status records yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {latestConnections.map((connection) => (
                <p
                  key={connection.id}
                  className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground"
                >
                  {connection.provider} - {connection.status}
                </p>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  return wrap(
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">{moduleMeta.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{moduleMeta.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        This module was simplified into focused investor workflows. Use one of the primary surfaces below.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Link href="/app/investor-os/ventures" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Startup Discovery
        </Link>
        <Link href="/app/investor-os/deal-flow" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Deal Flow
        </Link>
        <Link href="/app/investor-os/diligence" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Diligence
        </Link>
        <Link href="/app/investor-os/integrations" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Integrations
        </Link>
      </div>
    </section>,
  );
}
