import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { BadgeType, Role, StartupChainFocus, StartupStage } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import {
  createFounderChatThread,
  createMeetingRecord,
  generateFounderMarketInsight,
  requestInvestorIntro,
  saveMarketSignal,
  sendFounderChatMessage,
  setManualBadge,
  upsertCalendlyLink,
  upsertCofounderPreferences,
  upsertFounderProfileExtended,
  upsertGithubActivity,
  upsertInvestorOperatingProfile,
  upsertStartup,
} from "@/app/actions/founder-os";
import {
  addBuilderRaiseAsk,
  connectOpenClaw,
  createOrUpdateActiveRound,
  createTokenomicsScenario,
  importTokenomicsSheet,
  rollbackTokenomicsScenarioRevision,
  sendTelegramReply,
  syncTelegramThreads,
  updateRoundStatus,
  updateRoundProgress,
  upsertAllocationRows,
} from "@/app/actions/founder-os-expansion";
import { recomputeMyScoresAction } from "@/app/actions/canonical-graph";
import { calculateCofounderMatchScore } from "@/lib/founder-os";

export const metadata = {
  title: "Founder OS - Webcoin Labs",
};

const STARTUP_STAGE_OPTIONS: Array<{ value: StartupStage; label: string }> = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "EARLY", label: "Early" },
  { value: "GROWTH", label: "Growth" },
];

const CHAIN_OPTIONS: Array<{ value: StartupChainFocus; label: string }> = [
  { value: "ARC", label: "Arc" },
  { value: "SOLANA", label: "Solana" },
  { value: "BASE", label: "Base" },
  { value: "ETHEREUM", label: "Ethereum" },
];

const BADGE_LABELS: Record<BadgeType, string> = {
  ARC_DEVELOPER: "Arc Developer",
  SOLANA_DEVELOPER: "Solana Developer",
  ETHEREUM_DEVELOPER: "Ethereum Developer",
  BASE_BUILDER: "Base Builder",
};

function fmtDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function canUseFounderOs(role: Role) {
  return ["FOUNDER", "BUILDER", "ADMIN"].includes(role);
}

