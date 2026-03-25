import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { calculateCofounderMatchScore } from "@/lib/founder-os";
import { osRouteMeta } from "@/lib/os/modules";
import { OsLauncherGrid, OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import { ActivityTimeline, MetricCard, StatusPill } from "@/components/os/WorkspaceWidgets";

export const metadata = {
  title: "Founder OS - Webcoin Labs",
};

function canUseFounderOs(role: Role) {
  return ["FOUNDER", "BUILDER", "ADMIN"].includes(role);
}

export default async function FounderOsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!canUseFounderOs(session.user.role)) redirect("/app");

  const [
    venturesCount,
    intros,
    upcomingMeetings,
    connectedIntegrations,
    githubConnection,
    calendlyLink,
    latestFounderSnapshot,
    cofounderPreferences,
    builders,
    latestInsight,
  ] = await Promise.all([
    db.venture.count({ where: { ownerUserId: session.user.id } }),
    db.investorIntroRequest.findMany({
      where: { founderId: session.user.id },
      select: { id: true, status: true, createdAt: true, startup: { select: { name: true } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    db.meetingRecord.findMany({
      where: { hostUserId: session.user.id, scheduledAt: { gte: new Date() } },
      select: { id: true, title: true, scheduledAt: true },
      take: 5,
      orderBy: { scheduledAt: "asc" },
    }),
    db.integrationConnection.count({
      where: { userId: session.user.id, status: "CONNECTED" },
    }),
    db.githubConnection.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
    db.meetingLink.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
    db.scoreSnapshot.findFirst({
      where: { kind: "FOUNDER_LAUNCH_READINESS", scoredUserId: session.user.id },
      select: { score: true, label: true, computedAt: true },
      orderBy: { computedAt: "desc" },
    }),
    db.cofounderPreferences.findUnique({
      where: { userId: session.user.id },
      select: { roleWanted: true, skillsNeeded: true },
    }),
    db.builderProfile.findMany({
      where: { publicVisible: true },
      select: { id: true, title: true, headline: true, skills: true, openTo: true, bio: true, user: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.founderMarketInsight.findFirst({
      where: { founderId: session.user.id },
      select: { founderPainPoints: true, trendingProblems: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const builderMatches = builders
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
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 4);

  const blockers: string[] = [];
  if (!githubConnection) blockers.push("Connect GitHub to enrich builder and venture execution signals.");
  if (!calendlyLink) blockers.push("Connect scheduling to activate meeting automation.");
  if (connectedIntegrations === 0) blockers.push("Connect at least one integration to enable sync-driven workflows.");
  if (!latestFounderSnapshot) blockers.push("Generate first readiness snapshot from launch-readiness workspace.");

  const founderMeta = osRouteMeta.FOUNDER;

  return (
    <OsWorkspaceShell
      title={founderMeta.title}
      subtitle={founderMeta.subtitle}
      rootHref={founderMeta.root}
      modules={founderMeta.modules}
      integrationConnectedCount={connectedIntegrations + (githubConnection ? 1 : 0) + (calendlyLink ? 1 : 0)}
      integrationTotalCount={5}
      rightPanel={
        <>
          <section className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-300">Automation health</p>
            <div className="mt-2">
              <StatusPill
                label={connectedIntegrations > 0 ? "Automation running" : "Needs integration setup"}
                tone={connectedIntegrations > 0 ? "good" : "warn"}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {connectedIntegrations > 0
                ? "Connectors are active. Keep sync healthy for accurate workflows."
                : "No active integrations yet."}
            </p>
            <Link href="/app/founder-os/integrations" className="mt-3 inline-flex text-xs text-cyan-300">
              Open Integrations
            </Link>
          </section>
          <ActivityTimeline
            title="Recent activity"
            emptyText="No intro activity yet."
            items={intros.slice(0, 4).map((item) => ({
              id: item.id,
              primary: `Intro ${item.status.toLowerCase()} · ${item.startup.name}`,
              secondary: new Date(item.createdAt).toLocaleString(),
            }))}
          />
        </>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Venture workspace" value={venturesCount} />
        <MetricCard label="Investor activity" value={intros.length} />
        <MetricCard label="Upcoming meetings" value={upcomingMeetings.length} helper={calendlyLink ? "Calendar connected" : "Calendar disconnected"} />
        <MetricCard label="Launch readiness" value={latestFounderSnapshot?.score ?? "N/A"} helper={latestFounderSnapshot?.label ?? "No snapshot yet"} />
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">App Launcher</p>
        <p className="mt-1 text-xs text-muted-foreground">Open dedicated workspaces. No more stacked single-page forms.</p>
        <div className="mt-3">
          <OsLauncherGrid rootHref={founderMeta.root} modules={founderMeta.modules} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Priority blockers</p>
          {blockers.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-300">No critical blockers. Execution stack looks healthy.</p>
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
          <p className="text-sm font-semibold">Builder matches</p>
          {builderMatches.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No strong matches yet. Define cofounder preferences in Builder Discovery.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {builderMatches.map((item) => (
                <div key={item.builder.id} className="rounded-md border border-border/50 px-3 py-2">
                  <p className="text-sm font-medium">{item.builder.user.name ?? "Builder"}</p>
                  <p className="text-xs text-muted-foreground">
                    Match {item.match.score}% · {item.builder.title ?? item.builder.headline ?? "Builder profile"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Weekly AI brief</p>
        {latestInsight ? (
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>Founder pain points: {latestInsight.founderPainPoints}</p>
            <p>Trending problems: {latestInsight.trendingProblems}</p>
            <p className="text-xs">Generated {new Date(latestInsight.createdAt).toLocaleString()}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No brief available yet. Connect sources and generate in Market Intelligence.
          </p>
        )}
      </section>
    </OsWorkspaceShell>
  );
}
