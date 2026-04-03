import Link from "next/link";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getServerSession } from "@/lib/auth";
import { db } from "@/server/db/client";
import { osRouteMeta } from "@/lib/os/modules";
import { OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import { FounderOsModuleTabs } from "@/components/os/FounderOsModuleTabs";
import { FounderOsLauncherGrid } from "@/components/os/FounderOsLauncherGrid";
import { FounderOsAccessWarning } from "@/components/os/FounderOsAccessWarning";
import { MetricCard } from "@/components/os/WorkspaceWidgets";

export const metadata = {
  title: "Founder OS - Webcoin Labs",
};

function canUseFounderOs(role: Role) {
  return ["FOUNDER", "ADMIN"].includes(role);
}

export default async function FounderOsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!canUseFounderOs(session.user.role)) {
    return <FounderOsAccessWarning reason="Founder OS is restricted to founder accounts with company ownership context." />;
  }

  const [founderProfileGate, ventureCountGate, startupCountGate] = await Promise.all([
    db.founderProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, companyName: true, roleTitle: true },
    }),
    db.venture.count({ where: { ownerUserId: session.user.id } }),
    db.startup.count({ where: { founderId: session.user.id } }),
  ]);
  const hasFounderClaim = Boolean(
    founderProfileGate?.companyName?.trim() ||
      founderProfileGate?.roleTitle?.trim() ||
      ventureCountGate > 0 ||
      startupCountGate > 0,
  );
  if (!hasFounderClaim) {
    return <FounderOsAccessWarning reason="Create a company page or set a real founder/company role before Founder OS unlocks." />;
  }

  const [intros, upcomingMeetings, connectedIntegrations, githubConnection, calendlyLink, latestFounderSnapshot] =
    await Promise.all([
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
    ]);

  const totalIntegrations = 5;
  const integrationCount = connectedIntegrations + (githubConnection ? 1 : 0) + (calendlyLink ? 1 : 0);

  const blockers: Array<{ text: string; action: string; route: string }> = [];
  if (ventureCountGate === 0) {
    blockers.push({
      text: "Add your startup to unlock founder workflows.",
      action: "Open Startup Layer",
      route: "/app/founder-os/ventures",
    });
  }
  if (!githubConnection) {
    blockers.push({
      text: "Connect GitHub to enrich builder matching and proof context.",
      action: "Open Integrations",
      route: "/app/founder-os/integrations",
    });
  }
  if (!calendlyLink) {
    blockers.push({
      text: "Connect calendar to streamline investor meeting requests.",
      action: "Open Investor Discovery",
      route: "/app/founder-os/investor-connect",
    });
  }
  if (!latestFounderSnapshot) {
    blockers.push({
      text: "Upload a deck to get readiness analysis and section feedback.",
      action: "Open Pitch Deck Analysis",
      route: "/app/founder-os/pitch-deck",
    });
  }

  const founderMeta = osRouteMeta.FOUNDER;

  return (
    <OsWorkspaceShell
      title={founderMeta.title}
      subtitle={founderMeta.subtitle}
      rootHref={founderMeta.root}
      modules={founderMeta.modules}
      integrationConnectedCount={integrationCount}
      integrationTotalCount={totalIntegrations}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Startups" value={ventureCountGate} helper={ventureCountGate === 0 ? "Create your first startup" : "Startup layer active"} />
        <MetricCard label="Investor intros" value={intros.length} helper="Recent intro flow" />
        <MetricCard label="Connected tools" value={`${integrationCount}/${totalIntegrations}`} helper="Automation status" />
        <MetricCard
          label="Deck readiness"
          value={latestFounderSnapshot?.score ?? "N/A"}
          helper={
            latestFounderSnapshot
              ? `${latestFounderSnapshot.label ?? "snapshot"} • ${new Date(latestFounderSnapshot.computedAt).toLocaleDateString()}`
              : "No deck snapshot yet"
          }
        />
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Quick actions</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link href="/app/founder-os/ventures" className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Startup Layer
          </Link>
          <Link href="/app/founder-os/pitch-deck" className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Pitch Deck Analysis
          </Link>
          <Link href="/app/founder-os/tokenomics" className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Tokenomics Studio
          </Link>
          <Link href="/app/founder-os/investor-connect" className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            Investor Discovery
          </Link>
        </div>
      </section>

      <FounderOsModuleTabs rootHref={founderMeta.root} />

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">App launcher</p>
        <p className="mt-1 text-xs text-muted-foreground">Open focused founder workspaces instead of stacked forms.</p>
        <div className="mt-3">
          <FounderOsLauncherGrid rootHref={founderMeta.root} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Priority blockers</p>
          {blockers.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-300">No critical blockers. Founder workspace is healthy.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {blockers.map((blocker) => (
                <p key={blocker.text} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {blocker.text}{" "}
                  <Link href={blocker.route} className="text-cyan-300">
                    {blocker.action}
                  </Link>
                </p>
              ))}
            </div>
          )}
        </article>
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Recent activity</p>
          {intros.length === 0 && upcomingMeetings.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No recent activity yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {intros.slice(0, 3).map((item) => (
                <p key={item.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  Intro {item.status.toLowerCase()} - {item.startup.name}
                </p>
              ))}
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <p key={meeting.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  Meeting - {meeting.title} - {new Date(meeting.scheduledAt).toLocaleString()}
                </p>
              ))}
            </div>
          )}
        </article>
      </section>
    </OsWorkspaceShell>
  );
}
