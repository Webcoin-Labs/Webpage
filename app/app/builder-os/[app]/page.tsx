import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { builderModules, osRouteMeta } from "@/lib/os/modules";
import { OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import { EcosystemFeedPanel } from "@/components/ecosystem/EcosystemFeedPanel";

export const metadata = { title: "Builder Workspace - Webcoin Labs" };

export default async function BuilderOsAppPage({
  params,
  searchParams,
}: {
  params: Promise<{ app: string }>;
  searchParams?: Promise<{ search?: string; scope?: string }>;
}) {
  const { app } = await params;
  const resolvedSearch = (await searchParams) ?? {};
  const moduleMeta = builderModules.find((module) => module.slug === app);
  if (!moduleMeta) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!["BUILDER", "FOUNDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const [integrationConnections, githubConnection] = await Promise.all([
    db.integrationConnection.findMany({ where: { userId: session.user.id, status: "CONNECTED" } }),
    db.githubConnection.findUnique({ where: { userId: session.user.id }, select: { id: true, username: true, updatedAt: true } }),
  ]);

  const wrap = (content: React.ReactNode) => (
    <OsWorkspaceShell
      title={osRouteMeta.BUILDER.title}
      subtitle={osRouteMeta.BUILDER.subtitle}
      rootHref={osRouteMeta.BUILDER.root}
      modules={osRouteMeta.BUILDER.modules}
      activeSlug={app}
      integrationConnectedCount={integrationConnections.length + (githubConnection ? 1 : 0)}
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
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Projects workspace</p>
        {projects.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No projects yet. Add your first project in Builder Projects.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/app/builder-os/projects/${project.id}`} className="block rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
                {project.title} {project.githubUrl ? "· GitHub linked" : ""}
              </Link>
            ))}
          </div>
        )}
        <Link href="/app/builder-projects" className="mt-3 inline-flex text-xs text-cyan-300">
          Open full project manager
        </Link>
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
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">GitHub connection</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {githubConnection ? `Connected as ${githubConnection.username}` : "GitHub is not connected yet."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure integrations to automate repository sync and contribution evidence.
          </p>
          <Link href="/app/builder-os/integrations" className="mt-3 inline-flex text-xs text-cyan-300">
            Open Integrations
          </Link>
        </article>
      </section>,
    );
  }

  if (app === "integrations") {
    const [wallets, connections] = await Promise.all([
      db.walletConnection.count({ where: { userId: session.user.id } }),
      db.integrationConnection.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, take: 20 }),
    ]);

    return wrap(
      <section className="space-y-4">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Integration Center</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <p className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
              GitHub · {githubConnection ? `Connected as ${githubConnection.username}` : "Disconnected"}
            </p>
            <p className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
              Wallets · {wallets > 0 ? `${wallets} connected` : "Disconnected"}
            </p>
          </div>
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Provider status</p>
          {connections.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No providers connected yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {connections.map((connection) => (
                <p key={connection.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {connection.provider} · {connection.status}
                </p>
              ))}
            </div>
          )}
        </article>
      </section>,
    );
  }

  if (app === "opportunities") {
    const applications = await db.application.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return wrap(
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Opportunity inbox</p>
        {applications.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No opportunities yet. Apply from jobs and ecosystem boards.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {applications.map((application) => (
              <p key={application.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                {application.status} · {new Date(application.createdAt).toLocaleDateString()}
              </p>
            ))}
          </div>
        )}
      </section>,
    );
  }

  return wrap(
    <section className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">{moduleMeta.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{moduleMeta.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Dedicated workspace route is active. Add records via related workflows and integrations.
      </p>
    </section>,
  );
}

