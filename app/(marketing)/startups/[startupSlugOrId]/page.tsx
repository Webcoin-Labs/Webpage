import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Github, Globe, Linkedin, Star, Twitter } from "lucide-react";
import { getStartupHubDetailBySlugOrId } from "@/lib/startup-hub";
import { CompanyLogo } from "@/components/common/CompanyLogo";

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
  const startup = await getStartupHubDetailBySlugOrId(startupSlugOrId);
  if (!startup) return { title: "Startup - Webcoin Labs" };
  return {
    title: `${startup.card.name} - Webcoin Labs`,
    description: startup.card.tagline ?? startup.card.name,
  };
}

export default async function StartupPublicPage({ params }: Params) {
  const { startupSlugOrId } = await params;
  const startup = await getStartupHubDetailBySlugOrId(startupSlugOrId);

  if (!startup) notFound();

  const avgRating = startup.card.ratingAverage;
  const startupWebsite = normalizeExternalLink(startup.startupLinks.website ?? startup.canonicalVenture?.website);
  const startupGithub = normalizeExternalLink(startup.startupLinks.githubRepo ?? startup.canonicalVenture?.githubUrl);
  const startupTwitter = normalizeExternalLink(startup.startupLinks.twitter, "x");
  const startupLinkedin = normalizeExternalLink(startup.startupLinks.linkedin);
  const founderTwitter = normalizeExternalLink(startup.founderLinks.twitter, "x");
  const founderLinkedin = normalizeExternalLink(startup.founderLinks.linkedin);

  return (
    <div className="min-h-screen pt-24">
      <section className="container mx-auto max-w-3xl px-6 py-10">
        <Link href="/startups" className="text-sm text-muted-foreground hover:text-foreground">
          Back to startups
        </Link>
        <div className="mt-4 rounded-xl border border-border/60 bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold">{startup.card.name}</h1>
            <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
              {startup.card.stage ?? "Stage not set"} | {startup.card.chain ?? "Chain not set"}
            </span>
          </div>
          {startup.card.tagline ? <p className="mt-1 text-sm text-muted-foreground">{startup.card.tagline}</p> : null}

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <CompanyLogo
              src={startup.founderCompanyLogoUrl}
              alt={startup.card.founderCompanyName ?? "Company"}
              fallback={startup.card.founderCompanyName ?? "Company"}
              className="h-7 w-7 rounded-md border border-border/60 bg-background p-0.5"
              fallbackClassName="rounded-md border border-border/60 bg-background text-[9px] text-muted-foreground"
              imgClassName="p-0.5"
            />
            <span className="font-medium text-foreground">{startup.card.founderName}</span>
            <span>{startup.card.founderRoleTitle ?? "Founder"}</span>
            {startup.card.isHiring ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                Hiring
              </span>
            ) : null}
            {startup.startupLinks.pitchDeckUrl ? (
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200">
                Deck attached
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
              Why this startup: {startup.founderSignals.whyThisStartup ?? "N/A"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Target user: {startup.founderSignals.targetUser ?? "N/A"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Business model: {startup.founderSignals.businessModel ?? "N/A"}
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
                  <p key={`${rating.reviewerName}-${index}`}>
                    {rating.reviewerName}: {rating.score}/5 {rating.note ? `- ${rating.note}` : ""}
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
