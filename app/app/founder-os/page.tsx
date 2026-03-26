import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import {
  AlertTriangle,
  Command,
  Newspaper,
  UserCheck,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { calculateCofounderMatchScore } from "@/lib/founder-os";
import { osRouteMeta } from "@/lib/os/modules";
import { FounderOsModuleTabs } from "@/components/os/FounderOsModuleTabs";
import { FounderOsLauncherGrid } from "@/components/os/FounderOsLauncherGrid";
import { SmartSuggestionsPanel } from "@/components/os/SmartSuggestionsPanel";

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
    userProfile,
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
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true, bio: true },
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

  /* Profile completion estimate */
  const profileFields = [
    userProfile?.name,
    userProfile?.email,
    userProfile?.image,
    userProfile?.bio,
  ];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );

  const totalIntegrations = 5;
  const integrationCount = connectedIntegrations + (githubConnection ? 1 : 0) + (calendlyLink ? 1 : 0);

  /* Dynamic blockers */
  type Blocker = { text: string; action: string; route: string; severity: "red" | "amber" };
  const blockers: Blocker[] = [];
  if (venturesCount === 0) blockers.push({ text: "Add a startup to unlock founder tools", action: "Add Startup", route: "/app/founder-os/ventures", severity: "red" });
  if (!githubConnection) blockers.push({ text: "Connect GitHub to enrich builder signals", action: "Open Integrations", route: "/app/founder-os/integrations", severity: "amber" });
  if (!calendlyLink) blockers.push({ text: "Connect calendar for meeting automation", action: "Open Meetings", route: "/app/founder-os/meetings", severity: "amber" });
  if (!latestFounderSnapshot) blockers.push({ text: "Upload your pitch deck for AI analysis", action: "Open Pitch Deck AI", route: "/app/founder-os/pitch-deck", severity: "amber" });

  const founderMeta = osRouteMeta.FOUNDER;

  return (
    <div className="flex gap-0 py-4" style={{ minHeight: "calc(100vh - 120px)" }}>
      {/* ─── CENTER: Main content ─── */}
      <div className="flex-1 min-w-0 overflow-y-auto space-y-4 pr-4">

        {/* ═══ SECTION 1: OS HERO IDENTITY PANEL ═══ */}
        <section
          className="relative overflow-hidden rounded-xl p-[18px_20px]"
          style={{
            backgroundColor: "#0d0b16",
            border: "0.5px solid #2d1f5e",
          }}
        >
          {/* Radial glow */}
          <div
            className="absolute top-0 right-0 w-[400px] h-[300px] pointer-events-none"
            style={{
              background: "radial-gradient(circle at top right, rgba(109,40,217,0.10) 0%, transparent 65%)",
            }}
          />
          <div className="relative z-10">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[10px]"
                  style={{
                    backgroundColor: "#1a1040",
                    border: "0.5px solid #4c1d95",
                  }}
                >
                  <Command className="h-5 w-5" style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <p
                    className="text-[8px] font-bold uppercase"
                    style={{ color: "#5b21b6", letterSpacing: "0.12em" }}
                  >
                    {"// FOUNDER COMMAND DESK"}
                  </p>
                  <h1
                    className="text-[20px] font-bold"
                    style={{ color: "#ede9fe", letterSpacing: "-0.5px" }}
                  >
                    Founder OS
                  </h1>
                  <p className="text-[11px] font-medium" style={{ color: "#6d28d9" }}>
                    Venture execution operating environment
                  </p>
                </div>
              </div>
              <span
                className="rounded-[5px] px-[10px] py-[3px] text-[8px] font-bold uppercase"
                style={{
                  backgroundColor: "#1a1040",
                  border: "0.5px solid #4c1d95",
                  color: "#a78bfa",
                  letterSpacing: "0.08em",
                }}
              >
                FOUNDER
              </span>
            </div>

            {/* OS Status Grid */}
            <div className="mt-[14px] grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* Profile */}
              <Link
                href="/app/profile"
                className="rounded-lg p-[10px_12px] transition-colors hover:border-[#4c1d95]"
                style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
              >
                <p className="text-[9px] uppercase" style={{ color: "#52525b" }}>PROFILE</p>
                <p className="text-[17px] font-bold" style={{ color: "#a78bfa" }}>{profileCompletion}%</p>
                <div className="mt-[7px] h-[2px] w-full rounded-[1px]" style={{ backgroundColor: "#1e1e24" }}>
                  <div className="h-full rounded-[1px]" style={{ backgroundColor: "#7c3aed", width: `${profileCompletion}%` }} />
                </div>
              </Link>
              {/* Ventures */}
              <Link
                href="/app/founder-os/ventures"
                className="rounded-lg p-[10px_12px] transition-colors"
                style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
              >
                <p className="text-[9px] uppercase" style={{ color: "#52525b" }}>VENTURES</p>
                <p className="text-[17px] font-bold" style={{ color: "#d4d4d8" }}>{venturesCount}</p>
                {venturesCount === 0 && <p className="mt-1 text-[9px]" style={{ color: "#52525b" }}>Add startup</p>}
              </Link>
              {/* Signals */}
              <Link
                href="/app/founder-os/investor-connect"
                className="rounded-lg p-[10px_12px] transition-colors"
                style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
              >
                <p className="text-[9px] uppercase" style={{ color: "#52525b" }}>SIGNALS</p>
                <p className="text-[17px] font-bold" style={{ color: "#d4d4d8" }}>{intros.length}</p>
                <p className="mt-1 text-[9px]" style={{ color: "#52525b" }}>Investor activity</p>
              </Link>
              {/* Automation */}
              <Link
                href="/app/founder-os/integrations"
                className="rounded-lg p-[10px_12px] transition-colors"
                style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
              >
                <p className="text-[9px] uppercase" style={{ color: "#52525b" }}>AUTOMATION</p>
                <p className="text-[17px] font-bold" style={{ color: integrationCount === 0 ? "#f59e0b" : "#d4d4d8" }}>
                  {integrationCount === 0 ? "Needs setup" : `${integrationCount} active`}
                </p>
                <p className="mt-1 text-[9px]" style={{ color: "#52525b" }}>{integrationCount}/{totalIntegrations} connected</p>
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 2: MODULE TAB BAR ═══ */}
        <FounderOsModuleTabs rootHref={founderMeta.root} />

        {/* ═══ SECTION 3: APP LAUNCHER GRID ═══ */}
        <FounderOsLauncherGrid rootHref={founderMeta.root} />

        {/* ═══ SECTION 4: PRIORITY BLOCKERS + BUILDER MATCHES ═══ */}
        <div className="grid gap-2 lg:grid-cols-2">
          {/* Priority Blockers */}
          <article
            className="rounded-[9px] p-[13px_14px]"
            style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
          >
            <div className="mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" style={{ color: "#f59e0b" }} />
              <p
                className="text-[10px] font-bold uppercase"
                style={{ color: "#71717a", letterSpacing: "0.08em" }}
              >
                Priority Blockers
              </p>
            </div>
            {blockers.length === 0 ? (
              <p className="text-[10px]" style={{ color: "#22c55e" }}>
                No critical blockers. Execution stack looks healthy.
              </p>
            ) : (
              <div>
                {blockers.map((b, i) => (
                  <div
                    key={b.text}
                    className="flex items-start gap-[7px] py-[6px]"
                    style={{
                      borderBottom: i < blockers.length - 1 ? "0.5px solid #1a1a1e" : "none",
                    }}
                  >
                    <span
                      className="mt-[5px] h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: b.severity === "red" ? "#ef4444" : "#f59e0b" }}
                    />
                    <p className="text-[10px] leading-[1.4]" style={{ color: "#71717a" }}>
                      {b.text}{" "}
                      <Link
                        href={b.route}
                        className="font-medium"
                        style={{ color: "#a78bfa" }}
                      >
                        → {b.action}
                      </Link>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </article>

          {/* Builder Matches */}
          <article
            className="rounded-[9px] p-[13px_14px]"
            style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
          >
            <div className="mb-2 flex items-center gap-1.5">
              <UserCheck className="h-3 w-3" style={{ color: "#a78bfa" }} />
              <p
                className="text-[10px] font-bold uppercase"
                style={{ color: "#71717a", letterSpacing: "0.08em" }}
              >
                Builder Matches
              </p>
            </div>
            {builderMatches.length === 0 ? (
              <div>
                <p className="text-[10px] leading-[1.4]" style={{ color: "#52525b" }}>
                  Define cofounder preferences to see matched builders ranked by relevance score.
                </p>
                <Link
                  href="/app/founder-os/builder-discovery"
                  className="mt-2 inline-block text-[10px] font-medium"
                  style={{ color: "#a78bfa" }}
                >
                  → Open Builder Discovery
                </Link>
              </div>
            ) : (
              <div>
                {builderMatches.map((item, i) => (
                  <div
                    key={item.builder.id}
                    className="flex items-center gap-2 py-[6px]"
                    style={{
                      borderBottom: i < builderMatches.length - 1 ? "0.5px solid #1a1a1e" : "none",
                    }}
                  >
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ backgroundColor: "#1a1040", color: "#a78bfa" }}
                    >
                      {(item.builder.user.name ?? "B").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium" style={{ color: "#d4d4d8" }}>
                        {item.builder.user.name ?? "Builder"}
                      </p>
                      <p className="text-[9px]" style={{ color: "#52525b" }}>
                        Match {item.match.score}% · {item.builder.title ?? item.builder.headline ?? "Builder"}
                      </p>
                    </div>
                    <Link
                      href="/app/founders"
                      className="text-[9px] font-medium"
                      style={{ color: "#a78bfa" }}
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        {/* ═══ SECTION 5: WEEKLY AI BRIEF ═══ */}
        <section
          className="flex items-center gap-3 rounded-[9px] p-[11px_14px]"
          style={{ backgroundColor: "#111114", border: "0.5px solid #1e1e24" }}
        >
          <Newspaper className="h-[14px] w-[14px] shrink-0" style={{ color: "#52525b" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold" style={{ color: "#d4d4d8" }}>
              Weekly AI brief
            </p>
            {latestInsight ? (
              <p className="text-[9px]" style={{ color: "#3f3f46" }}>
                Pain points: {latestInsight.founderPainPoints} · Trends: {latestInsight.trendingProblems}
              </p>
            ) : (
              <p className="text-[9px]" style={{ color: "#3f3f46" }}>
                No brief generated yet. Connect sources in Market Intelligence.
              </p>
            )}
          </div>
          {!latestInsight && (
            <Link
              href="/app/founder-os/market-intelligence"
              className="shrink-0 rounded-md px-3 py-1.5 text-[9px] font-medium transition-colors"
              style={{ color: "#52525b", border: "0.5px solid #1e1e24" }}
            >
              Generate Brief →
            </Link>
          )}
        </section>
      </div>

      {/* ─── RIGHT PANEL: Smart Suggestions ─── */}
      <aside
        className="hidden w-[220px] shrink-0 space-y-5 overflow-y-auto pl-4 xl:block"
        style={{ borderLeft: "0.5px solid #1e1e24" }}
      >
        {/* Recent Activity */}
        <div>
          <p
            className="mb-3 text-[9px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "#3f3f46" }}
          >
            Recent Activity
          </p>
          {intros.length === 0 ? (
            <p className="text-[9px]" style={{ color: "#52525b" }}>
              No recent intro activity.
            </p>
          ) : (
            <div className="space-y-2">
              {intros.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-start gap-2">
                  <span
                    className="mt-1 h-[5px] w-[5px] shrink-0 rounded-full"
                    style={{ backgroundColor: "#a78bfa" }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[10px]" style={{ color: "#71717a" }}>
                      Intro {item.status.toLowerCase()} · {item.startup.name}
                    </p>
                    <p className="text-[9px]" style={{ color: "#3f3f46" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Suggestions */}
        <SmartSuggestionsPanel ventureCount={venturesCount} />
      </aside>
    </div>
  );
}