export default async function FounderOsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    stage?: string;
    chain?: string;
  }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!canUseFounderOs(session.user.role)) redirect("/app");

  const stageFilter = (resolvedSearchParams?.stage ?? "").toUpperCase();
  const chainFilter = (resolvedSearchParams?.chain ?? "").toUpperCase();
  const isFounder = session.user.role === "FOUNDER" || session.user.role === "ADMIN";
  const isInvestor = session.user.role === "INVESTOR" || session.user.role === "ADMIN";

  const [
    startups,
    ventures,
    founderExtended,
    cofounderPreferences,
    investors,
    investorOperatingProfile,
    startupActivities,
    badges,
    githubConnection,
    chatThreads,
    meetings,
    meetingLink,
    marketSignals,
    insights,
    builders,
    networkUsers,
    startupDirectory,
    investorIntros,
    openJobs,
    openClawConnection,
    telegramWorkspaces,
    telegramThreads,
    activeRaiseRounds,
    tokenomicsModels,
    latestFounderSnapshot,
  ] = await Promise.all([
    db.startup.findMany({
      where: isFounder ? { founderId: session.user.id } : undefined,
      include: { githubActivity: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    db.venture.findMany({
      where: isFounder ? { ownerUserId: session.user.id } : undefined,
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.founderProfileExtended.findUnique({ where: { userId: session.user.id } }),
    db.cofounderPreferences.findUnique({ where: { userId: session.user.id } }),
    db.investor.findMany({
      include: {
        user: { select: { id: true, name: true } },
      },
      where: {
        ...(chainFilter ? { chainsInterested: { has: chainFilter.toLowerCase() } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
    db.investor.findUnique({ where: { userId: session.user.id } }),
    db.startupGithubActivity.findMany({
      where: isFounder
        ? {
            startup: {
              founderId: session.user.id,
            },
          }
        : undefined,
      include: { startup: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.userBadge.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.githubConnection.findUnique({ where: { userId: session.user.id } }),
    db.chatThread.findMany({
      where: {
        participants: {
          some: { userId: session.user.id },
        },
      },
      include: {
        startup: { select: { id: true, name: true } },
        participants: { include: { user: { select: { id: true, name: true, role: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 4,
          include: { sender: { select: { id: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.meetingRecord.findMany({
      where: {
        OR: [{ hostUserId: session.user.id }, { attendeeUserId: session.user.id }],
      },
      include: {
        startup: { select: { id: true, name: true } },
        host: { select: { id: true, name: true } },
        attendee: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 8,
    }),
    db.meetingLink.findUnique({ where: { userId: session.user.id } }),
    db.marketSignal.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.founderMarketInsight.findMany({
      where: { founderId: session.user.id },
      include: { startup: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.builderProfile.findMany({
      where: { publicVisible: true },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    db.user.findMany({
      where: { id: { not: session.user.id } },
      select: { id: true, name: true, role: true },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.startup.findMany({
      where: {
        ...(stageFilter && ["IDEA", "MVP", "EARLY", "GROWTH"].includes(stageFilter)
          ? { stage: stageFilter as StartupStage }
          : {}),
        ...(chainFilter && ["SOLANA", "BASE", "ETHEREUM", "ARC"].includes(chainFilter)
          ? { chainFocus: chainFilter as StartupChainFocus }
          : {}),
      },
      include: {
        founder: {
          select: {
            id: true,
            name: true,
            founderProfileExtended: {
              select: { targetUser: true, businessModel: true, whyThisStartup: true },
            },
          },
        },
        investorIntroRequests: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.investorIntroRequest.findMany({
      where: { founderId: session.user.id },
      include: {
        startup: { select: { id: true, name: true } },
        investor: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.jobPost.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        company: true,
        chainFocus: true,
        applications: { select: { id: true } },
      },
    }),
    db.openClawConnection.findUnique({
      where: { userId: session.user.id },
    }),
    db.telegramWorkspace.findMany({
      where: { connection: { userId: session.user.id } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.telegramThread.findMany({
      where: { workspace: { connection: { userId: session.user.id } } },
      include: { messages: { take: 5, orderBy: { createdAt: "desc" } }, workspace: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    db.raiseRound.findMany({
      where: { founderUserId: session.user.id, isActive: true },
      include: { builderAsks: true, commitments: true, venture: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    db.tokenomicsModel.findMany({
      where: { createdById: session.user.id },
      include: {
        scenarios: {
          include: {
            allocations: { orderBy: { rowOrder: "asc" } },
            revisions: {
              orderBy: { revisionNumber: "desc" },
              take: 5,
            },
          },
          take: 3,
        },
        venture: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    db.scoreSnapshot.findFirst({
      where: { kind: "FOUNDER_LAUNCH_READINESS", scoredUserId: session.user.id },
      orderBy: { computedAt: "desc" },
    }),
  ]);

  const cofounderMatches = isFounder
    ? builders
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
        .slice(0, 6)
    : [];

  const nextMeetings = meetings.filter((meeting) => meeting.scheduledAt >= new Date());

  const saveStartupAction = async (formData: FormData) => {
    "use server";
    await upsertStartup(formData);
  };
  const saveFounderExtendedAction = async (formData: FormData) => {
    "use server";
    await upsertFounderProfileExtended(formData);
  };
  const saveCofounderPreferencesAction = async (formData: FormData) => {
    "use server";
    await upsertCofounderPreferences(formData);
  };
  const saveGithubActivityAction = async (formData: FormData) => {
    "use server";
    await upsertGithubActivity(formData);
  };
  const setArcBadgeAction = async () => {
    "use server";
    await setManualBadge("ARC_DEVELOPER");
  };
  const setSolanaBadgeAction = async () => {
    "use server";
    await setManualBadge("SOLANA_DEVELOPER");
  };
  const setEthereumBadgeAction = async () => {
    "use server";
    await setManualBadge("ETHEREUM_DEVELOPER");
  };
  const setBaseBadgeAction = async () => {
    "use server";
    await setManualBadge("BASE_BUILDER");
  };
  const saveInvestorProfileAction = async (formData: FormData) => {
    "use server";
    await upsertInvestorOperatingProfile(formData);
  };
  const requestInvestorIntroAction = async (formData: FormData) => {
    "use server";
    await requestInvestorIntro(formData);
  };
  const createChatThreadAction = async (formData: FormData) => {
    "use server";
    await createFounderChatThread(formData);
  };
  const sendChatMessageAction = async (formData: FormData) => {
    "use server";
    await sendFounderChatMessage(formData);
  };
  const saveCalendlyAction = async (formData: FormData) => {
    "use server";
    await upsertCalendlyLink(formData);
  };
  const createMeetingAction = async (formData: FormData) => {
    "use server";
    await createMeetingRecord(formData);
  };
  const saveMarketSignalAction = async (formData: FormData) => {
    "use server";
    await saveMarketSignal(formData);
  };
  const generateMarketInsightAction = async (formData: FormData) => {
    "use server";
    await generateFounderMarketInsight(formData);
  };
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
  const createTokenomicsScenarioAction = async (formData: FormData) => {
    "use server";
    await createTokenomicsScenario(formData);
  };
  const upsertAllocationRowsAction = async (formData: FormData) => {
    "use server";
    await upsertAllocationRows(formData);
  };
  const importTokenomicsSheetAction = async (formData: FormData) => {
    "use server";
    await importTokenomicsSheet(formData);
  };
  const rollbackTokenomicsRevisionAction = async (formData: FormData) => {
    "use server";
    await rollbackTokenomicsScenarioRevision(formData);
  };
  const recomputeFounderScoreAction = async (formData: FormData) => {
    "use server";
    await recomputeMyScoresAction(formData);
  };

  return (
    <div className="space-y-5 py-8">
      <section className="rounded-xl border border-border/60 bg-card p-4">
        <h1 className="text-xl font-semibold">Founder OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build, hire, fundraise, collaborate, and execute from one operating dashboard.
        </p>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <span className="rounded-md border border-border/50 px-2 py-1">Startup Manager</span>
          <span className="rounded-md border border-border/50 px-2 py-1">Matches</span>
          <span className="rounded-md border border-border/50 px-2 py-1">Hiring Pipeline</span>
          <span className="rounded-md border border-border/50 px-2 py-1">AI Pitch</span>
          <span className="rounded-md border border-border/50 px-2 py-1">Investor Connect</span>
          <span className="rounded-md border border-border/50 px-2 py-1">Chat</span>
          <span className="rounded-md border border-border/50 px-2 py-1">Market Insights</span>
          <span className="rounded-md border border-border/50 px-2 py-1">GitHub Activity</span>
          <span className="rounded-md border border-border/50 px-2 py-1">Jobs</span>
          <span className="rounded-md border border-border/50 px-2 py-1">Meetings</span>
          <span className="rounded-md border border-border/50 px-2 py-1">Payments (Not enabled)</span>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Launch Readiness Snapshot</h2>
            <p className="text-xs text-muted-foreground">
              {latestFounderSnapshot
                ? `Latest snapshot: ${latestFounderSnapshot.score} (${latestFounderSnapshot.label ?? "n/a"}) at ${new Date(latestFounderSnapshot.computedAt).toLocaleString()}`
                : "No persisted launch-readiness snapshot yet."}
            </p>
          </div>
          <form action={recomputeFounderScoreAction}>
            <input type="hidden" name="scope" value="founder" />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Recompute readiness snapshot
            </button>
          </form>
        </div>
      </section>

      {isFounder ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold">Startup Manager</h2>
            <p className="mt-1 text-xs text-muted-foreground">You can manage up to 10 startup profiles here. Update anytime.</p>
            <form action={saveStartupAction} className="mt-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="name" placeholder="Startup name" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
                <select name="stage" defaultValue="IDEA" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {STARTUP_STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="tagline" placeholder="Tagline" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <select name="chainFocus" defaultValue="ARC" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {CHAIN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <textarea name="problem" placeholder="Problem you solve" rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="solution" placeholder="Your solution" rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="githubRepo" placeholder="GitHub repo URL" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <input name="pitchDeckUrl" placeholder="Pitch deck URL (or use /pitchdeck)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" name="isHiring" value="true" className="accent-cyan-500" />
                Hiring
              </label>
              <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200">
                Save startup
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {startups.length === 0 ? (
                <p className="text-xs text-muted-foreground">No startups yet.</p>
              ) : (
                startups.map((startup) => (
                  <div key={startup.id} className="rounded-md border border-border/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{startup.name}</p>
                      <Link href={`/startups/${startup.slug ?? startup.id}`} className="text-xs text-cyan-300">
                        Public page
                      </Link>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {startup.stage} | {startup.chainFocus} | Updated {fmtDate(startup.updatedAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold">Founder Profile Extension</h2>
            <p className="mt-1 text-xs text-muted-foreground">Used in matching, investor review, and AI pitch generation.</p>
            <form action={saveFounderExtendedAction} className="mt-3 space-y-2">
              <textarea name="whyThisStartup" defaultValue={founderExtended?.whyThisStartup ?? ""} rows={2} placeholder="Why this startup?" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="problemStatement" defaultValue={founderExtended?.problemStatement ?? ""} rows={2} placeholder="What problem are you solving?" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="targetUser" defaultValue={founderExtended?.targetUser ?? ""} rows={2} placeholder="Who is your target user?" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="businessModel" defaultValue={founderExtended?.businessModel ?? ""} rows={2} placeholder="How do you make money?" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="differentiation" defaultValue={founderExtended?.differentiation ?? ""} rows={2} placeholder="Why now and why you?" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
                Save founder profile extension
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {isFounder ? (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold">Co-founder Matching</h2>
            <p className="mt-1 text-xs text-muted-foreground">Motivation, role expectations, and working style aligned matches.</p>
            <form action={saveCofounderPreferencesAction} className="mt-3 space-y-2">
              <input name="roleWanted" defaultValue={cofounderPreferences?.roleWanted ?? ""} placeholder="Role wanted (ex: CTO, Product)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="equityExpectation" defaultValue={cofounderPreferences?.equityExpectation ?? ""} placeholder="Equity expectation" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <input name="timeCommitment" defaultValue={cofounderPreferences?.timeCommitment ?? ""} placeholder="Time commitment" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <input name="skillsNeeded" defaultValue={(cofounderPreferences?.skillsNeeded ?? []).join(", ")} placeholder="Skills needed (comma separated)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="workingStyle" defaultValue={cofounderPreferences?.workingStyle ?? ""} rows={2} placeholder="Working style expectations" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
                Save matching preferences
              </button>
            </form>
            <div className="mt-3 space-y-2">
              {cofounderMatches.length === 0 ? (
                <p className="text-xs text-muted-foreground">Add preferences to unlock match scoring.</p>
              ) : (
                cofounderMatches.map((item) => (
                  <div key={item.builder.id} className="rounded-md border border-border/50 p-2">
                    <p className="text-xs font-medium">
                      {item.builder.user.name ?? "Builder"} - {item.match.score}% match
                    </p>
                    <p className="text-[11px] text-muted-foreground">{item.match.reasons.join(" | ")}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold">Jobs & Opportunities</h2>
            <p className="mt-1 text-xs text-muted-foreground">Early access pipeline for builders and contributors.</p>
            <div className="mt-3 space-y-2">
              {openJobs.length === 0 ? (
                <p className="text-xs text-muted-foreground">No open jobs yet.</p>
              ) : (
                openJobs.map((job) => (
                  <div key={job.id} className="rounded-md border border-border/50 p-2">
                    <p className="text-sm">{job.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {job.company} {job.chainFocus ? `| ${job.chainFocus}` : ""} | {job.applications.length} applicants | Early access
                    </p>
                  </div>
                ))
              )}
            </div>
            <Link href="/app/jobs" className="mt-3 inline-flex text-xs text-cyan-300">
              Open jobs board
            </Link>
          </div>
        )}

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">GitHub Activity + Chain Badges</h2>
          <p className="mt-1 text-xs text-muted-foreground">Structured GitHub tracking (mock now, OAuth-ready later).</p>
          {isFounder && startups.length > 0 ? (
            <form action={saveGithubActivityAction} className="mt-3 space-y-2">
              <select name="startupId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue={startups[0]?.id}>
                {startups.map((startup) => (
                  <option key={startup.id} value={startup.id}>
                    {startup.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="githubUsername" defaultValue={githubConnection?.username ?? ""} placeholder="GitHub username" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
                <input name="repoUrl" placeholder="Repo URL" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              </div>
              <input name="lastCommitMessage" placeholder="Last commit message" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="contributorsCsv" placeholder="Contributors (comma separated)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <input name="techStackCsv" placeholder="Tech stack hints (comma separated)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
                Save activity
              </button>
            </form>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Founders can attach startup repositories here. Builders get badge visibility from profile activity.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(BADGE_LABELS) as BadgeType[]).map((badgeType) => (
              <form
                key={badgeType}
                action={
                  badgeType === "ARC_DEVELOPER"
                    ? setArcBadgeAction
                    : badgeType === "SOLANA_DEVELOPER"
                      ? setSolanaBadgeAction
                      : badgeType === "ETHEREUM_DEVELOPER"
                        ? setEthereumBadgeAction
                        : setBaseBadgeAction
                }
              >
                <button type="submit" className="rounded-full border border-border/70 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">
                  Add {BADGE_LABELS[badgeType]}
                </button>
              </form>
            ))}
          </div>

          <div className="mt-3 space-y-1">
            {badges.length === 0 ? (
              <p className="text-xs text-muted-foreground">No badges yet.</p>
            ) : (
              badges.map((badge) => (
                <p key={badge.id} className="text-xs">
                  {BADGE_LABELS[badge.badgeType]} {badge.verified ? "(verified)" : "(unverified)"}
                </p>
              ))
            )}
          </div>
          <div className="mt-3 space-y-2">
            {startupActivities.slice(0, 4).map((activity) => (
              <div key={activity.id} className="rounded-md border border-border/50 p-2">
                <p className="text-xs font-medium">{activity.startup.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {activity.repoName} | {activity.lastCommitMessage ?? "No commit message"} |{" "}
                  {activity.lastCommitAt ? fmtDate(activity.lastCommitAt) : "No commit date"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">Investor Connect</h2>
          <p className="mt-1 text-xs text-muted-foreground">Filter investors/startups and request intro with AI-generated pitch email.</p>

          {isInvestor ? (
            <form action={saveInvestorProfileAction} className="mt-3 space-y-2">
              <input name="fundName" defaultValue={investorOperatingProfile?.fundName ?? ""} placeholder="Fund name" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="investmentStage" defaultValue={investorOperatingProfile?.investmentStage ?? ""} placeholder="Investment stage" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
                <input name="ticketSize" defaultValue={investorOperatingProfile?.ticketSize ?? ""} placeholder="Ticket size" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <input name="chainsInterested" defaultValue={(investorOperatingProfile?.chainsInterested ?? []).join(", ")} placeholder="Chains interested (comma separated)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="thesis" defaultValue={investorOperatingProfile?.thesis ?? ""} rows={2} placeholder="Investment thesis" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
                Save investor profile
              </button>
            </form>
          ) : isFounder ? (
            <>
              <form action={requestInvestorIntroAction} className="mt-3 space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <select name="startupId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                    {startups.map((startup) => (
                      <option key={startup.id} value={startup.id}>
                        {startup.name}
                      </option>
                    ))}
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
                <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
                  Request intro + generate AI email
                </button>
              </form>
              <div className="mt-3 space-y-2">
                {investorIntros.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No investor intro requests yet.</p>
                ) : (
                  investorIntros.map((intro) => (
                    <div key={intro.id} className="rounded-md border border-border/50 p-2">
                      <p className="text-xs font-medium">
                        {intro.startup.name} -&gt; {intro.investor.user.name ?? intro.investor.fundName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {intro.status} | {fmtDate(intro.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Founder and investor role-specific tools appear here.</p>
          )}

          <div className="mt-4 rounded-md border border-border/50 p-3">
            <p className="text-xs font-medium">Startup discovery</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <Link href="/app/founder-os" className="rounded-full border border-border px-2 py-1">
                All
              </Link>
              {STARTUP_STAGE_OPTIONS.map((option) => (
                <Link key={option.value} href={`/app/founder-os?stage=${option.value}`} className="rounded-full border border-border px-2 py-1">
                  {option.label}
                </Link>
              ))}
              {CHAIN_OPTIONS.map((option) => (
                <Link key={option.value} href={`/app/founder-os?chain=${option.value}`} className="rounded-full border border-border px-2 py-1">
                  {option.label}
                </Link>
              ))}
            </div>
            <div className="mt-2 space-y-2">
              {startupDirectory.slice(0, 8).map((startup) => (
                <div key={startup.id} className="rounded-md border border-border/50 p-2">
                  <p className="text-xs font-medium">{startup.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {startup.stage} | {startup.chainFocus} | Intro requests: {startup.investorIntroRequests.length}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">Secure Chat</h2>
          <p className="mt-1 text-xs text-muted-foreground">Founder ↔ Builder, Founder ↔ Investor, and group chats linked to startup context.</p>
          <form action={createChatThreadAction} className="mt-3 space-y-2">
            <input name="title" placeholder="Chat title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <div className="grid gap-2 sm:grid-cols-2">
              <select name="startupId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue="">
                <option value="">No startup context</option>
                {startups.map((startup) => (
                  <option key={startup.id} value={startup.id}>
                    {startup.name}
                  </option>
                ))}
              </select>
              <select name="contextType" defaultValue="GENERAL" className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="GENERAL">General</option>
                <option value="BUILD">Build</option>
                <option value="HIRE">Hiring</option>
                <option value="FUNDING">Funding</option>
              </select>
            </div>
            <input name="contextLabel" placeholder="Context label (optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <select name="participantIds" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">No additional participant</option>
              {networkUsers.map((networkUser) => (
                <option key={networkUser.id} value={networkUser.id}>
                  {networkUser.name ?? "User"} ({networkUser.role})
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Create chat thread
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {chatThreads.length === 0 ? (
              <p className="text-xs text-muted-foreground">No chats yet.</p>
            ) : (
              chatThreads.map((thread) => (
                <div key={thread.id} className="rounded-md border border-border/50 p-2">
                  <p className="text-xs font-medium">{thread.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {thread.contextType} {thread.startup?.name ? `| ${thread.startup.name}` : ""} | Invite: /app/founder-os/join/{thread.inviteToken}
                  </p>
                  <div className="mt-1 space-y-1">
                    {thread.messages.map((message) => (
                      <p key={message.id} className="text-[11px] text-muted-foreground">
                        {message.sender.name ?? "User"}: {message.content}
                      </p>
                    ))}
                  </div>
                  <form action={sendChatMessageAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="threadId" value={thread.id} />
                    <input name="content" placeholder="Reply in chat" className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                      Send
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">Meetings</h2>
          <p className="mt-1 text-xs text-muted-foreground">Calendly link + lightweight upcoming meetings.</p>
          <form action={saveCalendlyAction} className="mt-3 flex gap-2">
            <input
              name="calendlyUrl"
              defaultValue={meetingLink?.calendlyUrl ?? ""}
              placeholder="https://calendly.com/your-handle"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Save
            </button>
          </form>
          <form action={createMeetingAction} className="mt-3 space-y-2">
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
                  <option key={startup.id} value={startup.id}>
                    {startup.name}
                  </option>
                ))}
              </select>
            </div>
            <textarea name="notes" rows={2} placeholder="Optional notes" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Add meeting
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {nextMeetings.length === 0 ? (
              <p className="text-xs text-muted-foreground">No upcoming meetings.</p>
            ) : (
              nextMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-md border border-border/50 p-2">
                  <p className="text-xs font-medium">{meeting.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtDate(meeting.scheduledAt)} | {meeting.host.name ?? "Host"} -&gt; {meeting.attendee.name ?? "Attendee"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">Market Intelligence</h2>
          <p className="mt-1 text-xs text-muted-foreground">Capture Reddit/Twitter signals and generate founder pain-point summaries.</p>
          <form action={saveMarketSignalAction} className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input name="source" placeholder="Source (Reddit, Twitter)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              <input name="signalType" placeholder="Signal type (Pain point, trend)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            </div>
            <input name="title" placeholder="Signal title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <textarea name="summary" rows={2} placeholder="Signal summary" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            <input name="signalUrl" placeholder="Signal URL (optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Save signal
            </button>
          </form>

          <form action={generateMarketInsightAction} className="mt-3 flex gap-2">
            <select name="startupId" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue="">
              <option value="">Generate general insight</option>
              {startups.map((startup) => (
                <option key={startup.id} value={startup.id}>
                  {startup.name}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Generate insight
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {insights.length === 0 ? (
              <p className="text-xs text-muted-foreground">No AI insights yet.</p>
            ) : (
              insights.map((insight) => (
                <div key={insight.id} className="rounded-md border border-border/50 p-2">
                  <p className="text-xs font-medium">
                    {insight.startup?.name ?? "General"} | {fmtDate(insight.createdAt)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Founder pain points: {insight.founderPainPoints}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Trending problems: {insight.trendingProblems}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">AI Pitch Intelligence</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload pitch deck, extract text, and score clarity/market strength with Gemini.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/pitchdeck" className="rounded-md border border-border px-3 py-2 text-xs text-cyan-300">
              Open pitch deck workspace
            </Link>
            <span className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
              VC cold email + one-liner generated in Intro flow
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">Future-ready modules</h2>
          <div className="mt-2 space-y-2 text-xs text-muted-foreground">
            <p className="rounded-md border border-border/50 px-3 py-2">Payments (Not enabled): milestone payout operations are not active yet.</p>
            <p className="rounded-md border border-border/50 px-3 py-2">Wallet claim flows (Not enabled): wallet linking is available in settings, SBT claim is not active.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">OpenClaw Telegram Ops</h2>
          <p className="mt-1 text-xs text-muted-foreground">Connect Telegram operations, sync chats/channels, and reply without leaving Founder OS.</p>
          <form action={connectOpenClawAction} className="mt-3 space-y-2">
            <input name="telegramBotToken" placeholder="Telegram bot token / OpenClaw token" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input name="workspaceExternalId" placeholder="Workspace external id (optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              {openClawConnection ? "Reconnect OpenClaw" : "Connect OpenClaw"}
            </button>
          </form>
          <form action={syncTelegramThreadsAction} className="mt-3 flex gap-2">
            <select name="workspaceId" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" defaultValue="">
              <option value="">Default workspace</option>
              {telegramWorkspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.title ?? workspace.externalId}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-border px-3 py-2 text-xs">
              Sync
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {telegramThreads.length === 0 ? (
              <p className="text-xs text-muted-foreground">No synced Telegram threads yet.</p>
            ) : (
              telegramThreads.slice(0, 4).map((thread) => (
                <div key={thread.id} className="rounded-md border border-border/50 p-2">
                  <p className="text-xs font-medium">{thread.title ?? "Untitled thread"}</p>
                  <p className="text-[11px] text-muted-foreground">{thread.workspace.title ?? thread.workspace.externalId}</p>
                  <div className="mt-1 space-y-1">
                    {thread.messages.map((message) => (
                      <p key={message.id} className="text-[11px] text-muted-foreground">
                        {message.direction}: {message.text}
                      </p>
                    ))}
                  </div>
                  <form action={sendTelegramReplyAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="threadId" value={thread.id} />
                    <input name="text" placeholder="Reply to thread" className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                      Send
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">Raise Round Manager</h2>
          <p className="mt-1 text-xs text-muted-foreground">Manage the current active raise round visible to investors.</p>
          {ventures.length === 0 ? (
            <div className="mt-3 rounded-md border border-border/50 p-3">
              <p className="text-xs text-muted-foreground">
                No venture records found. Create a venture in onboarding or the venture workspace before opening a round.
              </p>
            </div>
          ) : (
            <form action={createOrUpdateActiveRoundAction} className="mt-3 space-y-2">
              <select name="ventureId" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                {ventures.map((venture) => (
                  <option key={venture.id} value={venture.id}>
                    {venture.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="roundName" placeholder="Round name" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
                <input name="roundType" placeholder="Round type (Seed/Pre-seed/etc)" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input name="targetAmount" type="number" step="0.01" placeholder="Target amount" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
                <input name="raisedAmount" type="number" step="0.01" placeholder="Raised amount" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <input name="currency" placeholder="Currency (USD/USDC)" defaultValue="USD" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="minTicketSize" type="number" step="0.01" placeholder="Min ticket size" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <input name="maxTicketSize" type="number" step="0.01" placeholder="Max ticket size" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="runwayMonths" type="number" placeholder="Runway months" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <input name="closeDate" type="date" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <select name="status" defaultValue="ACTIVE" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
              <textarea name="updateNotes" rows={2} placeholder="Round update notes" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                Save active round
              </button>
            </form>
          )}

          <div className="mt-3 space-y-2">
            {activeRaiseRounds.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active raise round yet.</p>
            ) : (
              activeRaiseRounds.map((round) => (
                <div key={round.id} className="rounded-md border border-border/50 p-2">
                  <p className="text-xs font-medium">
                    {round.venture.name} - {round.roundName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {round.roundType} | {round.currency} {Number(round.raisedAmount)} / {Number(round.targetAmount)} | {round.status}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Soft committed: {round.currency} {Number(round.committedAmount)} | Interested: {round.currency} {Number(round.interestedAmount)} | Coverage:{" "}
                    {round.coverageRatio ? `${Number(round.coverageRatio).toFixed(2)}%` : "n/a"}
                  </p>
                  <form action={updateRoundProgressAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="roundId" value={round.id} />
                    <input name="raisedAmount" type="number" step="0.01" placeholder="Update raised amount" className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                      Update
                    </button>
                  </form>
                  <form action={updateRoundStatusAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="roundId" value={round.id} />
                    <select name="status" defaultValue={round.status} className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                      Set status
                    </button>
                  </form>
                  <form action={addBuilderRaiseAskAction} className="mt-2 space-y-2">
                    <input type="hidden" name="roundId" value={round.id} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input name="roleTitle" placeholder="Builder ask role" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                      <input name="skillTags" placeholder="Skill tags (comma separated)" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    </div>
                    <input name="askAmount" type="number" step="0.01" placeholder="Ask amount" className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    <textarea name="useOfFunds" rows={2} placeholder="Use of funds for this builder ask" className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
                    <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                      Add builder ask
                    </button>
                  </form>
                  {round.builderAsks.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {round.builderAsks.map((ask) => (
                        <p key={ask.id} className="text-[11px] text-muted-foreground">
                          Builder ask: {ask.roleTitle} | {ask.skillTags.join(", ")} | {ask.askAmount ? `${round.currency} ${Number(ask.askAmount)}` : "No amount"}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">Tokenomics Studio (Spreadsheet + XLSX/CSV)</h2>
        <p className="mt-1 text-xs text-muted-foreground">Build and import/export tokenomics allocations with vesting metadata.</p>
        {ventures.length === 0 ? (
          <div className="mt-3 rounded-md border border-border/50 p-3">
            <p className="text-xs text-muted-foreground">
              Add a venture first to create tokenomics scenarios.
            </p>
          </div>
        ) : (
          <form action={createTokenomicsScenarioAction} className="mt-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <select name="ventureId" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required>
                {ventures.map((venture) => (
                  <option key={venture.id} value={venture.id}>
                    {venture.name}
                  </option>
                ))}
              </select>
              <input name="name" placeholder="Tokenomics model name" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input name="totalSupply" type="number" step="0.0001" placeholder="Total supply" className="rounded-md border border-border bg-background px-3 py-2 text-sm" required />
              <input name="tokenSymbol" placeholder="Token symbol" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="scenarioName" placeholder="Scenario name" defaultValue="Base Scenario" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <input name="fdvAssumption" type="number" step="0.01" placeholder="FDV assumption" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="circulatingSupply" type="number" step="0.0001" placeholder="Circulating supply" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input name="tgeDate" type="date" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <textarea name="notes" rows={2} placeholder="Tokenomics notes" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
              Create tokenomics model
            </button>
          </form>
        )}
        <div className="mt-3 space-y-3">
          {tokenomicsModels.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tokenomics models yet.</p>
          ) : (
            tokenomicsModels.map((model) => (
              <div key={model.id} className="rounded-md border border-border/50 p-3">
                <p className="text-sm font-medium">
                  {model.name} ({model.tokenSymbol ?? "TOKEN"}) - Total Supply {Number(model.totalSupply)}
                </p>
                <p className="text-[11px] text-muted-foreground">Venture: {model.venture.name}</p>
                {model.scenarios.map((scenario) => (
                  <div key={scenario.id} className="mt-2 rounded-md border border-border/50 p-2">
                    <p className="text-xs font-medium">{scenario.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      FDV: {scenario.fdvAssumption ? Number(scenario.fdvAssumption) : "-"} | Circ: {scenario.circulatingSupply ? Number(scenario.circulatingSupply) : "-"}
                    </p>
                    <form action={upsertAllocationRowsAction} className="mt-2 space-y-1">
                      <input type="hidden" name="scenarioId" value={scenario.id} />
                      <input type="hidden" name="revisionReason" value="table_editor_update" />
                      <div className="grid gap-1">
                        <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground">
                          <span>Label</span>
                          <span>%</span>
                          <span>Token Amount</span>
                          <span>Cliff (m)</span>
                          <span>Vesting (m)</span>
                          <span>Cadence</span>
                          <span>Notes</span>
                        </div>
                        {Array.from({ length: 8 }).map((_, idx) => {
                          const row = scenario.allocations[idx];
                          return (
                            <div key={`${scenario.id}-row-${idx}`} className="grid grid-cols-7 gap-1">
                              <input name="rowLabel" defaultValue={row?.label ?? ""} placeholder="Team" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                              <input name="rowPercentage" defaultValue={row?.percentage ? Number(row.percentage) : undefined} type="number" step="0.0001" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                              <input name="rowTokenAmount" defaultValue={row?.tokenAmount ? Number(row.tokenAmount) : undefined} type="number" step="0.0001" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                              <input name="rowCliffMonths" defaultValue={row?.cliffMonths ?? undefined} type="number" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                              <input name="rowVestingMonths" defaultValue={row?.vestingMonths ?? undefined} type="number" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                              <input name="rowUnlockCadence" defaultValue={row?.unlockCadence ?? ""} placeholder="monthly" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                              <input name="rowNotes" defaultValue={row?.notes ?? ""} placeholder="notes" className="rounded-md border border-border bg-background px-2 py-1 text-xs" />
                            </div>
                          );
                        })}
                      </div>
                      <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                        Save allocation rows
                      </button>
                    </form>
                    <form action={importTokenomicsSheetAction} className="mt-2 space-y-1">
                      <input type="hidden" name="scenarioId" value={scenario.id} />
                      <input type="file" name="file" accept=".csv,.xlsx,.xls" className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
                      <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                        Import CSV/XLSX
                      </button>
                    </form>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a href={`/api/tokenomics/${scenario.id}/export?format=csv`} className="rounded-md border border-border px-2 py-1 text-[11px] text-cyan-300">
                        Export CSV
                      </a>
                      <a href={`/api/tokenomics/${scenario.id}/export?format=xlsx`} className="rounded-md border border-border px-2 py-1 text-[11px] text-cyan-300">
                        Export XLSX
                      </a>
                    </div>
                    {scenario.revisions.length > 0 ? (
                      <form action={rollbackTokenomicsRevisionAction} className="mt-2 flex gap-2">
                        <select name="revisionId" className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
                          {scenario.revisions.map((revision) => (
                            <option key={revision.id} value={revision.id}>
                              Revision #{revision.revisionNumber} ({fmtDate(revision.createdAt)})
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="rounded-md border border-border px-2 py-1 text-xs">
                          Rollback
                        </button>
                      </form>
                    ) : null}
                    <div className="mt-2 space-y-1">
                      {scenario.allocations.map((row) => (
                        <p key={row.id} className="text-[11px] text-muted-foreground">
                          {row.label}: {row.percentage ? `${Number(row.percentage)}%` : "-"} | {row.tokenAmount ? Number(row.tokenAmount) : "-"} tokens | cliff {row.cliffMonths ?? 0}m | vest {row.vestingMonths ?? 0}m | {row.unlockCadence ?? "n/a"}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
