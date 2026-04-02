import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db/client";
import { scoringService } from "@/server/services/scoring.service";
import { osRouteMeta } from "@/lib/os/modules";
import { OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import { ActivityTimeline, MetricCard, StatusPill } from "@/components/os/WorkspaceWidgets";
import { BuilderOsLauncherGrid } from "@/components/os/BuilderOsLauncherGrid";

export const metadata = { title: "Builder OS - Webcoin Labs" };

export default async function BuilderOsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!["BUILDER", "ADMIN"].includes(session.user.role)) redirect("/app");

  const [profile, projects, githubConnection, integrationConnections, walletCount, proofExplanation, latestProofSnapshot, applications] = await Promise.all([
    db.builderProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
    db.builderProject.findMany({ where: { builderId: session.user.id }, orderBy: { updatedAt: "desc" }, take: 8 }),
    db.githubConnection.findUnique({ where: { userId: session.user.id } }),
    db.integrationConnection.findMany({ where: { userId: session.user.id, status: "CONNECTED" } }),
    db.walletConnection.count({ where: { userId: session.user.id } }),
    scoringService.computeBuilderProofScore(session.user.id),
    db.scoreSnapshot.findFirst({
      where: { kind: "BUILDER_PROOF", scoredUserId: session.user.id },
      orderBy: { computedAt: "desc" },
    }),
    db.application.findMany({
      where: { userId: session.user.id },
      select: { id: true, status: true, createdAt: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const profileCompleteness = Math.round(
    ((proofExplanation.factors.find((factor) => factor.key === "profile")?.value ?? 0) +
      (proofExplanation.factors.find((factor) => factor.key === "resume")?.value ?? 0) +
      (proofExplanation.factors.find((factor) => factor.key === "github_linked")?.value ?? 0)) /
      3 *
      100,
  );

  const proofScore = proofExplanation.score;
  const builderMeta = osRouteMeta.BUILDER;
  const blockers: string[] = [];
  if (!githubConnection) blockers.push("Connect GitHub to enable proof and contribution sync.");
  if (!profile) blockers.push("Complete builder profile in Proof Profile.");
  if (integrationConnections.length === 0) blockers.push("Connect at least one integration for automation-driven workflows.");

  return (
    <OsWorkspaceShell
      title={builderMeta.title}
      subtitle={builderMeta.subtitle}
      rootHref={builderMeta.root}
      modules={builderMeta.modules}
      integrationConnectedCount={integrationConnections.length + (githubConnection ? 1 : 0)}
      integrationTotalCount={4}
      rightPanel={
        <>
          <section className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-300">Automation health</p>
            <div className="mt-2">
              <StatusPill
                label={integrationConnections.length > 0 ? "Sync healthy" : "Needs integrations"}
                tone={integrationConnections.length > 0 ? "good" : "warn"}
              />
            </div>
          </section>
          <ActivityTimeline
            title="Recent applications"
            emptyText="No application activity yet."
            items={applications.slice(0, 4).map((application) => ({
              id: application.id,
              primary: application.status,
              secondary: new Date(application.createdAt).toLocaleDateString(),
            }))}
          />
        </>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Profile completeness" value={`${profileCompleteness}%`} />
        <MetricCard label="Proof score" value={`${proofScore}%`} />
        <MetricCard label="Active projects" value={projects.length} />
        <MetricCard label="Latest snapshot" value={latestProofSnapshot?.score ?? "N/A"} helper={latestProofSnapshot?.label ?? "No snapshot"} />
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">App Launcher</p>
        <p className="mt-1 text-xs text-muted-foreground">Jump into builder-specific workspaces with a portfolio-first execution flow.</p>
        <div className="mt-3">
          <BuilderOsLauncherGrid rootHref={builderMeta.root} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Priority blockers</p>
          {blockers.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-300">No critical blockers. Your builder execution stack is healthy.</p>
          ) : (
            <div className="mt-2 space-y-2 text-sm text-muted-foreground">
              {blockers.map((blocker) => (
                <p key={blocker} className="rounded-md border border-border/50 px-3 py-2">
                  {blocker}
                </p>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Quick access</p>
          <div className="mt-2 space-y-2">
            <Link href="/app/builder-os/projects" className="block rounded-md border border-border/50 px-3 py-2 text-sm hover:bg-accent/20">
              Open Projects Workspace
            </Link>
            <Link href="/app/builder-os/github" className="block rounded-md border border-border/50 px-3 py-2 text-sm hover:bg-accent/20">
              Open GitHub Activity
            </Link>
            <Link href="/app/builder-os/opportunities" className="block rounded-md border border-border/50 px-3 py-2 text-sm hover:bg-accent/20">
              Open Opportunity Inbox
            </Link>
            <Link href="/app/builder-os/integrations" className="block rounded-md border border-border/50 px-3 py-2 text-sm hover:bg-accent/20">
              Manage Integrations
            </Link>
          </div>
        </article>
      </section>
    </OsWorkspaceShell>
  );
}

