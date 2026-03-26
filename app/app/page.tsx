import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  Sparkles,
  User,
  Building2,
  MessageSquare,
  Crown,
  AlertTriangle,
  Rocket,
  Award,
  ExternalLink,
  Github,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";
import { getRecommendedBuildersForFounder, getRecommendedProjectsForBuilder } from "@/lib/recommendations";
import { getBuilderAffiliation, getFounderAffiliation } from "@/lib/affiliation";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";
import { CompanyLogo } from "@/components/common/CompanyLogo";
import { HiringInterestForm } from "@/components/hiring/HiringInterestForm";
import { RetryAnalysisButton } from "@/components/pitchdeck/RetryAnalysisButton";

function getCompletionScore(fields: Array<unknown>) {
  const filled = fields.filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  }).length;
  return Math.round((filled / fields.length) * 100);
}

function stageLabel(stage?: string | null) {
  if (stage === "LIVE") return "Live";
  if (stage === "MVP") return "MVP";
  if (stage === "IDEA") return "Idea";
  return "Unspecified";
}

type KolPayload = {
  category?: string;
  budgetRange?: string;
  campaignGoal?: string;
  priorityTier?: "STANDARD" | "PREMIUM";
  targetRegion?: string;
  targetKolCount?: number;
  timelineDays?: number;
};

function asKolPayload(value: unknown): KolPayload {
  if (!value || typeof value !== "object") return {};
  return value as KolPayload;
}

