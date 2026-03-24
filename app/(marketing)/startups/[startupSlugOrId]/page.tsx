import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Github, Globe, Linkedin, Star, Twitter } from "lucide-react";
import { db } from "@/server/db/client";
import { CompanyLogo } from "@/components/common/CompanyLogo";
import { ProfileAffiliationTag } from "@/components/common/ProfileAffiliationTag";
import { getFounderAffiliation } from "@/lib/affiliation";

type Params = { params: Promise<{ startupSlugOrId: string }> };

function normalizeExternalLink(value: string | null | undefined, kind: "x" | "url" = "url") {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (kind === "x") return `https://x.com/${trimmed.replace(/^@+/, "")}`;
  return `https://${trimmed}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { startupSlugOrId } = await params;
  const startup = await db.startup.findFirst({
    where: {
      AND: [
        { OR: [{ id: startupSlugOrId }, { slug: startupSlugOrId }] },
        { founder: { founderProfile: { is: { publicVisible: true } } } },
      ],
    },
    select: { name: true, tagline: true },
  });
  if (!startup) return { title: "Startup - Webcoin Labs" };
  return {
    title: `${startup.name} - Webcoin Labs`,
    description: startup.tagline ?? startup.name,
  };
}

export default async function StartupPublicPage({ params }: Params) {
  const { startupSlugOrId } = await params;
  const startup = await db.startup.findFirst({
    where: {
      AND: [
        { OR: [{ id: startupSlugOrId }, { slug: startupSlugOrId }] },
        { founder: { founderProfile: { is: { publicVisible: true } } } },
      ],
    },
    include: {
      founder: {
        select: {
          id: true,
          name: true,
          founderProfile: {
            select: {
              companyName: true,
              companyLogoUrl: true,
              roleTitle: true,
              twitter: true,
              linkedin: true,
              website: true,
              isHiring: true,
              currentNeeds: true,
            },
          },
          founderProfileExtended: {
            select: {
              targetUser: true,
              businessModel: true,
              whyThisStartup: true,
            },
          },
        },
      },
      githubActivity: true,
      ratings: {
        select: {
          score: true,
          note: true,
          reviewer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!startup) notFound();

  const founderAffiliation = getFounderAffiliation(startup.founder.founderProfile);
  const avgRating = startup.ratings.length
    ? startup.ratings.reduce((acc, entry) => acc + entry.score, 0) / startup.ratings.length
    : null;
  const lookingForInvestors = (startup.founder.founderProfile?.currentNeeds ?? []).some((item) => /fund|investor|raise/i.test(item));
  const startupWebsite = normalizeExternalLink(startup.website);
  const startupGithub = normalizeExternalLink(startup.githubRepo);
  const startupTwitter = normalizeExternalLink(startup.twitter, "x");
  const startupLinkedin = normalizeExternalLink(startup.linkedin);
  const founderTwitter = normalizeExternalLink(startup.founder.founderProfile?.twitter, "x");
  const founderLinkedin = normalizeExternalLink(startup.founder.founderProfile?.linkedin);

  return (
    <div className="min-h-screen pt-24">
      <section className="container mx-auto max-w-3xl px-6 py-10">
        <Link href="/startups" className="text-sm text-muted-foreground hover:text-foreground">
          Back to startups
        </Link>
        <div className="mt-4 rounded-xl border border-border/60 bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold">{startup.name}</h1>
            <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
              {startup.stage} | {startup.chainFocus}
            </span>
          </div>
          {startup.tagline ? <p className="mt-1 text-sm text-muted-foreground">{startup.tagline}</p> : null}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <CompanyLogo
              src={startup.founder.founderProfile?.companyLogoUrl}
              alt={startup.founder.founderProfile?.companyName ?? "Company"}
              fallback={startup.founder.founderProfile?.companyName ?? "Company"}
              className="h-7 w-7 rounded-md border border-border/60 bg-background p-0.5"
              fallbackClassName="rounded-md border border-border/60 bg-background text-[9px] text-muted-foreground"
              imgClassName="p-0.5"
            />
            <span className="font-medium text-foreground">{startup.founder.name ?? "Founder"}</span>
            {founderAffiliation ? <ProfileAffiliationTag label={founderAffiliation.label} variant="founder" /> : null}
            <span>{startup.founder.founderProfile?.roleTitle ?? "Founder"}</span>
            {startup.founder.founderProfile?.isHiring ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                Hiring
              </span>
            ) : null}
            {lookingForInvestors ? (
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                Looking for investors
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border/50 p-3">
              <p className="text-xs font-medium">Problem</p>
              <p className="mt-1 text-xs text-muted-foreground">{startup.problem ?? "Not provided yet."}</p>
            </div>
            <div className="rounded-md border border-border/50 p-3">
              <p className="text-xs font-medium">Solution</p>
              <p className="mt-1 text-xs text-muted-foreground">{startup.solution ?? "Not provided yet."}</p>
            </div>
            <div className="rounded-md border border-border/50 p-3">
              <p className="text-xs font-medium">Achievements / Traction</p>
              <p className="mt-1 text-xs text-muted-foreground">{startup.traction ?? "Not provided yet."}</p>
            </div>
            <div className="rounded-md border border-border/50 p-3">
              <p className="text-xs font-medium">Users / Raised</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {startup.usersCount ?? "-"} users | {startup.revenue ?? "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border/50 p-3">
            <p className="text-xs font-medium">Founder Profile Signals</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Why this startup: {startup.founder.founderProfileExtended?.whyThisStartup ?? "N/A"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target user: {startup.founder.founderProfileExtended?.targetUser ?? "N/A"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Business model: {startup.founder.founderProfileExtended?.businessModel ?? "N/A"}
            </p>
          </div>

          <div className="mt-4 rounded-md border border-border/50 p-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium">Founder community rating</p>
              {avgRating ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> {avgRating.toFixed(1)} / 5 ({startup.ratings.length})
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">No ratings yet</span>
              )}
            </div>
            {startup.ratings.length > 0 ? (
              <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                {startup.ratings.map((rating, index) => (
                  <p key={`${rating.reviewer.name ?? "reviewer"}-${index}`}>
                    {rating.reviewer.name ?? "Founder"}: {rating.score}/5 {rating.note ? `- ${rating.note}` : ""}
                  </p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {startupWebsite ? (
              <a href={startupWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                <Globe className="h-3.5 w-3.5" /> Website
              </a>
            ) : null}
            {startupGithub ? (
              <a href={startupGithub} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
            ) : null}
            {startupTwitter ? (
              <a href={startupTwitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                <Twitter className="h-3.5 w-3.5" /> Startup X
              </a>
            ) : null}
            {startupLinkedin ? (
              <a href={startupLinkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                <Linkedin className="h-3.5 w-3.5" /> Startup LinkedIn
              </a>
            ) : null}
            {founderTwitter ? (
              <a href={founderTwitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                <Twitter className="h-3.5 w-3.5" /> Founder X
              </a>
            ) : null}
            {founderLinkedin ? (
              <a href={founderLinkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300">
                <Linkedin className="h-3.5 w-3.5" /> Founder LinkedIn
              </a>
            ) : null}
          </div>

          {startup.githubActivity ? (
            <div className="mt-4 rounded-md border border-border/50 p-3">
              <p className="text-xs font-medium">Project Activity</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {startup.githubActivity.repoName} | Last commit: {startup.githubActivity.lastCommitMessage ?? "N/A"}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
