import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, Github, PlugZap, Unplug } from "lucide-react";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { builderModules, osRouteMeta } from "@/lib/os/modules";
import { OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import { EcosystemFeedPanel } from "@/components/ecosystem/EcosystemFeedPanel";
import { connectBuilderGithub, disconnectBuilderGithub } from "@/app/actions/builder-github";
import { IntegrationStatusCard, type IntegrationCardModel } from "@/components/integrations/IntegrationStatusCard";

export const metadata = { title: "Builder Workspace - Webcoin Labs" };

function toCardStatus(value: string | null | undefined): IntegrationCardModel["status"] {
  if (value === "CONNECTED" || value === "SYNCING" || value === "ERROR") return value;
  return "DISCONNECTED";
}

export default async function BuilderOsAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ app: string }>;
  searchParams?: Promise<{ search?: string; scope?: string }>;
}) {
  const { app } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const deprecatedRouteMap: Record<string, string> = {
    "resume-lab": "/app/builder-os/proof-profile",
    "cover-letters": "/app/builder-os/opportunities",
    "work-log": "/app/builder-os/projects",
    references: "/app/builder-os/proof-profile",
  };
  const redirectedRoute = deprecatedRouteMap[app];
  if (redirectedRoute) {
    redirect(redirectedRoute);
  }
  const moduleMeta = builderModules.find((module) => module.slug === app);
  if (!moduleMeta) notFound();

  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!["BUILDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const [connectedIntegrationCount, githubConnection] = await Promise.all([
    db.integrationConnection.count({
      where: { userId: session.user.id, status: "CONNECTED" },
    }),
    db.githubConnection.findUnique({
      where: { userId: session.user.id },
      select: { id: true, username: true, updatedAt: true, profileUrl: true },
    }),
  ]);

  const connectGithubAction = async (formData: FormData) => {
    "use server";
    await connectBuilderGithub(formData);
  };
  const disconnectGithubAction = async () => {
    "use server";
    await disconnectBuilderGithub();
  };

  const wrap = (content: React.ReactNode) => (
    <OsWorkspaceShell
      title={osRouteMeta.BUILDER.title}
      subtitle={osRouteMeta.BUILDER.subtitle}
      rootHref={osRouteMeta.BUILDER.root}
      modules={osRouteMeta.BUILDER.modules}
      activeSlug={app}
      integrationConnectedCount={connectedIntegrationCount + (githubConnection ? 1 : 0)}
      integrationTotalCount={4}
    >
      {content}
    </OsWorkspaceShell>
  );

  if (app === "projects") {
    const projects = await db.builderProject.findMany({
      where: { builderId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    return wrap(
      <section className="space-y-4">
        {!githubConnection ? (
          <article className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold text-foreground">Connect GitHub for automation-first project import</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect once, scan repos, and select what to publish instead of filling long manual project forms.
            </p>
            <form action={connectGithubAction} className="mt-3 flex flex-wrap items-center gap-2">
              <input
                name="username"
                placeholder="GitHub username"
                className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
              >
                <PlugZap className="h-3.5 w-3.5" />
                Connect GitHub
              </button>
            </form>
          </article>
        ) : null}
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Projects workspace</p>
          {projects.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No projects yet. Add your first project in Builder Projects.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/app/builder-os/projects/${project.id}`}
                  className="block rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {project.title} {project.githubUrl ? "- GitHub linked" : ""}
                </Link>
              ))}
            </div>
          )}
          <Link href="/app/builder-projects" className="mt-3 inline-flex text-xs text-cyan-300">
            Open full project manager
          </Link>
        </article>
      </section>,
    );
  }

  if (app === "ecosystem-feed") {
    return wrap(
      <EcosystemFeedPanel
        basePath="/app/builder-os/ecosystem-feed"
        defaultScope="BUILDER"
        search={resolvedSearch.search}
        scope={resolvedSearch.scope}
        viewerRole={session.user.role}
      />,
    );
  }

  if (app === "github") {
    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-5">
          <p className="text-sm font-semibold">GitHub connection</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {githubConnection
              ? `Connected as @${githubConnection.username}. Repo import and proof-backed project setup are now available.`
              : "GitHub is not connected yet. Add your username here to unlock repo import in Builder Projects."}
          </p>

          {githubConnection?.profileUrl ? (
            <a
              href={githubConnection.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-xs text-cyan-300"
            >
              View GitHub profile
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}

          {githubConnection ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/app/builder-projects"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
              >
                <Github className="h-4 w-4" />
                Open Project Manager
              </Link>
              <form action={disconnectGithubAction}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground"
                >
                  <Unplug className="h-4 w-4" />
                  Disconnect
                </button>
              </form>
            </div>
          ) : (
            <form action={connectGithubAction} className="mt-4 flex flex-wrap items-center gap-3">
              <input
                name="username"
                placeholder="GitHub username"
                className="min-w-[260px] flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200"
              >
                <PlugZap className="h-4 w-4" />
                Connect GitHub
              </button>
            </form>
          )}
        </article>
      </section>,
    );
  }

  if (app === "proof-profile") {
    const [builderProfile, profileViewCount, recentViews, projectCount, jobApplicationCount, programApplicationCount] =
      await Promise.all([
        db.builderProfile.findUnique({
          where: { userId: session.user.id },
        }),
        db.profileView.count({
          where: { viewedUserId: session.user.id },
        }),
        db.profileView.findMany({
          where: { viewedUserId: session.user.id },
          include: {
            viewer: {
              select: { id: true, name: true, username: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        db.builderProject.count({ where: { builderId: session.user.id } }),
        db.jobApplication.count({ where: { userId: session.user.id } }),
        db.application.count({ where: { userId: session.user.id } }),
      ]);

    const completionChecks: Array<[string, boolean]> = [
      ["Headline", Boolean(builderProfile?.headline || builderProfile?.title)],
      ["Bio", Boolean(builderProfile?.bio)],
      ["Skills", (builderProfile?.skills?.length ?? 0) > 0],
      ["Tech stack", (builderProfile?.stack?.length ?? 0) > 0],
      ["Chain expertise", (builderProfile?.chainExpertise?.length ?? 0) > 0],
      ["GitHub", Boolean(builderProfile?.github || githubConnection)],
      ["Portfolio URL", Boolean(builderProfile?.portfolioUrl)],
      ["Resume", Boolean(builderProfile?.resumeUrl)],
    ];
    const completedChecks = completionChecks.filter(([, done]) => done).length;
    const completionPercent = Math.round((completedChecks / completionChecks.length) * 100);

    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Proof profile workspace</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep your public builder identity clean, proof-backed, and ready for founder or investor review.
              </p>
            </div>
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
              {completionPercent}% complete
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Profile views</p>
              <p className="mt-1 text-xl font-semibold">{profileViewCount}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Projects published</p>
              <p className="mt-1 text-xl font-semibold">{projectCount}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Job applications</p>
              <p className="mt-1 text-xl font-semibold">{jobApplicationCount}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Program applications</p>
              <p className="mt-1 text-xl font-semibold">{programApplicationCount}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/app/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
            >
              Edit profile
            </Link>
            <Link
              href="/app/builder-os/projects"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground"
            >
              Manage projects
            </Link>
            {session.user.username ? (
              <Link
                href={`/builder/${session.user.username}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground"
              >
                View public profile
              </Link>
            ) : null}
          </div>
        </article>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">Completion checklist</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {completionChecks.map(([label, done]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground"
                >
                  <span className={done ? "text-emerald-300" : "text-amber-300"}>{done ? "Done" : "Pending"}</span>
                  <span className="ml-2">{label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">Recent viewers</p>
            {recentViews.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No recent viewers yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentViews.map((view) => (
                  <p
                    key={view.id}
                    className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground"
                  >
                    {(view.viewer?.name || view.viewer?.username || "Anonymous viewer") +
                      (view.viewer?.role ? ` (${view.viewer.role})` : "")}
                    {" - "}
                    {new Date(view.createdAt).toLocaleDateString()}
                  </p>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>,
    );
  }

  if (app === "integrations") {
    const [wallets, connections] = await Promise.all([
      db.walletConnection.count({ where: { userId: session.user.id } }),
      db.integrationConnection.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
    ]);
    const integrationByProvider = new Map(connections.map((connection) => [connection.provider, connection]));
    const cards: IntegrationCardModel[] = [
      {
        id: "github",
        name: "GitHub",
        detail: githubConnection
          ? `Connected as @${githubConnection.username}`
          : "Connect GitHub to import repos directly into Builder Projects.",
        status: githubConnection ? "CONNECTED" : toCardStatus(integrationByProvider.get("GITHUB")?.status),
        href: "/app/builder-os/github",
        providerKey: "GITHUB",
        lastSyncedAt: githubConnection?.updatedAt ?? integrationByProvider.get("GITHUB")?.updatedAt ?? null,
      },
      {
        id: "wallet",
        name: "Wallet",
        detail: wallets > 0 ? `${wallets} wallet(s) linked` : "No wallet linked yet.",
        status: wallets > 0 ? "CONNECTED" : "DISCONNECTED",
        href: "/app/settings",
        providerKey: "WALLET",
      },
      {
        id: "gmail",
        name: "Gmail",
        detail: integrationByProvider.get("GMAIL")?.externalEmail ?? "Connection used for outreach and thread context.",
        status: toCardStatus(integrationByProvider.get("GMAIL")?.status),
        href: "/app/settings",
        providerKey: "GMAIL",
        lastSyncedAt: integrationByProvider.get("GMAIL")?.updatedAt ?? null,
      },
      {
        id: "google_calendar",
        name: "Google Calendar",
        detail:
          integrationByProvider.get("GOOGLE_CALENDAR")?.externalEmail ?? "Calendar connector for interview and meeting context.",
        status: toCardStatus(integrationByProvider.get("GOOGLE_CALENDAR")?.status),
        href: "/app/settings",
        providerKey: "GOOGLE_CALENDAR",
        lastSyncedAt: integrationByProvider.get("GOOGLE_CALENDAR")?.updatedAt ?? null,
      },
      {
        id: "notion",
        name: "Notion",
        detail: integrationByProvider.get("NOTION")?.externalEmail ?? "Docs and knowledge context sync.",
        status: toCardStatus(integrationByProvider.get("NOTION")?.status),
        href: "/app/settings",
        providerKey: "NOTION",
        lastSyncedAt: integrationByProvider.get("NOTION")?.updatedAt ?? null,
      },
      {
        id: "farcaster",
        name: "Farcaster",
        detail: integrationByProvider.get("FARCASTER")?.externalUserId ?? "Web3 identity and social signal context.",
        status: toCardStatus(integrationByProvider.get("FARCASTER")?.status),
        href: "/app/settings",
        providerKey: "FARCASTER",
        lastSyncedAt: integrationByProvider.get("FARCASTER")?.updatedAt ?? null,
      },
    ];
    const connectedCardCount = cards.filter((card) => card.status === "CONNECTED").length;

    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Integration Center</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Connect once, then manage sync from a single place. GitHub is the primary automation path for Builder OS.
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

        {!githubConnection ? (
          <article className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold text-foreground">GitHub is disconnected</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect GitHub to auto-import repositories and avoid manual project entry.
            </p>
            <form action={connectGithubAction} className="mt-3 flex flex-wrap items-center gap-2">
              <input
                name="username"
                placeholder="GitHub username"
                className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
              >
                <PlugZap className="h-3.5 w-3.5" />
                Connect GitHub
              </button>
            </form>
          </article>
        ) : null}

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">GitHub quick actions</p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">GitHub</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {githubConnection
                      ? `Connected as @${githubConnection.username}`
                      : "Connect GitHub to import repos directly into Builder Projects."}
                  </p>
                </div>
                <Github className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {githubConnection ? (
                  <>
                    <Link
                      href="/app/builder-projects"
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
                    >
                      Open Project Manager
                    </Link>
                    <form action={disconnectGithubAction}>
                      <button
                        type="submit"
                        className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground"
                      >
                        Disconnect
                      </button>
                    </form>
                  </>
                ) : (
                  <form action={connectGithubAction} className="flex flex-wrap items-center gap-2">
                    <input
                      name="username"
                      placeholder="GitHub username"
                      className="min-w-[220px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
                    >
                      <PlugZap className="h-3.5 w-3.5" />
                      Connect GitHub
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/40 p-4">
              <p className="text-sm font-semibold">Wallets</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {wallets > 0 ? `${wallets} connected` : "Disconnected"}
              </p>
              <div className="mt-4">
                <Link
                  href="/app/settings"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground"
                >
                  Manage wallets
                </Link>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Provider status</p>
          {connections.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No providers connected yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {connections.map((connection) => (
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

  if (app === "opportunities") {
    const [jobApplications, programApplications] = await Promise.all([
      db.jobApplication.findMany({
        where: { userId: session.user.id },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              company: true,
              roleType: true,
              locationType: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      db.application.findMany({
        where: { userId: session.user.id },
        include: {
          event: { select: { title: true, type: true, startAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);
    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Opportunity inbox</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Track inbound opportunities from job applications and ecosystem programs in one place.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/app/jobs"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"
            >
              Browse jobs
            </Link>
            <Link
              href="/app/ecosystem-feed"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground"
            >
              Open ecosystem feed
            </Link>
          </div>
        </article>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">Job applications</p>
            {jobApplications.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No job applications yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {jobApplications.map((application) => (
                  <p
                    key={application.id}
                    className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground"
                  >
                    {application.job.title} at {application.job.company}
                    {" - "}
                    {application.status}
                    {" - "}
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">Program applications</p>
            {programApplications.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No program applications yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {programApplications.map((application) => (
                  <p
                    key={application.id}
                    className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground"
                  >
                    {application.event?.title ?? "Program application"}
                    {" - "}
                    {application.status}
                    {" - "}
                    {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>,
    );
  }

  return wrap(
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">{moduleMeta.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{moduleMeta.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        This module was simplified into focused builder workflows. Use one of the primary surfaces below.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Link href="/app/builder-os/proof-profile" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Proof Profile
        </Link>
        <Link href="/app/builder-os/projects" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Projects
        </Link>
        <Link href="/app/builder-os/github" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open GitHub Import
        </Link>
        <Link href="/app/builder-os/opportunities" className="rounded-md border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          Open Opportunity Inbox
        </Link>
      </div>
    </section>,
  );
}