export default async function AppDashboard() {
  const session = await getServerSession(authOptions);
  const user = session!.user;
  const isBuilder = user.role === "BUILDER";
  const isFounder = user.role === "FOUNDER";
  const isInvestor = user.role === "INVESTOR";
  const isAdmin = user.role === "ADMIN";

  const safe = async <T,>(promise: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await promise;
    } catch {
      return fallback;
    }
  };

  const [
    applications,
    projectCount,
    founderStartupCount,
    builderProfile,
    founderProfile,
    investorProfile,
    introRequests,
    latestDeck,
    founderMatches,
    builderMatches,
    openJobs,
    myJobApplicationsCount,
    myPostedJobs,
    investorProjects,
    founderHiringInterests,
    kolRequestsCount,
    hiringFounders,
    latestKolRequest,
    latestOwnedProject,
    latestIntroRequest,
    latestJobApplication,
    builderProjects,
    investorOperatingProfile,
  ] = await Promise.all([
    safe(isInvestor ? Promise.resolve(0) : db.application.count({ where: { userId: user.id } }), 0),
    safe(db.project.count({ where: { ownerUserId: user.id } }), 0),
    safe(isFounder ? db.startup.count({ where: { founderId: user.id } }) : Promise.resolve(0), 0),
    safe(
      isBuilder
        ? db.builderProfile.findUnique({
            where: { userId: user.id },
            // Avoid selecting columns that may not exist yet in older DBs.
            select: {
              id: true,
              userId: true,
              handle: true,
              title: true,
              headline: true,
              independent: true,
              openToWork: true,
              skills: true,
              preferredChains: true,
              openTo: true,
              bio: true,
              github: true,
              linkedin: true,
              twitter: true,
              website: true,
              portfolioUrl: true,
              resumeUrl: true,
              achievements: true,
              openSourceContributions: true,
              publicVisible: true,
              verifiedByWebcoinLabs: true,
              updatedAt: true,
            },
          })
        : Promise.resolve(null),
      null,
    ),
    safe(isFounder ? db.founderProfile.findUnique({ where: { userId: user.id } }) : Promise.resolve(null), null),
    safe(isInvestor ? db.investorProfile.findUnique({ where: { userId: user.id } }) : Promise.resolve(null), null),
    safe(isFounder ? db.introRequest.count({ where: { founderId: user.id } }) : Promise.resolve(0), 0),
    safe(
      isFounder || isBuilder
        ? db.pitchDeck.findFirst({
            where: {
              userId: user.id,
              OR: [
                { uploadAsset: { is: null } },
                { uploadAsset: { is: { status: { in: ["ACTIVE", "FLAGGED", "REPROCESSING"] } } } },
              ],
            },
            include: { reports: { orderBy: { createdAt: "desc" }, take: 1 } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve(null),
      null,
    ),
    safe(isFounder ? getRecommendedBuildersForFounder(user.id, 6) : Promise.resolve([]), []),
    safe(isBuilder ? getRecommendedProjectsForBuilder(user.id, 6) : Promise.resolve([]), []),
    safe(
      isBuilder
        ? db.jobPost.findMany({
            where: { status: "OPEN" },
            orderBy: { createdAt: "desc" },
            include: { project: { select: { id: true, name: true } } },
            take: 6,
          })
        : Promise.resolve([]),
      [],
    ),
    safe(isBuilder ? db.jobApplication.count({ where: { userId: user.id } }) : Promise.resolve(0), 0),
    safe(isFounder ? db.jobPost.count({ where: { createdByUserId: user.id } }) : Promise.resolve(0), 0),
    isInvestor
      ? safe(
          db.project.findMany({
            where: { publicVisible: true },
            select: { id: true, name: true, stage: true, chainFocus: true, tagline: true },
            orderBy: { createdAt: "desc" },
            take: 6,
          }),
          [],
        )
      : Promise.resolve([]),
    isFounder
      ? safe(
          db.hiringInterest.findMany({
            where: { founderId: user.id },
            orderBy: { createdAt: "desc" },
            take: 6,
          }),
          [],
        )
      : Promise.resolve([]),
    safe(isFounder ? db.introRequest.count({ where: { founderId: user.id, type: "KOL" } }) : Promise.resolve(0), 0),
    isBuilder
      ? safe(
          db.founderProfile.findMany({
            where: { isHiring: true, userId: { not: user.id } },
            include: {
              user: { select: { id: true, name: true } },
              _count: { select: { hiringInterests: true } },
            },
            orderBy: { updatedAt: "desc" },
            take: 4,
          }),
          [],
        )
      : Promise.resolve([]),
    isFounder
      ? safe(
          db.introRequest.findFirst({
            where: { founderId: user.id, type: "KOL" },
            select: { id: true, status: true, updatedAt: true, requestPayload: true },
            orderBy: { updatedAt: "desc" },
          }),
          null,
        )
      : Promise.resolve(null),
    safe(
      isFounder
        ? db.project.findFirst({
            where: { ownerUserId: user.id },
            select: { id: true, name: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve(null),
      null,
    ),
    isFounder
      ? safe(
          db.introRequest.findFirst({
            where: { founderId: user.id },
            select: { id: true, type: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
          }),
          null,
        )
      : Promise.resolve(null),
    isBuilder
      ? safe(
          db.jobApplication.findFirst({
            where: { userId: user.id },
            select: {
              id: true,
              updatedAt: true,
              job: { select: { title: true } },
            },
            orderBy: { updatedAt: "desc" },
          }),
          null,
        )
      : Promise.resolve(null),
    isBuilder
      ? safe(
          db.builderProject.findMany({
            where: { builderId: user.id },
            orderBy: { updatedAt: "desc" },
            take: 4,
          }),
          [],
        )
      : Promise.resolve([]),
    isInvestor ? safe(db.investor.findUnique({ where: { userId: user.id } }), null) : Promise.resolve(null),
  ]);

  const latestReport = latestDeck?.reports[0];

  const builderCompletion = getCompletionScore([
    builderProfile?.title,
    builderProfile?.headline,
    builderProfile?.skills,
    builderProfile?.preferredChains,
    builderProfile?.openTo,
    builderProfile?.bio,
    builderProfile?.achievements,
    builderProfile?.openSourceContributions,
    builderProfile?.independent,
    builderProfile?.openToWork,
    builderProfile?.github || builderProfile?.portfolioUrl || builderProfile?.resumeUrl,
  ]);
  const founderCompletion = getCompletionScore([
    founderProfile?.companyName,
    founderProfile?.companyDescription,
    founderProfile?.roleTitle,
    founderProfile?.companyLogoUrl,
    founderProfile?.chainFocus,
    founderProfile?.projectStage,
    founderProfile?.currentNeeds,
    founderProfile?.website,
    founderProfile?.isHiring !== undefined ? "x" : null,
  ]);
  const investorCompletion = getCompletionScore([
    investorProfile?.firmName,
    investorProfile?.roleTitle,
    investorProfile?.focus,
    investorProfile?.website,
    investorProfile?.ticketSize,
    investorProfile?.lookingFor,
    investorProfile?.investmentThesis,
  ]);
  const founderCompanyName = founderProfile?.companyName?.trim();
  const founderHasValidCompanyName = Boolean(founderCompanyName && founderCompanyName.toLowerCase() !== "check");
  const founderStartupRequired = isFounder && founderStartupCount < 1;
  const founderCombinedCompletion = founderStartupRequired ? Math.min(founderCompletion, 79) : founderCompletion;
  const completion = isBuilder
    ? builderCompletion
    : isFounder
      ? founderCombinedCompletion
      : isInvestor
        ? investorCompletion
        : 100;
  const profileComplete = completion >= 80 && !founderStartupRequired;

  const founderAffiliation = getFounderAffiliation(founderProfile);
  const builderAffiliation = getBuilderAffiliation(builderProfile);
  const latestActivityLabel = isFounder
    ? latestIntroRequest
      ? `Intro ${latestIntroRequest.type} updated ${new Date(latestIntroRequest.updatedAt).toLocaleDateString()}`
      : latestOwnedProject
        ? `Project "${latestOwnedProject.name}" updated ${new Date(latestOwnedProject.updatedAt).toLocaleDateString()}`
        : "No founder activity yet."
    : isBuilder
      ? latestJobApplication
        ? `Applied to "${latestJobApplication.job.title}" on ${new Date(latestJobApplication.updatedAt).toLocaleDateString()}`
        : builderProfile?.updatedAt
          ? `Profile updated ${new Date(builderProfile.updatedAt).toLocaleDateString()}`
          : "No builder activity yet."
      : isInvestor
        ? investorProjects[0]
          ? `Reviewed ${investorProjects[0].name} recently.`
          : "No investor activity yet."
        : "Admin activity is available in admin panels.";
  const founderToneCard = "border-zinc-700/70 bg-zinc-950/70";

  return (
    <div className="space-y-8 py-8">
      <section className={`rounded-2xl border p-6 ${isFounder ? founderToneCard : "border-border/50 bg-card"}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ProfileAvatar
              src={user.image}
              alt={user.name ?? "User"}
              fallback={user.name?.charAt(0) ?? "U"}
              className="h-12 w-12 rounded-xl"
              fallbackClassName="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-lg text-cyan-300"
            />
            <div>
              {isFounder ? <p className="text-[10px] uppercase tracking-[0.22em] text-orange-300/90">// Founder Command Interface</p> : null}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={isFounder ? "text-3xl font-black uppercase tracking-tight" : "text-xl font-semibold"}>
                  {isFounder ? "Founder Dashboard" : `Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
                </h1>
                {isFounder && founderHasValidCompanyName ? (
                  <span className="inline-flex items-center gap-2">
                    <CompanyLogo
                      src={founderProfile?.companyLogoUrl}
                      alt={founderCompanyName ?? "Company"}
                      fallback={founderCompanyName ?? "Company"}
                      className="h-6 w-6 rounded-md border border-border/60 bg-background p-0.5"
                      fallbackClassName="rounded-md border border-border/60 bg-background text-[9px] text-muted-foreground"
                      imgClassName="p-0.5"
                    />
                    {founderAffiliation ? <ProfileAffiliationTag label={founderAffiliation.label} variant="founder" /> : null}
                  </span>
                ) : null}
                {isBuilder ? <ProfileAffiliationTag label={builderAffiliation.label} variant={builderAffiliation.variant} /> : null}
                {isInvestor && investorProfile?.firmName ? <ProfileAffiliationTag label={investorProfile.firmName} /> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {isFounder
                  ? "Layered venture control panel with dedicated modules and focused execution lanes."
                  : isInvestor
                    ? "Your investor intelligence workspace."
                    : "Your Webcoin Labs founder-builder workspace."}
              </p>
            </div>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${isFounder ? "border-orange-500/40 text-orange-300" : "border-cyan-500/40 text-cyan-300"}`}>
            {user.role}
          </span>
        </div>
      </section>

      {!profileComplete && (isBuilder || isFounder || isInvestor) ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
            <div>
              <p className="font-semibold">Complete at least 80% profile to access all tools</p>
              <p className="text-sm text-muted-foreground">
                {founderStartupRequired
                  ? "Startup section is mandatory for founder tools like hiring, intros, and premium modules."
                  : "Profiles drive recommendations, intros, and hiring outcomes."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/profile" className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/20">
              Complete Profile <ArrowRight className="h-4 w-4" />
            </Link>
            {founderStartupRequired ? (
              <Link href="/app/founder-os" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20">
                Add Startup <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className={`rounded-xl border p-5 ${isFounder ? founderToneCard : "border-border/50 bg-card"}`}>
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium">Profile Completion</span>
          </div>
          <p className="text-2xl font-semibold">{completion}%</p>
          <div className="mt-2 h-2 rounded-full bg-border">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${completion}%` }} />
          </div>
        </div>
        <div className={`rounded-xl border p-5 ${isFounder ? founderToneCard : "border-border/50 bg-card"}`}>
          <div className="mb-3 flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-green-300" />
            <span className="text-sm font-medium">{isBuilder ? "Builder Projects" : "Projects"}</span>
          </div>
          <p className="text-2xl font-semibold">{isBuilder ? builderProjects.length : projectCount}</p>
          <Link href={isBuilder ? "/app/builder-projects" : "/app/projects"} className="mt-2 inline-flex items-center gap-1 text-xs text-blue-300">
            {isBuilder ? "Manage builder projects" : "Manage projects"} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className={`rounded-xl border p-5 ${isFounder ? founderToneCard : "border-border/50 bg-card"}`}>
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-300" />
            <span className="text-sm font-medium">{isFounder ? "Hiring Status" : "Availability"}</span>
          </div>
          <p className="text-lg font-semibold">
            {isFounder ? (founderProfile?.isHiring ? "Hiring" : "Not hiring") : isBuilder ? (builderProfile?.openToWork ? "Available" : "Unavailable") : "N/A"}
          </p>
          {isFounder ? (
            <p className="mt-2 text-xs text-muted-foreground">{founderHiringInterests.length} incoming interests</p>
          ) : isBuilder ? (
            <p className="mt-2 text-xs text-muted-foreground">{myJobApplicationsCount} job applications submitted</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Role-specific activity only</p>
          )}
        </div>
        <div className={`rounded-xl border p-5 ${isFounder ? founderToneCard : "border-border/50 bg-card"}`}>
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-300" />
            <span className="text-sm font-medium">Latest AI Pitch Report</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {latestDeck ? `${latestDeck.originalFileName} | ${latestReport?.status ?? "QUEUED"}` : "No pitch deck uploaded yet."}
          </p>
          <p className="mt-1 text-xs text-emerald-300">Clarity: {latestReport?.clarityScore ?? "-"}</p>
        </div>
        <div className={`rounded-xl border p-5 ${isFounder ? founderToneCard : "border-border/50 bg-card"}`}>
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-cyan-300" />
            <span className="text-sm font-medium">Latest Activity</span>
          </div>
          <p className="text-sm text-muted-foreground">{latestActivityLabel}</p>
        </div>
      </section>

      {isFounder ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className={`rounded-2xl border p-6 ${founderToneCard}`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.08em]">Company Identity</p>
                  <p className="text-xs text-muted-foreground">Founder identity used across founder discovery, hiring, and investor visibility.</p>
                </div>
                {founderProfile?.isHiring ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-200">
                    Hiring
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-start gap-4">
                <CompanyLogo
                  src={founderProfile?.companyLogoUrl}
                  alt={founderHasValidCompanyName ? founderCompanyName ?? "Company" : "Company"}
                  fallback={founderHasValidCompanyName ? founderCompanyName ?? "Company" : "Company"}
                  className="h-14 w-14 rounded-xl border border-border/60 bg-background p-1"
                  fallbackClassName="rounded-xl border border-border/60 bg-background text-sm text-muted-foreground"
                  imgClassName="p-1"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold">{founderHasValidCompanyName ? founderCompanyName : "Add company name"}</p>
                    {founderHasValidCompanyName && founderAffiliation ? (
                      <ProfileAffiliationTag label={founderAffiliation.label} variant="founder" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {founderProfile?.roleTitle ?? "Add founder title"} | {founderProfile?.chainFocus ?? "Add chain focus"} | {stageLabel(founderProfile?.projectStage)}
                  </p>
                  {founderProfile?.companyDescription ? (
                    <p className="mt-2 max-w-xl text-sm text-muted-foreground line-clamp-3">{founderProfile.companyDescription}</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Projects: {projectCount}</span>
                <span>Startups: {founderStartupCount}</span>
                <span>Jobs posted: {myPostedJobs}</span>
                <span>Intro requests: {introRequests}</span>
                {founderProfile?.website ? (
                  <a href={founderProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200">
                    Website
                  </a>
                ) : null}
              </div>
              {founderStartupRequired ? (
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Add at least one startup in Founder OS to unlock hiring and intro workflows.
                </div>
              ) : null}
            </div>

            <div className={`rounded-2xl border p-6 ${founderToneCard}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.08em]">Recommended Builders</p>
                <Link href="/builders" className="text-xs text-orange-300 hover:text-orange-200">Browse all</Link>
              </div>
              {founderMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">Complete founder profile fields to unlock stronger builder recommendations.</p>
              ) : (
                <div className="space-y-3">
                  {founderMatches.map((match) => {
                    const affiliation = getBuilderAffiliation(match.builder);
                    return (
                      <div key={match.builder.id} className="rounded-lg border border-zinc-700/70 bg-zinc-900/40 p-3 transition-colors hover:border-zinc-500/80">
                        <div className="flex flex-wrap items-center gap-2">
                          <ProfileAvatar
                            src={match.builder.user.image}
                            alt={match.builder.user.name ?? "Builder"}
                            fallback={(match.builder.user.name ?? "B").charAt(0)}
                            className="h-7 w-7 rounded-full border border-border/60"
                            fallbackClassName="bg-cyan-500/10 text-[10px] text-cyan-300"
                          />
                          <p className="text-sm font-medium">{match.builder.user.name ?? "Builder"}</p>
                          <ProfileAffiliationTag label={affiliation.label} variant={affiliation.variant} />
                          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] text-orange-200">
                            {match.match.score}% match
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{match.match.reasons.join(" | ")}</p>
                        <Link href={`/builders/${match.builder.handle ?? match.builder.user.id}`} className="mt-2 inline-block text-xs text-orange-300 hover:text-orange-200">
                          View profile
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-6 ${founderToneCard}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.08em]">Founder Workspace</p>
                <Link href="/app/founder-os" className="text-xs text-orange-300 hover:text-orange-200">
                  Open Founder OS
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                Founder OS is now a separate operating system, accessed from sidebar Operating Systems or Apps / Launcher.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {founderStartupRequired ? (
              <div className={`rounded-2xl border p-6 ${founderToneCard}`}>
                <div className="mb-3 flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-orange-300" />
                  <p className="text-sm font-semibold uppercase tracking-[0.08em]">Founder tools are locked</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete startup setup first. Once at least one startup is added, Hiring, KOL Premium, and investor-facing
                  tools will unlock automatically.
                </p>
                <Link href="/app/founder-os" className="mt-3 inline-flex items-center gap-1 text-xs text-orange-300 hover:text-orange-200">
                  Open Startup Manager <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : null}
            {!founderStartupRequired ? (
            <div className={`rounded-2xl border p-6 ${founderToneCard}`}>
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.08em]">Hiring Interests</p>
              </div>
              {founderHiringInterests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No builder interests yet. Turn on hiring in your profile to attract submissions.</p>
              ) : (
                <div className="space-y-2">
                  {founderHiringInterests.slice(0, 4).map((interest) => (
                    <div key={interest.id} className="rounded-lg border border-border/50 p-3">
                      <p className="text-sm font-medium">{interest.name}</p>
                      <p className="text-xs text-muted-foreground">{interest.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{interest.skills}</p>
                      <span className="mt-2 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        {interest.status}
                      </span>
                    </div>
                  ))}
                  <Link href="/app/hiring" className="inline-flex items-center gap-1 text-xs text-orange-300 hover:text-orange-200">
                    Open hiring inbox <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
            ) : null}

            {!founderStartupRequired ? (
            <div className={`rounded-2xl border p-6 ${founderToneCard}`}>
              <div className="mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.08em]">KOL Premium</p>
              </div>
              <p className="text-xs text-muted-foreground">
                KOL requests: {kolRequestsCount} | Latest: {latestKolRequest?.status ?? "No request yet"}
              </p>
              {latestKolRequest ? (
                <p className="mt-2 text-xs text-amber-200/90">
                  Tier: {asKolPayload(latestKolRequest.requestPayload).priorityTier ?? "STANDARD"} | Updated{" "}
                  {new Date(latestKolRequest.updatedAt).toLocaleDateString()}
                </p>
              ) : null}
              <Link href="/app/kols-premium" className="mt-3 inline-flex items-center gap-1 text-xs text-amber-300">
                Open KOL Premium board <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            ) : null}

            {!founderStartupRequired ? (
            <div className={`rounded-2xl border p-6 ${founderToneCard}`}>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.08em]">Pitch Deck & AI Report</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Deck: {latestDeck ? latestDeck.originalFileName : "Not uploaded"} | Upload: {latestDeck?.uploadStatus ?? "N/A"} | Process: {latestDeck?.processingStatus ?? "N/A"} | Report: {latestReport?.status ?? "Not started"}
              </p>
              <p className="mt-2 text-xs text-emerald-300">
                Type: {latestReport?.deckType ?? "unclear"} | Clarity: {latestReport?.clarityScore ?? "-"} | Investor Readiness: {latestReport?.investorReadinessScore ?? "-"}
              </p>
              {latestReport?.marketPositioningSummary ? (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{latestReport.marketPositioningSummary}</p>
              ) : null}
              {latestReport?.status === "FAILED" && latestDeck ? (
                <div className="mt-3">
                  <RetryAnalysisButton pitchDeckId={latestDeck.id} />
                </div>
              ) : null}
              <Link href="/pitchdeck" className="mt-3 inline-flex items-center gap-1 text-xs text-orange-300 hover:text-orange-200">
                Open pitch area <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {isBuilder ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-medium">Builder Identity</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProfileAvatar
                  src={user.image}
                  alt={user.name ?? "Builder"}
                  fallback={(user.name ?? "B").charAt(0)}
                  className="h-8 w-8 rounded-full border border-border/60"
                  fallbackClassName="bg-cyan-500/10 text-xs text-cyan-300"
                />
                <p className="text-base font-semibold">{user.name ?? "Builder"}</p>
                <ProfileAffiliationTag label={builderAffiliation.label} variant={builderAffiliation.variant} />
                {builderProfile?.openToWork ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                    Open to work
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{builderProfile?.headline ?? builderProfile?.title ?? "Add your headline"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(builderProfile?.skills ?? []).slice(0, 6).map((skill) => (
                  <span key={skill} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {builderProfile?.linkedin ? (
                  <a href={builderProfile.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                    <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                ) : null}
                {builderProfile?.twitter ? (
                  <span className="inline-flex items-center gap-1 text-cyan-300">
                    <ExternalLink className="h-3.5 w-3.5" /> {builderProfile.twitter}
                  </span>
                ) : null}
                {builderProfile?.resumeUrl ? (
                  <a href={builderProfile.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-300">
                    <FileText className="h-3.5 w-3.5" /> Resume
                  </a>
                ) : null}
              </div>
              {builderProfile?.achievements ? (
                <p className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2 text-xs text-muted-foreground">
                  <span className="font-medium text-cyan-200">Achievements:</span> {builderProfile.achievements}
                </p>
              ) : null}
              {builderProfile?.openSourceContributions ? (
                <p className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-xs text-muted-foreground">
                  <span className="font-medium text-emerald-200">Open source:</span> {builderProfile.openSourceContributions}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-300" />
                  <p className="text-sm font-medium">Builder Portfolio</p>
                </div>
                <Link href="/app/builder-projects" className="text-xs text-blue-300">
                  Manage portfolio
                </Link>
              </div>
              {builderProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add your shipped projects, GitHub links, achievements, and open-source impact to unlock stronger hiring matches.
                </p>
              ) : (
                <div className="space-y-3">
                  {builderProjects.map((project) => (
                    <div key={project.id} className="rounded-lg border border-border/50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{project.title}</p>
                        {project.githubUrl ? (
                          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-300">
                            <Github className="h-3.5 w-3.5" /> GitHub
                          </a>
                        ) : null}
                      </div>
                      {project.tagline ? <p className="mt-1 text-xs text-muted-foreground">{project.tagline}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.techStack.slice(0, 5).map((item) => (
                          <span key={item} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Recommended Projects</p>
                <Link href="/projects" className="text-xs text-blue-300">Browse all</Link>
              </div>
              {builderMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">Complete your builder profile to unlock stronger project recommendations.</p>
              ) : (
                <div className="space-y-3">
                  {builderMatches.map((match) => {
                    const founderTag = getFounderAffiliation(match.project.owner.founderProfile);
                    return (
                      <div key={match.project.id} className="rounded-lg border border-border/50 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{match.project.name}</p>
                          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                            {match.match.score}% match
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-muted-foreground">{match.project.owner.name ?? "Founder"}</p>
                          {founderTag ? <ProfileAffiliationTag label={founderTag.label} variant="founder" /> : null}
                          {match.project.owner.founderProfile?.isHiring ? (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                              Hiring
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{match.match.reasons.join(" | ")}</p>
                        <Link href={`/projects/${match.project.slug ?? match.project.id}`} className="mt-2 inline-block text-xs text-blue-300">
                          View project
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-medium">Jobs</p>
              </div>
              <p className="text-2xl font-semibold">{openJobs.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Open roles | {myJobApplicationsCount} applied</p>
              <Link href="/app/jobs" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-300">
                Browse jobs <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Founders Hiring</p>
                <Link href="/app/hiring" className="text-xs text-blue-300">View all</Link>
              </div>
              {hiringFounders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active hiring founders right now.</p>
              ) : (
                <div className="space-y-3">
                  {hiringFounders.map((founder) => (
                    <div key={founder.id} className="rounded-lg border border-border/50 p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <CompanyLogo
                          src={founder.companyLogoUrl}
                          alt={founder.companyName ?? "Company"}
                          fallback={founder.companyName ?? "Company"}
                          className="h-8 w-8 rounded-lg border border-border/60 bg-background p-1"
                          fallbackClassName="rounded-lg border border-border/60 bg-background text-[10px] text-muted-foreground"
                          imgClassName="p-1"
                        />
                        <p className="text-sm font-medium">{founder.user.name ?? "Founder"}</p>
                        {founder.companyName ? <ProfileAffiliationTag label={founder.companyName} variant="founder" /> : null}
                      </div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {founder.roleTitle ?? "Founder"} {founder.chainFocus ? `| ${founder.chainFocus}` : ""} | {founder._count.hiringInterests} interests
                      </p>
                      <HiringInterestForm
                        founderId={founder.userId}
                        founderLabel={founder.companyName ?? founder.user.name ?? "Founder"}
                        initialName={user.name ?? ""}
                        initialEmail={user.email ?? ""}
                        compact
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {isInvestor ? (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-300">
              <Crown className="h-3.5 w-3.5" />
              Investor Module
            </div>
            <div className="mb-3 flex items-center gap-3">
              <CompanyLogo
                src={user.image}
                alt={investorProfile?.firmName ?? "Investor Firm"}
                fallback={investorProfile?.firmName ?? user.name ?? "Investor"}
                className="h-10 w-10 rounded-lg border border-border/60 bg-background p-1"
                fallbackClassName="rounded-lg border border-border/60 bg-background text-xs text-muted-foreground"
                imgClassName="p-1"
              />
              <div>
                <p className="text-sm font-semibold">{investorProfile?.firmName ?? "Add firm name in profile"}</p>
                <p className="text-xs text-muted-foreground">{investorProfile?.roleTitle ?? "Investor role title"}</p>
              </div>
            </div>
            <p className="text-sm font-medium">Investor signal workspace</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Review founder applications, evaluate active ventures, and track thesis-fit signals from one investor workspace.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Workspace data is sourced from live applications, venture records, and meetings only.
            </p>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <span className="rounded-md border border-border/60 px-2 py-1">
                Ticket size: {investorProfile?.ticketSize ?? investorOperatingProfile?.ticketSize ?? "Set in profile"}
              </span>
              <span className="rounded-md border border-border/60 px-2 py-1">
                Looking for: {investorProfile?.lookingFor ?? investorProfile?.focus ?? "Set in profile"}
              </span>
              <span className="rounded-md border border-border/60 px-2 py-1">
                Stage: {investorOperatingProfile?.investmentStage ?? "Set in profile"}
              </span>
              <span className="rounded-md border border-border/60 px-2 py-1">
                LinkedIn: {investorProfile?.linkedin ? "Available" : "Missing"}
              </span>
            </div>
            <Link href="/app/kreatorboard" className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-300">
              Open investor workspace <ArrowRight className="h-3 w-3" />
            </Link>
            <a href="https://t.me/rishu" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-300">
              Connect with Rishu on Telegram <ArrowRight className="h-3 w-3" />
            </a>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <p className="text-sm font-medium">Network Updates</p>
            <p className="mt-2 text-xs text-muted-foreground">Use founder and startup directories for live discovery.</p>
            <div className="mt-4 flex gap-3 text-xs">
              <Link href="/app/founders" className="text-blue-300">Founders</Link>
              <Link href="/startups" className="text-blue-300">Startups</Link>
            </div>
            {investorProjects.length > 0 ? (
              <div className="mt-4 space-y-2">
                {investorProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="rounded-md border border-border/50 p-2">
                    <p className="text-xs font-medium">{project.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {project.chainFocus ?? "General"} | {project.stage}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <p className="text-sm font-medium">Admin controls</p>
          <p className="mt-2 text-xs text-muted-foreground">Manage jobs, leads, events, pitch reports, moderation, and hiring interests.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/app/admin" className="inline-flex items-center gap-2 text-blue-300">
              Open admin center <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/app/admin/hiring-interests" className="inline-flex items-center gap-2 text-blue-300">
              Hiring submissions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      ) : null}

      {isInvestor ? (
        <section className="rounded-2xl border border-border/50 bg-card p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Investor Modules</p>
            <Link href="/app/kreatorboard" className="text-xs text-cyan-300">
              Open Investor Workspace
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
            <span className="rounded-md border border-border/60 px-2 py-1">Founder Discovery</span>
            <span className="rounded-md border border-border/60 px-2 py-1">Startup Signals</span>
            <span className="rounded-md border border-border/60 px-2 py-1">Investor Workspace</span>
            <span className="rounded-md border border-border/60 px-2 py-1">Pipeline Notes</span>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/app/profile" className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-blue-500/30">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
              <User className="h-4 w-4 text-blue-300" />
            </div>
            <span className="text-sm font-medium">Profile</span>
          </div>
          <p className="text-2xl font-semibold">{profileComplete ? "Complete" : "In progress"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Keep your identity and company details current.</p>
        </Link>
        <Link
          href={isFounder ? "/app/founder-os" : isBuilder ? "/app/builder-projects" : "/app/projects"}
          className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-green-500/30"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <FolderKanban className="h-4 w-4 text-green-300" />
            </div>
            <span className="text-sm font-medium">{isFounder ? "Startups" : isBuilder ? "Builder Projects" : "Projects"}</span>
          </div>
          <p className="text-2xl font-semibold">{isFounder ? founderStartupCount : isBuilder ? builderProjects.length : projectCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isFounder
              ? "Add and manage startups for public founder visibility."
              : isBuilder
                ? "Show your shipped work, open-source contributions, and technical range."
                : "Manage your startup profile and visibility."}
          </p>
        </Link>
        <Link
          href={isInvestor ? "/app/kreatorboard" : "/app/apply"}
          className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-emerald-500/30"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
            <span className="text-sm font-medium">{isInvestor ? "Investor Workspace" : "Applications"}</span>
          </div>
          <p className="text-2xl font-semibold">{isInvestor ? "Soon" : applications}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isInvestor ? "Investor dashboard is launching with creator and startup signals." : "Track program applications and next actions."}
          </p>
        </Link>
      </section>
    </div>
  );
}
