import Link from "next/link";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/server/db/client";
import { osRouteMeta } from "@/lib/os/modules";
import { OsLauncherGrid, OsWorkspaceShell } from "@/components/os/OsWorkspaceShell";
import { ActivityTimeline, MetricCard, StatusPill } from "@/components/os/WorkspaceWidgets";

export const metadata = { title: "Investor OS - Webcoin Labs" };

function percentage(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export default async function InvestorOsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/login");
  if (!["INVESTOR", "ADMIN"].includes(session.user.role)) redirect("/app");

  const [investorProfile, companyMember, applications, integrations, walletCount, meetings, memos, fitSnapshot] =
    await Promise.all([
      db.investorProfile.findUnique({
        where: { userId: session.user.id },
        include: { company: true },
      }),
      db.investorCompanyMember.findFirst({
        where: { userId: session.user.id, isPrimary: true },
        include: { company: true },
      }),
      db.investorApplication.findMany({
        where: session.user.role === "ADMIN" ? undefined : { investorUserId: session.user.id },
        include: {
          founder: { select: { id: true, name: true, username: true } },
          venture: { select: { id: true, name: true, stage: true, chainEcosystem: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.integrationConnection.findMany({ where: { userId: session.user.id, status: "CONNECTED" } }),
      db.walletConnection.count({ where: { userId: session.user.id } }),
      db.workspaceMeeting.findMany({
        where: { hostUserId: session.user.id },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      db.diligenceMemo.findMany({
        where: { authorUserId: session.user.id },
        include: { venture: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      db.scoreSnapshot.findFirst({
        where: { kind: "INVESTOR_FIT_HELPER", scoredUserId: session.user.id },
        orderBy: { computedAt: "desc" },
      }),
    ]);

  const thesisCoverage = percentage(
    [
      investorProfile?.investmentThesis,
      investorProfile?.investorType,
      investorProfile?.stageFocus.length ? "stage" : "",
      investorProfile?.chainFocus.length ? "chain" : "",
      investorProfile?.sectorFocus.length ? "sector" : "",
      investorProfile?.checkSizeMin !== null ? "min" : "",
      investorProfile?.checkSizeMax !== null ? "max" : "",
      companyMember?.company?.name || investorProfile?.firmName,
    ].filter(Boolean).length,
    8,
  );

  const statusCount = {
    NEW: applications.filter((item) => item.status === "NEW").length,
    REVIEWING: applications.filter((item) => item.status === "REVIEWING").length,
    INTERESTED: applications.filter((item) => item.status === "INTERESTED").length,
    MEETING_SCHEDULED: applications.filter((item) => item.status === "MEETING_SCHEDULED").length,
    PASSED: applications.filter((item) => item.status === "PASSED").length,
  };

  const blockers: string[] = [];
  if (integrations.length === 0) blockers.push("Connect integrations to automate deal-flow enrichment.");
  if (!investorProfile?.investmentThesis) blockers.push("Configure thesis settings to improve fit alerts.");
  if (walletCount === 0) blockers.push("Connect wallet identity for stronger trust context.");

  const investorMeta = osRouteMeta.INVESTOR;

  return (
    <OsWorkspaceShell
      title={investorMeta.title}
      subtitle={investorMeta.subtitle}
      rootHref={investorMeta.root}
      modules={investorMeta.modules}
      integrationConnectedCount={integrations.length}
      integrationTotalCount={4}
      rightPanel={
        <>
          <section className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-300">Automation health</p>
            <div className="mt-2">
              <StatusPill
                label={integrations.length > 0 ? "Sync healthy" : "Needs integrations"}
                tone={integrations.length > 0 ? "good" : "warn"}
              />
            </div>
          </section>
          <ActivityTimeline
            title="Pipeline status"
            emptyText="No pipeline activity yet."
            items={Object.entries(statusCount).map(([key, value]) => ({
              id: key,
              primary: key.replaceAll("_", " "),
              secondary: `${value} item(s)`,
            }))}
          />
        </>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Deal flow inbox" value={applications.length} />
        <MetricCard label="Thesis completeness" value={`${thesisCoverage}%`} />
        <MetricCard label="Connected tools" value={integrations.length} />
        <MetricCard label="Fit snapshot" value={fitSnapshot?.score ?? "N/A"} helper={fitSnapshot?.label ?? "No snapshot"} />
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">App Launcher</p>
        <p className="mt-1 text-xs text-muted-foreground">Open dedicated investor workspaces.</p>
        <div className="mt-3">
          <OsLauncherGrid rootHref={investorMeta.root} modules={investorMeta.modules} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Priority blockers</p>
          {blockers.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-300">No critical blockers. Investor workspace is healthy.</p>
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
          <p className="text-sm font-semibold">Recent diligence memos</p>
          {memos.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No memos created yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {memos.map((memo) => (
                <p key={memo.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                  {memo.title} - {memo.venture.name} - {memo.status}
                </p>
              ))}
            </div>
          )}
          <Link href="/app/investor-os/diligence" className="mt-3 inline-flex text-xs text-cyan-300">
            Open Diligence Workspace
          </Link>
        </article>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-sm font-semibold">Upcoming meetings</p>
        {meetings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No meetings scheduled.</p>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {meetings.map((meeting) => (
              <p key={meeting.id} className="rounded-md border border-border/50 px-3 py-2 text-sm text-muted-foreground">
                {meeting.title} - {new Date(meeting.scheduledAt).toLocaleString()}
              </p>
            ))}
          </div>
        )}
      </section>
    </OsWorkspaceShell>
  );
}
