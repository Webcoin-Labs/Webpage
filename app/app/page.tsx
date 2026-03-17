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
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const [
    applications,
    projectCount,
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
  ] = await Promise.all([
    prisma.application.count({ where: { userId: user.id } }),
    prisma.project.count({ where: { ownerUserId: user.id } }),
    prisma.builderProfile.findUnique({ where: { userId: user.id } }),
    prisma.founderProfile.findUnique({ where: { userId: user.id } }),
    prisma.investorProfile.findUnique({ where: { userId: user.id } }),
    prisma.introRequest.count({ where: { founderId: user.id } }),
    prisma.pitchDeck.findFirst({
      where: {
        userId: user.id,
        OR: [
          { uploadAsset: { is: null } },
          { uploadAsset: { is: { status: { in: ["ACTIVE", "FLAGGED", "REPROCESSING"] } } } },
        ],
      },
      include: { reports: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    isFounder ? getRecommendedBuildersForFounder(user.id, 6) : Promise.resolve([]),
    isBuilder ? getRecommendedProjectsForBuilder(user.id, 6) : Promise.resolve([]),
    prisma.jobPost.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { id: true, name: true } } },
      take: 6,
    }),
    isBuilder ? prisma.jobApplication.count({ where: { userId: user.id } }) : Promise.resolve(0),
    isFounder ? prisma.jobPost.count({ where: { createdByUserId: user.id } }) : Promise.resolve(0),
    isInvestor
      ? prisma.project.findMany({
          where: { publicVisible: true },
          select: { id: true, name: true, stage: true, chainFocus: true, tagline: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
    isFounder
      ? prisma.hiringInterest.findMany({
          where: { founderId: user.id },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]),
    isFounder ? prisma.introRequest.count({ where: { founderId: user.id, type: "KOL" } }) : Promise.resolve(0),
    isBuilder
      ? prisma.founderProfile.findMany({
          where: { isHiring: true, userId: { not: user.id } },
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { hiringInterests: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: 4,
        })
      : Promise.resolve([]),
    isFounder
      ? prisma.introRequest.findFirst({
          where: { founderId: user.id, type: "KOL" },
          select: { id: true, status: true, updatedAt: true, requestPayload: true },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
    prisma.project.findFirst({
      where: { ownerUserId: user.id },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    isFounder
      ? prisma.introRequest.findFirst({
          where: { founderId: user.id },
          select: { id: true, type: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
    isBuilder
      ? prisma.jobApplication.findFirst({
          where: { userId: user.id },
          select: {
            id: true,
            updatedAt: true,
            job: { select: { title: true } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const latestReport = latestDeck?.reports[0];

  const builderCompletion = getCompletionScore([
    builderProfile?.title,
    builderProfile?.headline,
    builderProfile?.skills,
    builderProfile?.preferredChains,
    builderProfile?.openTo,
    builderProfile?.bio,
    builderProfile?.affiliation || builderProfile?.independent,
    builderProfile?.openToWork,
    builderProfile?.github || builderProfile?.portfolioUrl,
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
  ]);
  const completion = isBuilder ? builderCompletion : isFounder ? founderCompletion : isInvestor ? investorCompletion : 100;
  const profileComplete = completion >= 70;

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

  return (
    <div className="space-y-8 py-8">
      <section className="rounded-2xl border border-border/50 bg-card p-6">
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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold">Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
                {isFounder && founderAffiliation ? <ProfileAffiliationTag label={founderAffiliation.label} variant="founder" /> : null}
                {isBuilder ? <ProfileAffiliationTag label={builderAffiliation.label} variant={builderAffiliation.variant} /> : null}
                {isInvestor && investorProfile?.firmName ? <ProfileAffiliationTag label={investorProfile.firmName} /> : null}
              </div>
              <p className="text-sm text-muted-foreground">Your Webcoin Labs founder-builder workspace.</p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-cyan-500/40 px-3 py-1 text-xs font-medium text-cyan-300">
            {user.role}
          </span>
        </div>
      </section>

      {!profileComplete && (isBuilder || isFounder || isInvestor) ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Complete your profile to unlock full discovery and matching</p>
            <p className="text-sm text-muted-foreground">Profiles drive recommendations, intros, and hiring outcomes.</p>
          </div>
          <Link href="/app/profile" className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/20">
            Complete Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium">Profile Completion</span>
          </div>
          <p className="text-2xl font-semibold">{completion}%</p>
          <div className="mt-2 h-2 rounded-full bg-border">
            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${completion}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-green-300" />
            <span className="text-sm font-medium">Projects</span>
          </div>
          <p className="text-2xl font-semibold">{projectCount}</p>
          <Link href="/app/projects" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-300">
            Manage projects <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
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
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-300" />
            <span className="text-sm font-medium">Latest AI Pitch Report</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {latestDeck ? `${latestDeck.originalFileName} | ${latestReport?.status ?? "QUEUED"}` : "No pitch deck uploaded yet."}
          </p>
          <p className="mt-1 text-xs text-emerald-300">Clarity: {latestReport?.clarityScore ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5">
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
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Company Identity</p>
                  <p className="text-xs text-muted-foreground">LinkedIn-style startup layer for founder discovery.</p>
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
                  alt={founderProfile?.companyName ?? "Company"}
                  fallback={founderProfile?.companyName ?? "Company"}
                  className="h-14 w-14 rounded-xl border border-border/60 bg-background p-1"
                  fallbackClassName="rounded-xl border border-border/60 bg-background text-sm text-muted-foreground"
                  imgClassName="p-1"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold">{founderProfile?.companyName ?? "Add company name"}</p>
                    {founderAffiliation ? <ProfileAffiliationTag label={founderAffiliation.label} variant="founder" /> : null}
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
                <span>Jobs posted: {myPostedJobs}</span>
                <span>Intro requests: {introRequests}</span>
                {founderProfile?.website ? (
                  <a href={founderProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200">
                    Website
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Recommended Builders</p>
                <Link href="/builders" className="text-xs text-blue-300">Browse all</Link>
              </div>
              {founderMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">Complete founder profile fields to unlock stronger builder recommendations.</p>
              ) : (
                <div className="space-y-3">
                  {founderMatches.map((match) => {
                    const affiliation = getBuilderAffiliation(match.builder);
                    return (
                      <div key={match.builder.id} className="rounded-lg border border-border/50 p-3">
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
                          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                            {match.match.score}% match
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{match.match.reasons.join(" | ")}</p>
                        <Link href={`/builders/${match.builder.handle ?? match.builder.user.id}`} className="mt-2 inline-block text-xs text-blue-300">
                          View profile
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
                <MessageSquare className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-medium">Hiring Interests</p>
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
                  <Link href="/app/hiring" className="inline-flex items-center gap-1 text-xs text-blue-300">
                    Open hiring inbox <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-medium">KOL Premium</p>
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

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-medium">Pitch Deck & AI Report</p>
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
              <Link href="/pitchdeck" className="mt-3 inline-flex items-center gap-1 text-xs text-blue-300">
                Open pitch area <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
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
            <p className="mb-3 text-sm font-medium">Recent Curated Projects</p>
            {investorProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public projects available yet.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {investorProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div>
                      <p>{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.chainFocus ?? "General"} | {project.stage}</p>
                    </div>
                    <Link href={`/projects/${project.id}`} className="text-xs text-blue-300">Review</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <p className="text-sm font-medium">Network Updates</p>
            <p className="mt-2 text-xs text-muted-foreground">Use projects and builders directories for live discovery.</p>
            <div className="mt-4 flex gap-3 text-xs">
              <Link href="/projects" className="text-blue-300">Projects</Link>
              <Link href="/builders" className="text-blue-300">Builders</Link>
            </div>
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
        <Link href="/app/projects" className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-green-500/30">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <FolderKanban className="h-4 w-4 text-green-300" />
            </div>
            <span className="text-sm font-medium">Projects</span>
          </div>
          <p className="text-2xl font-semibold">{projectCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Manage your startup profile and visibility.</p>
        </Link>
        <Link href="/app/apply" className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-emerald-500/30">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            </div>
            <span className="text-sm font-medium">Applications</span>
          </div>
          <p className="text-2xl font-semibold">{applications}</p>
          <p className="mt-1 text-xs text-muted-foreground">Track program applications and next actions.</p>
        </Link>
      </section>
    </div>
  );
}
